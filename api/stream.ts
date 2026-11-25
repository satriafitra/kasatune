import { Ytdl, Client, chooseFormat } from '@distube/ytdl-core';
import { parseScript } from 'meriyah';
import vm from 'node:vm';
import { Readable } from 'stream';

const ANDROID_USER_AGENT =
  'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip';
const IOS_USER_AGENT =
  'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)';
const WEB_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const EMBED_HOST = 'https://www.reddit.com/';

// Vercel Serverless Functions have a 4.5MB buffered limit; bounded Range chunks stream cleanly & never overflow
const DEFAULT_MAX_CHUNK_BYTES = 1572864; // 1.5MB for VisionOS / Archive / SoundCloud Buffer
const MOBILE_MAX_CHUNK_BYTES = 524288; // 512KB cap required by YouTube Android/iOS CDN endpoints

// In-memory cache for resolved format URLs / assembled buffers to make Range scrubbing & repeated plays instant
interface CachedFormat {
  url?: string;
  buffer?: Buffer;
  mimeType: string;
  contentLength?: string;
  userAgent?: string;
  maxChunkBytes: number;
  expires: number;
}
const urlCache = new Map<string, CachedFormat>();

let cachedScClientId: { id: string; expires: number } | null = null;
async function getSoundCloudClientId(): Promise<string | null> {
  const now = Date.now();
  if (cachedScClientId && cachedScClientId.expires > now) {
    return cachedScClientId.id;
  }
  try {
    const scPage = await fetch('https://soundcloud.com', {
      headers: { 'User-Agent': WEB_USER_AGENT },
    }).then((r) => r.text());
    const scripts = [
      ...scPage.matchAll(/https:\/\/a-v2\.sndcdn\.com\/assets\/[^"']+\.js/g),
    ].map((m) => m[0]);
    for (const sUrl of scripts.slice(-6)) {
      const js = await fetch(sUrl).then((r) => r.text());
      const m = js.match(/client_id:"([a-zA-Z0-9]{20,40})"/);
      if (m) {
        cachedScClientId = { id: m[1], expires: now + 60 * 60 * 1000 };
        return m[1];
      }
    }
  } catch {}
  return null;
}

async function resolveViaAndroidInnerTube(videoId: string): Promise<Omit<CachedFormat, 'expires'> | null> {
  try {
    const visitorData = await fetchVisitorData();
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': ANDROID_USER_AGENT,
      },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '20.10.38',
            androidSdkVersion: 30,
            visitorData,
            hl: 'en',
            gl: 'US',
          },
        },
        contentCheckOk: true,
        racyCheckOk: true,
      }),
    });

    if (!res.ok) return null;
    const data: any = await res.json();
    if (data?.playabilityStatus?.status !== 'OK') return null;

    const adaptive: any[] = data?.streamingData?.adaptiveFormats || [];
    const audioOnly = adaptive.filter((f) => f.mimeType?.startsWith('audio/') && f.url);
    const mp4Audio = audioOnly
      .filter((f) => f.mimeType.includes('audio/mp4'))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    const picked = mp4Audio[0] || audioOnly.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

    if (!picked?.url) return null;
    return {
      url: picked.url,
      mimeType: picked.mimeType || 'audio/mp4; codecs="mp4a.40.2"',
      contentLength: picked.contentLength ? String(picked.contentLength) : undefined,
      maxChunkBytes: MOBILE_MAX_CHUNK_BYTES,
    };
  } catch {
    return null;
  }
}

async function resolveViaSoundCloud(
  artist: string,
  title: string,
  rawQuery: string,
  durationSec: number
): Promise<Omit<CachedFormat, 'expires'> | null> {
  try {
    const cid = await getSoundCloudClientId();
    if (!cid) return null;

    const cleanTitleStr = (title || rawQuery)
      .replace(/\(.*?\)|\[.*?\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const cleanArtistStr = artist.trim();
    const searchTerm = cleanArtistStr ? `${cleanArtistStr} ${cleanTitleStr}` : rawQuery;

    const sr = await fetch(
      `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(searchTerm)}&limit=15&client_id=${cid}`,
      { headers: { 'User-Agent': WEB_USER_AGENT } }
    ).then((r) => r.json());

    const qLower = rawQuery.toLowerCase();
    const allowLive = qLower.includes('live') || qLower.includes('acoustic');
    const forbidden = [
      'cover', 'remix', 'flip', 'slowed', 'reverb', 'karaoke',
      'instrumental', 'nightcore', 'sped up', 'speed up', 'dj ',
      'mashup', 'edit', 'gym', 'motivation', 'podcast', 'tutorial',
    ];
    const titleWords = cleanTitleStr
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    const candidates = (sr?.collection || []).filter((t: any) => {
      if (!t?.duration || t.duration < 45000 || t.duration > 660000) return false;
      const hasAac = t.media?.transcodings?.some((x: any) => x.format?.mime_type?.includes('audio/mp4'));
      if (!hasAac) return false;

      const tLower = `${t.title || ''}`.toLowerCase();
      if (forbidden.some((f) => tLower.includes(f))) return false;
      if (!allowLive && tLower.includes('live')) return false;
      if (titleWords.length > 0 && !titleWords.every((w) => tLower.includes(w))) return false;

      if (durationSec > 30) {
        const diff = Math.abs(t.duration / 1000 - durationSec);
        if (diff > 25) return false;
      }
      return true;
    });

    if (candidates.length === 0) return null;

    candidates.sort((a: any, b: any) => {
      if (durationSec > 30) {
        return Math.abs(a.duration / 1000 - durationSec) - Math.abs(b.duration / 1000 - durationSec);
      }
      return (b.playback_count || 0) - (a.playback_count || 0);
    });

    const best = candidates[0];
    const aacTr = best.media.transcodings.find((x: any) => x.format?.mime_type?.includes('audio/mp4'));
    const trInfo: any = await fetch(`${aacTr.url}?client_id=${cid}`, {
      headers: { Origin: 'https://soundcloud.com', Referer: 'https://soundcloud.com/' },
    }).then((r) => r.json());

    if (!trInfo?.url) return null;
    const m3u8 = await fetch(trInfo.url).then((r) => r.text());
    const initMatch = /#EXT-X-MAP:URI="([^"]+)"/.exec(m3u8);
    const segUrls = m3u8
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http'));
    const allUrls = [initMatch?.[1], ...segUrls].filter(Boolean) as string[];
    if (allUrls.length === 0) return null;

    const bufs = await Promise.all(allUrls.map((u) => fetch(u).then((r) => r.arrayBuffer())));
    const assembled = Buffer.concat(bufs.map((b) => Buffer.from(b)));

    return {
      buffer: assembled,
      mimeType: 'audio/mp4',
      contentLength: String(assembled.length),
      maxChunkBytes: DEFAULT_MAX_CHUNK_BYTES,
    };
  } catch {
    return null;
  }
}

async function resolveViaArchiveOrg(
  artist: string,
  title: string,
  rawQuery: string
): Promise<Omit<CachedFormat, 'expires'> | null> {
  try {
    const cleanTitleStr = (title || rawQuery)
      .replace(/\(.*?\)|\[.*?\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const cleanArtistStr = artist.trim();
    if (!cleanArtistStr || !cleanTitleStr) return null;

    const titleWords = cleanTitleStr
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2);
    if (titleWords.length === 0) return null;

    const queries = [
      `title:("${cleanTitleStr}") AND creator:("${cleanArtistStr}") AND mediatype:(audio)`,
      `creator:("${cleanArtistStr}") AND mediatype:(audio)`,
    ];

    const seenIds = new Set<string>();
    const candidateIds: string[] = [];

    for (const aq of queries) {
      const res: any = await fetch(
        `https://archive.org/advancedsearch.php?q=${encodeURIComponent(aq)}&fl[]=identifier,title&rows=8&output=json`,
        { signal: AbortSignal.timeout(4000) }
      ).then((r) => r.json()).catch(() => null);

      for (const doc of res?.response?.docs || []) {
        if (!doc?.identifier || seenIds.has(doc.identifier)) continue;
        const s = `${doc.identifier} ${doc.title || ''}`.toLowerCase();
        if (
          s.includes('cover') ||
          s.includes('tribute') ||
          s.includes('karaoke') ||
          s.includes('interview') ||
          s.includes('podcast')
        ) {
          continue;
        }
        seenIds.add(doc.identifier);
        candidateIds.push(doc.identifier);
      }
      if (candidateIds.length >= 4) break;
    }

    if (candidateIds.length === 0) return null;

    const fileLists = await Promise.all(
      candidateIds.slice(0, 4).map(async (ident) => {
        try {
          const m: any = await fetch(`https://archive.org/metadata/${ident}/files`, {
            signal: AbortSignal.timeout(4000),
          }).then((r) => r.json());
          return { ident, files: (m?.result || []) as any[] };
        } catch {
          return { ident, files: [] as any[] };
        }
      })
    );

    for (const { ident, files } of fileLists) {
      const matched = files.find((f) => {
        const name = (f.name || '').toLowerCase();
        if (!name.endsWith('.mp3') && !name.endsWith('.m4a') && !name.endsWith('.ogg')) return false;
        if (name.includes('64kb') || name.includes('cover') || name.includes('demo')) return false;
        if (Number(f.size || 0) < 400000) return false;
        return titleWords.every((w) => name.includes(w));
      });

      if (matched) {
        const fileUrl = `https://archive.org/download/${ident}/${encodeURIComponent(matched.name)}`;
        const mimeType = matched.name.toLowerCase().endsWith('.m4a')
          ? 'audio/mp4'
          : matched.name.toLowerCase().endsWith('.ogg')
          ? 'audio/ogg'
          : 'audio/mpeg';

        return {
          url: fileUrl,
          mimeType,
          contentLength: matched.size ? String(matched.size) : undefined,
          maxChunkBytes: DEFAULT_MAX_CHUNK_BYTES,
        };
      }
    }
  } catch {}
  return null;
}

async function fetchVisitorData(): Promise<string | undefined> {
  try {
    const r = await fetch('https://www.youtube.com/youtubei/v1/visitor_id?prettyPrint=false', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': WEB_USER_AGENT },
      body: JSON.stringify({
        context: { client: { clientName: 'WEB', clientVersion: '2.20261027.01.00' } },
      }),
    });
    if (!r.ok) return undefined;
    const j: any = await r.json();
    return j?.responseContext?.visitorData || undefined;
  } catch {
    return undefined;
  }
}

async function resolveViaIosInnerTube(videoId: string): Promise<Omit<CachedFormat, 'expires'> | null> {
  try {
    const visitorData = await fetchVisitorData();
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': IOS_USER_AGENT,
      },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: 'IOS',
            clientVersion: '20.10.4',
            deviceMake: 'Apple',
            deviceModel: 'iPhone16,2',
            osName: 'iPhone',
            osVersion: '18.3.2.22D82',
            visitorData,
            hl: 'en',
            gl: 'US',
          },
        },
        contentCheckOk: true,
        racyCheckOk: true,
      }),
    });

    if (!res.ok) return null;
    const data: any = await res.json();
    if (data?.playabilityStatus?.status !== 'OK') return null;

    const adaptive: any[] = data?.streamingData?.adaptiveFormats || [];
    const audioOnly = adaptive.filter(
      (f) => f.mimeType?.startsWith('audio/') && f.url
    );
    const mp4Audio = audioOnly
      .filter((f) => f.mimeType.includes('audio/mp4'))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    const picked = mp4Audio[0] || audioOnly.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

    if (!picked?.url) return null;
    return {
      url: picked.url,
      mimeType: picked.mimeType || 'audio/mp4; codecs="mp4a.40.2"',
      contentLength: picked.contentLength ? String(picked.contentLength) : undefined,
      maxChunkBytes: MOBILE_MAX_CHUNK_BYTES,
    };
  } catch {
    return null;
  }
}

// In-process VM player solver (zero worker_threads / import.meta.url filesystem dependency for Vercel Lambda)
async function resolveViaEmbeddedInProcess(videoId: string): Promise<Omit<CachedFormat, 'expires'> | null> {
  try {
    const embedHtml = await fetch(`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?html5=1`, {
      headers: { 'User-Agent': WEB_USER_AGENT, Referer: EMBED_HOST },
    }).then((r) => r.text());

    const cfgMatch = /ytcfg\.set\((\{[\s\S]*?\})\);/u.exec(embedHtml);
    const cfg: any = cfgMatch ? JSON.parse(cfgMatch[1]) : {};
    const visitorData = cfg.VISITOR_DATA;
    const hostFlags =
      cfg?.WEB_PLAYER_CONTEXT_CONFIGS?.WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER?.encryptedHostFlags;

    const iframeJs = await fetch('https://www.youtube.com/iframe_api', {
      headers: { 'User-Agent': WEB_USER_AGENT },
    }).then((r) => r.text());
    const playerId = /player\\?\/([\da-f]{8})\\?\//u.exec(iframeJs)?.[1];
    if (!playerId) return null;

    const playerSource = await fetch(
      `https://www.youtube.com/s/player/${encodeURIComponent(playerId)}/player_ias.vflset/en_US/base.js`,
      { headers: { 'User-Agent': WEB_USER_AGENT } }
    ).then((r) => r.text());
    const sigTs = /signatureTimestamp:(\d+)/u.exec(playerSource)?.[1];

    const playerRes: any = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': WEB_USER_AGENT,
        Origin: 'https://www.youtube.com',
      },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: 'WEB_EMBEDDED_PLAYER',
            clientVersion: '2.20261027.01.00',
            visitorData,
            hl: 'en',
            gl: 'US',
          },
          thirdParty: { embedUrl: EMBED_HOST },
        },
        playbackContext: {
          contentPlaybackContext: {
            html5Preference: 'HTML5_PREF_WANTS',
            signatureTimestamp: sigTs ? Number(sigTs) : undefined,
            encryptedHostFlags: hostFlags,
          },
        },
      }),
    }).then((r) => r.json());

    if (playerRes?.playabilityStatus?.status !== 'OK') return null;
    const adaptive: any[] = playerRes?.streamingData?.adaptiveFormats || [];
    const audioOnly = adaptive.filter((f) => f.mimeType?.startsWith('audio/') && (f.url || f.signatureCipher));
    const mp4 = audioOnly
      .filter((f) => f.mimeType.includes('audio/mp4'))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    const picked = mp4[0] || audioOnly[0];
    if (!picked) return null;

    if (picked.url && !picked.signatureCipher) {
      return {
        url: picked.url,
        mimeType: picked.mimeType || 'audio/mp4; codecs="mp4a.40.2"',
        contentLength: picked.contentLength ? String(picked.contentLength) : undefined,
        userAgent: WEB_USER_AGENT,
        maxChunkBytes: DEFAULT_MAX_CHUNK_BYTES,
      };
    }

    // Solve signatureCipher + n-challenge strictly inside in-process vm context (no worker_threads)
    const program: any = parseScript(playerSource, { ranges: true });
    const [first, second] = program.body;
    let block: any = null;
    let skip = 0;
    if (program.body.length === 2 && second?.type === 'ExpressionStatement') {
      const call = second.expression;
      if (call.type === 'CallExpression' && call.callee.type === 'FunctionExpression' && call.callee.body) {
        block = call.callee.body;
        const head = block.body[0];
        if (
          head?.type === 'VariableDeclaration' &&
          head.declarations[0]?.id?.name === 'window'
        ) {
          skip = 1;
        }
      }
    } else if (program.body.length === 1 && first?.type === 'ExpressionStatement') {
      const call = first.expression;
      if (call.type === 'CallExpression' && call.callee.object?.body) {
        block = call.callee.object.body;
      }
    }
    if (!block) return null;

    const isAlrYes = (node: any) =>
      node.type === 'ExpressionStatement' &&
      node.expression.type === 'CallExpression' &&
      node.expression.callee.type === 'MemberExpression' &&
      node.expression.arguments[0]?.value === 'alr' &&
      node.expression.arguments[1]?.value === 'yes';

    const kept = block.body
      .slice(skip)
      .filter(
        (node: any) =>
          node.type !== 'ExpressionStatement' ||
          node.expression.type === 'AssignmentExpression' ||
          node.expression.type === 'Literal'
      );

    const builderNodes: any[] = [];
    for (const node of kept) {
      if (node.type === 'FunctionDeclaration' && node.id && !node.async && node.body?.body.some(isAlrYes)) {
        builderNodes.push(node.id);
      } else if (
        node.type === 'ExpressionStatement' &&
        node.expression.type === 'AssignmentExpression' &&
        node.expression.right?.type === 'FunctionExpression' &&
        !node.expression.right.async &&
        node.expression.right.body?.body.some(isAlrYes)
      ) {
        builderNodes.push(node.expression.left);
      } else if (node.type === 'VariableDeclaration') {
        for (const decl of node.declarations) {
          if (decl.init?.type === 'FunctionExpression' && !decl.init.async && decl.init.body?.body.some(isAlrYes)) {
            builderNodes.push(decl.id);
          }
        }
      }
    }
    if (builderNodes.length === 0) return null;

    const builders = builderNodes.map((n) => playerSource.slice(n.start, n.end));
    const setup = `
      var XMLHttpRequest = { prototype: {} };
      var location = { hash: "", host: "www.youtube.com", hostname: "www.youtube.com", href: "https://www.youtube.com/watch?v=", origin: "https://www.youtube.com", pathname: "/watch", port: "", protocol: "https:", search: "" };
      var document = Object.create(null), navigator = Object.create(null), self = globalThis, window = globalThis;
      var __ytdl = {
        builders: [],
        solve: function (sig, n) {
          for (var i = 0; i < this.builders.length; i++) {
            try {
              var u = this.builders[i]("https://www.youtube.com/watch?v=", "s", sig === undefined ? undefined : encodeURIComponent(sig));
              if (n !== undefined) u.set("n", n);
              var proto = Object.getPrototypeOf(u);
              var keys = Object.keys(proto).concat(Object.getOwnPropertyNames(proto));
              for (var j = 0; j < keys.length; j++) {
                if (["constructor", "set", "get", "clone"].indexOf(keys[j]) === -1) { u[keys[j]](); break; }
              }
              var s = u.get("s");
              return [s ? decodeURIComponent(s) : null, u.get("n") || null];
            } catch (e) {}
          }
          return null;
        }
      };
    `;
    const fullCode = [
      setup,
      playerSource.slice(0, block.start + 1),
      ...kept.map((n: any) => playerSource.slice(n.start, n.end)),
      `;__ytdl.builders = [${builders.join(', ')}];`,
      playerSource.slice(block.end - 1),
    ].join('\n');

    const ctx = vm.createContext(Object.create(null), { codeGeneration: { strings: false } });
    vm.runInContext(fullCode, ctx, { timeout: 2500 });

    const cipherParams = new URLSearchParams(picked.signatureCipher);
    const baseUrl = cipherParams.get('url');
    const sVal = cipherParams.get('s') || undefined;
    const spKey = cipherParams.get('sp') || 'sig';
    if (!baseUrl) return null;

    const targetUrl = new URL(baseUrl);
    const nVal = targetUrl.searchParams.get('n') || undefined;
    const solved = vm.runInContext(
      `JSON.stringify(__ytdl.solve(${JSON.stringify(sVal)}, ${JSON.stringify(nVal)}))`,
      ctx,
      { timeout: 1500 }
    );
    const [decSig, decN] = JSON.parse(solved || '[]') || [];
    if (sVal && decSig) targetUrl.searchParams.set(spKey, decSig);
    if (nVal && decN) targetUrl.searchParams.set('n', decN);

    return {
      url: targetUrl.toString(),
      mimeType: picked.mimeType || 'audio/mp4; codecs="mp4a.40.2"',
      contentLength: picked.contentLength ? String(picked.contentLength) : undefined,
      userAgent: WEB_USER_AGENT,
      maxChunkBytes: DEFAULT_MAX_CHUNK_BYTES,
    };
  } catch {
    return null;
  }
}

async function isStreamUrlPlayable(url: string, userAgent?: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = { Range: 'bytes=0-1024' };
    if (userAgent) headers['User-Agent'] = userAgent;
    const check = await fetch(url, { headers, signal: AbortSignal.timeout(4000) });
    return check.status === 200 || check.status === 206;
  } catch {
    return false;
  }
}

async function resolveAudioFormat(
  videoId: string,
  visionYtdl: Ytdl,
  artist: string,
  title: string,
  rawQuery: string,
  durationSec: number
): Promise<Omit<CachedFormat, 'expires'> | null> {
  if (videoId) {
    // Tier 1: VisionOS via Ytdl (needsPlayer: false -> zero worker thread, supports full & 1.5MB chunks)
    try {
      const info = await visionYtdl.getInfo(videoId);
      const mp4AudioFormats = (info.formats || [])
        .filter((f: any) => f.hasAudio && !f.hasVideo && f.mimeType?.includes('audio/mp4') && f.url)
        .sort((a: any, b: any) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

      const format =
        mp4AudioFormats[0] ||
        chooseFormat(info.formats, {
          quality: 'highestaudio',
          filter: (f: any) => f.hasAudio && !f.hasVideo,
        });

      if (format?.url && (await isStreamUrlPlayable(format.url))) {
        return {
          url: format.url,
          mimeType: format.mimeType || 'audio/mp4; codecs="mp4a.40.2"',
          contentLength: format.contentLength ? String(format.contentLength) : undefined,
          maxChunkBytes: DEFAULT_MAX_CHUNK_BYTES,
        };
      }
    } catch {
      // Continue to Tier 2
    }

    // Tier 2: Direct YouTube ANDROID InnerTube (zero worker thread, 512KB chunk)
    const androidResult = await resolveViaAndroidInnerTube(videoId);
    if (androidResult?.url && (await isStreamUrlPlayable(androidResult.url, androidResult.userAgent))) {
      return androidResult;
    }

    // Tier 3: Direct YouTube IOS InnerTube (zero worker thread, 512KB chunk)
    const iosResult = await resolveViaIosInnerTube(videoId);
    if (iosResult?.url && (await isStreamUrlPlayable(iosResult.url, iosResult.userAgent))) {
      return iosResult;
    }
  }

  // Tier 4: SoundCloud fMP4 HLS Assembly (Vercel AWS IP safe, full original studio songs)
  const scResult = await resolveViaSoundCloud(artist, title, rawQuery, durationSec);
  if (scResult) return scResult;

  // Tier 5: Archive.org Audio MP3/M4A Fallback (Vercel AWS IP safe)
  return await resolveViaArchiveOrg(artist, title, rawQuery);
}

export default async function handler(req: any, res: any) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Parse query params
  const url = new URL(req.url, 'http://localhost');
  const q = url.searchParams.get('q') || (req.query && req.query.q) || '';
  const artistParam = url.searchParams.get('artist') || (req.query && req.query.artist) || '';
  const titleParam = url.searchParams.get('title') || (req.query && req.query.title) || '';
  const durationParam = Number(url.searchParams.get('duration') || (req.query && req.query.duration) || 0);
  const id = url.searchParams.get('id') || (req.query && req.query.id);

  const rawQuery = (q || `${artistParam} ${titleParam}`).trim();
  if (!rawQuery && !id) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing parameter "q" or "id"' }));
    return;
  }

  const cacheKey = id
    ? `v3:id:${id}`
    : `v3:q:${rawQuery.toLowerCase()}|${artistParam.toLowerCase()}|${titleParam.toLowerCase()}`;

  try {
    const now = Date.now();
    let formatInfo = urlCache.get(cacheKey);

    // If cache expired or not found, resolve with ytdl
    if (!formatInfo || formatInfo.expires < now) {
      // Always instantiate VisionOS-only Ytdl for search & metadata (never triggers worker.js crash on Vercel)
      const y = new Ytdl({ clients: [Client.VisionOS] });
      let videoId = id;

      if (!videoId) {
        const stopWords = new Set([
          'feat', 'ft', 'the', 'and', 'for', 'with', 'official',
          'audio', 'video', 'lyric', 'lyrics', 'remaster', 'remastered', 'version',
        ]);
        const normalizeTokens = (str: string): string[] =>
          (str || '')
            .toLowerCase()
            .replace(/\(.*?\)|\[.*?\]/g, ' ')
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .filter((w) => w.length >= 2 && !stopWords.has(w));

        const cleanTitleStr = (titleParam || rawQuery)
          .replace(/\(.*?\)|\[.*?\]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const cleanArtistStr = artistParam.trim();
        const baseSearch = cleanArtistStr ? `${cleanArtistStr} ${cleanTitleStr}`.trim() : rawQuery;

        // Search multiple studio-oriented queries to bypass YouTube's karaoke/DJ/reaction clutter
        const queriesToTry = [
          `${baseSearch} official audio`,
          `${baseSearch} topic`,
          baseSearch,
        ];

        const seenIds = new Set<string>();
        const searchResults: any[] = [];
        const titleTokens = normalizeTokens(titleParam || rawQuery);
        const artistTokens = normalizeTokens(cleanArtistStr);

        for (const target of queriesToTry) {
          try {
            const resBatch = await y.search(target);
            for (const item of resBatch || []) {
              if (item?.id && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                searchResults.push(item);
              }
            }

            // Early exit ONLY if we already have an exact Topic/Artist match close to expected duration
            const hasStrongStudioHit = searchResults.some((item: any) => {
              const tLower = (item.title || '').toLowerCase();
              const aLower = (item.author?.name || '').toLowerCase();
              const sec = item.lengthSeconds || 0;
              if (sec < 45 || sec > 600) return false;
              if (tLower.includes('karaoke') || tLower.includes('tv size') || tLower.includes('remix') || tLower.includes('cover')) {
                return false;
              }
              const allTitleMatched = titleTokens.length > 0 && titleTokens.every((w) => tLower.includes(w));
              const artistMatched = artistTokens.length === 0 || artistTokens.some((w) => aLower.includes(w));
              const durationClose = !durationParam || Math.abs(sec - durationParam) <= 15;
              return allTitleMatched && artistMatched && durationClose && (aLower.includes('topic') || artistTokens.some((w) => aLower.includes(w)));
            });

            if (hasStrongStudioHit) break;
          } catch {
            // Continue next search query variant
          }
        }

        const qLower = rawQuery.toLowerCase();
        const allowLive =
          qLower.includes('live') || qLower.includes('acoustic') || qLower.includes('unplugged');

        const forbiddenKeywords = [
          'karaoke',
          'instrumental',
          'backing track',
          'minus one',
          'off vocal',
          'tanpa vokal',
          'no vocal',
          'cover',
          'remix',
          'slowed',
          'reverb',
          'sped up',
          'speed up',
          'nightcore',
          'parody',
          'reaction',
          'fingerstyle',
          'bass tab',
          'tutorial',
          'how to play',
          'best of',
          'full album',
          'playlist',
          'compilation',
          'medley',
          'mashup',
          'tv size',
          'short ver',
          'osu!',
          'amv',
          'qnf',
          'dj ',
          'dj-',
          'teaser',
          'ringtone',
        ];

        const isForbidden = (title: string, authorName?: string) => {
          const lower = `${title || ''} ${authorName || ''}`.toLowerCase();
          return forbiddenKeywords.some((word) => lower.includes(word));
        };

        let validMatches = searchResults.filter((item: any) => {
          const sec = item.lengthSeconds || 0;
          return sec >= 45 && sec <= 660 && !isForbidden(item.title, item.author?.name);
        });

        if (validMatches.length === 0) {
          validMatches = searchResults.filter((item: any) => {
            const lower = `${item.title || ''} ${item.author?.name || ''}`.toLowerCase();
            return (
              !lower.includes('karaoke') &&
              !lower.includes('instrumental') &&
              !lower.includes('minus one') &&
              !lower.includes('off vocal')
            );
          });
        }

        const scoreCandidate = (item: any) => {
          let score = 0;
          const t = (item.title || '').toLowerCase();
          const a = (item.author?.name || '').toLowerCase();
          const sec = item.lengthSeconds || 0;

          // 1. Strict Title Token Match (Prevents returning a completely different song by the same artist)
          if (titleTokens.length > 0) {
            const matchedCount = titleTokens.filter((w) => t.includes(w)).length;
            const ratio = matchedCount / titleTokens.length;
            if (matchedCount === 0) score -= 500;
            else if (ratio === 1) score += 320;
            else score += Math.round(ratio * 180) - 90;
          }
          if (cleanTitleStr.length >= 2 && t.includes(cleanTitleStr.toLowerCase())) {
            score += 120;
          }

          // Penalize multi-song titles / mashup pipes
          if ((t.includes('||') || t.split(' - ').length >= 3) && !cleanTitleStr.includes('-')) {
            score -= 180;
          }

          // 2. Artist match on channel/title
          if (artistTokens.length > 0) {
            if (artistTokens.some((w) => a.includes(w))) score += 120;
            if (artistTokens.some((w) => t.includes(w))) score += 60;
          } else {
            const qWords = normalizeTokens(rawQuery);
            if (qWords.some((w) => a.includes(w))) score += 70;
          }

          // 3. Official Studio / Topic Priority
          if (a.includes('- topic') || a.endsWith('topic')) score += 150;
          if (t.includes('official audio')) score += 75;
          if (t.includes('official track') || t.includes('(audio)')) score += 55;
          if (t.includes('official lyric') || t.includes('lyric video') || t.includes('lirik')) score += 45;
          if (t.includes('official music video') || t.includes('official video')) score += 25;

          // 4. Live/Concert/Mix penalties unless requested
          if (!allowLive) {
            if (t.includes('live') || t.includes('concert') || t.includes('blank canvas') || t.includes('awards')) {
              score -= 180;
            }
            if (t.includes('acoustic')) score -= 80;
          }
          if (t.includes('mix') && !qLower.includes('mix')) score -= 40;

          // 5. Duration closeness bonus for 1:1 lyric timing match
          if (durationParam > 30 && sec > 0) {
            const diff = Math.abs(sec - durationParam);
            if (diff <= 8) score += 110;
            else if (diff <= 20) score += 55;
            else if (diff > 60) score -= 100;
          }

          return score;
        };

        const sortedMatches = [...validMatches].sort(
          (a: any, b: any) => scoreCandidate(b) - scoreCandidate(a)
        );
        const match = sortedMatches[0] || validMatches[0] || searchResults[0];
        videoId = match?.id || '';
      }

      const resolved = await resolveAudioFormat(
        videoId || '',
        y,
        artistParam,
        titleParam,
        rawQuery,
        durationParam
      );
      if (!resolved || (!resolved.url && !resolved.buffer)) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'No audio stream format found for ' + (videoId || rawQuery) }));
        return;
      }

      formatInfo = {
        ...resolved,
        expires: now + 5 * 60 * 1000, // Cache for 5 minutes
      };
      urlCache.set(cacheKey, formatInfo);
    }

    const clientRange = req.headers ? (req.headers.range || req.headers['range']) : undefined;
    const chunkCap = formatInfo.maxChunkBytes || DEFAULT_MAX_CHUNK_BYTES;

    // Serve assembled in-memory Buffer (e.g. SoundCloud fMP4) with standard 206 Range slicing
    if (formatInfo.buffer) {
      const buf = formatInfo.buffer;
      const total = buf.length;
      let start = 0;
      let end = Math.min(total - 1, chunkCap - 1);

      if (clientRange) {
        const m = /bytes=(\d+)-(\d*)/.exec(String(clientRange));
        if (m) {
          start = Math.min(total - 1, parseInt(m[1], 10));
          const reqEnd = m[2] ? parseInt(m[2], 10) : NaN;
          const maxEnd = Math.min(total - 1, start + chunkCap - 1);
          end = Number.isFinite(reqEnd) ? Math.min(reqEnd, maxEnd) : maxEnd;
        }
      }

      const slice = buf.subarray(start, end + 1);
      res.statusCode = 206;
      res.setHeader('Content-Type', formatInfo.mimeType || 'audio/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', String(slice.length));
      res.end(slice);
      return;
    }

    // Handle Client Range Requests for URL-based streams (VisionOS / Android / iOS / Archive.org)
    const totalLen = formatInfo.contentLength ? Number(formatInfo.contentLength) : 0;

    let reqRangeHeader: string | undefined;
    if (clientRange) {
      const m = /bytes=(\d+)-(\d*)/.exec(String(clientRange));
      if (m) {
        const start = parseInt(m[1], 10);
        const requestedEnd = m[2] ? parseInt(m[2], 10) : NaN;
        const maxEnd =
          totalLen > 0
            ? Math.min(totalLen - 1, start + chunkCap - 1)
            : start + chunkCap - 1;
        const end = Number.isFinite(requestedEnd) ? Math.min(requestedEnd, maxEnd) : maxEnd;
        reqRangeHeader = `bytes=${start}-${Math.max(start, end)}`;
      } else {
        reqRangeHeader = String(clientRange);
      }
    } else if (totalLen > 3_500_000 || totalLen === 0 || chunkCap < DEFAULT_MAX_CHUNK_BYTES) {
      reqRangeHeader = `bytes=0-${chunkCap - 1}`;
    }

    const fetchHeaders: Record<string, string> = {};
    if (reqRangeHeader) fetchHeaders['Range'] = reqRangeHeader;
    if (formatInfo.userAgent) fetchHeaders['User-Agent'] = formatInfo.userAgent;

    let mediaRes = await fetch(formatInfo.url!, { headers: fetchHeaders });

    // If cached stream URL expired or rejected (403/410), clear cache once and re-resolve
    if ((mediaRes.status === 403 || mediaRes.status === 410) && !id) {
      urlCache.delete(cacheKey);
    }

    res.statusCode = mediaRes.status; // 206 for range requests, 200 for full stream
    res.setHeader('Content-Type', mediaRes.headers.get('content-type') || formatInfo.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');

    const contentRange = mediaRes.headers.get('content-range');
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
    }
    const contentLength = mediaRes.headers.get('content-length') || formatInfo.contentLength;
    if (contentLength && !contentRange) {
      res.setHeader('Content-Length', contentLength);
    }

    if (mediaRes.body) {
      // @ts-ignore
      const nodeStream = Readable.fromWeb(mediaRes.body);
      nodeStream.pipe(res);

      nodeStream.on('error', (err: any) => {
        console.error('Audio stream pipe error:', err.message);
        if (!res.headersSent) {
          res.statusCode = 500;
        }
        res.end();
      });

      req.on('close', () => {
        nodeStream.destroy();
      });
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error('Error in /api/stream:', err.message);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
    }
  }
}
