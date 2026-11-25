import { Ytdl, Client, chooseFormat } from '@distube/ytdl-core';
import { parseScript } from 'meriyah';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { Readable } from 'stream';

const ANDROID_USER_AGENT =
  'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip';
const IOS_USER_AGENT =
  'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)';
const WEB_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const EMBED_HOST = 'https://www.reddit.com/';

// Vercel Serverless Functions have a 4.5MB (4,718,592B) buffered limit; 4.0MB chunks minimize Range hops safely under cap
const DEFAULT_MAX_CHUNK_BYTES = 4000000; // 4.0MB for VisionOS / Archive / SoundCloud / Bilibili
const MOBILE_MAX_CHUNK_BYTES = 524288; // 512KB cap required by YouTube Android/iOS CDN endpoints

// In-memory cache for resolved format URLs / assembled buffers to make Range scrubbing & repeated plays instant
interface CachedFormat {
  url?: string;
  buffer?: Buffer;
  mimeType: string;
  contentLength?: string;
  userAgent?: string;
  referer?: string;
  maxChunkBytes: number;
  expires: number;
}
const urlCache = new Map<string, CachedFormat>();
const notFoundCache = new Map<string, { body: string; expires: number }>();

const JP_ARTIST_ALIASES: Array<[RegExp, string]> = [
  [/tsukuyomi/i, '月詠み'],
];

const JP_TITLE_ALIASES: Array<[RegExp, string[]]> = [
  [/\bgyakutengeki\b|\bgyakuten geki\b/i, ['逆転劇']],
  [/\bnightjar\b|\byodaka\b/i, ['ヨダカ', 'ヨタカ']],
  [/\bkyuseishu\b|\bkyuseisyu\b/i, ['救世主']],
  [/\bmayday\b|\bmede\b/i, ['メデ', 'メーデー']],
  [/^if$/i, ['イフ', '如果']],
  [/\bshinsekaikara\b|\bshinsekai kara\b/i, ['新世界から']],
  [/\bmoonlight at midday\b/i, ['真昼の月明かり']],
  [/\breason for existence\b|\bikiru yosuga\b/i, ['生きるよすが']],
  [/\bameisensou\b/i, ['アメイセンソウ']],
  [/\bneko to yuri\b|\bcat and lily\b/i, ['猫とユリ']],
];

function getLocalizedAliases(artist: string, title: string): {
  artistAliases: string[];
  titleAliases: string[];
} {
  const artistAliases: string[] = [];
  for (const [rx, jp] of JP_ARTIST_ALIASES) {
    if (rx.test(artist)) artistAliases.push(jp);
  }
  const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, ' ').replace(/\s+/g, ' ').trim();
  const titleAliases: string[] = [];
  for (const [rx, alts] of JP_TITLE_ALIASES) {
    if (rx.test(cleanTitle)) titleAliases.push(...alts);
  }
  return { artistAliases, titleAliases };
}

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

async function fetchSoundCloudTrackBuffer(
  tr: any,
  cid: string
): Promise<Omit<CachedFormat, 'expires'> | null> {
  const transcodings: any[] = tr?.media?.transcodings || [];

  // Prefer unencrypted HLS audio/mp4 first (cached in memory as clean fMP4)
  const hlsAacList = transcodings.filter(
    (x: any) => x.format?.protocol === 'hls' && x.format?.mime_type?.includes('audio/mp4')
  );
  for (const aacTr of hlsAacList) {
    try {
      const trInfo: any = await fetch(`${aacTr.url}?client_id=${cid}`, {
        headers: { Origin: 'https://soundcloud.com', Referer: 'https://soundcloud.com/' },
        signal: AbortSignal.timeout(4000),
      }).then((r) => r.json());
      if (!trInfo?.url) continue;

      const m3u8 = await fetch(trInfo.url, { signal: AbortSignal.timeout(4000) }).then((r) => r.text());
      // Reject DRM-encrypted HLS streams immediately (#EXT-X-KEY / SAMPLE-AES)
      if (!m3u8 || m3u8.includes('#EXT-X-KEY') || m3u8.includes('SAMPLE-AES')) continue;

      const initMatch = /#EXT-X-MAP:URI="([^"]+)"/.exec(m3u8);
      if (!initMatch?.[1]) continue;

      const initBuf = Buffer.from(
        await fetch(initMatch[1], { signal: AbortSignal.timeout(4000) }).then((r) => r.arrayBuffer())
      );
      // Reject MP4 containers using DRM FairPlay/CENC encryption boxes (enca / sinf)
      if (initBuf.length < 32 || initBuf.includes('enca') || initBuf.includes('sinf')) continue;

      const segUrls = m3u8
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('http'));
      if (segUrls.length === 0) continue;

      const bufs = await Promise.all(
        segUrls.map((u) => fetch(u, { signal: AbortSignal.timeout(6000) }).then((r) => r.arrayBuffer()))
      );
      const assembled = Buffer.concat([initBuf, ...bufs.map((b) => Buffer.from(b))]);
      return {
        buffer: assembled,
        mimeType: 'audio/mp4',
        contentLength: String(assembled.length),
        maxChunkBytes: DEFAULT_MAX_CHUNK_BYTES,
      };
    } catch {
      // Try next transcoding
    }
  }

  // Secondary SoundCloud check: unencrypted HLS audio/mpeg (assembled MP3 segments)
  const hlsMp3List = transcodings.filter(
    (x: any) => x.format?.protocol === 'hls' && x.format?.mime_type?.includes('audio/mpeg')
  );
  for (const mp3Tr of hlsMp3List) {
    try {
      const trInfo: any = await fetch(`${mp3Tr.url}?client_id=${cid}`, {
        headers: { Origin: 'https://soundcloud.com', Referer: 'https://soundcloud.com/' },
        signal: AbortSignal.timeout(4000),
      }).then((r) => r.json());
      if (!trInfo?.url) continue;

      const m3u8 = await fetch(trInfo.url, { signal: AbortSignal.timeout(4000) }).then((r) => r.text());
      if (!m3u8 || m3u8.includes('#EXT-X-KEY') || m3u8.includes('SAMPLE-AES')) continue;

      const segUrls = m3u8
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('http'));
      if (segUrls.length === 0) continue;

      const bufs = await Promise.all(
        segUrls.map((u) => fetch(u, { signal: AbortSignal.timeout(6000) }).then((r) => r.arrayBuffer()))
      );
      const assembled = Buffer.concat(bufs.map((b) => Buffer.from(b)));
      return {
        buffer: assembled,
        mimeType: 'audio/mpeg',
        contentLength: String(assembled.length),
        maxChunkBytes: DEFAULT_MAX_CHUNK_BYTES,
      };
    } catch {}
  }

  // Tertiary SoundCloud check: progressive MP3 (non-DRM direct stream)
  const progTr = transcodings.find(
    (x: any) => x.format?.protocol === 'progressive' && x.format?.mime_type?.includes('audio/mpeg')
  );
  if (progTr) {
    try {
      const trInfo: any = await fetch(`${progTr.url}?client_id=${cid}`, {
        headers: { Origin: 'https://soundcloud.com', Referer: 'https://soundcloud.com/' },
        signal: AbortSignal.timeout(4000),
      }).then((r) => r.json());
      if (trInfo?.url && (await isStreamUrlPlayable(trInfo.url, WEB_USER_AGENT))) {
        return {
          url: trInfo.url,
          mimeType: 'audio/mpeg',
          userAgent: WEB_USER_AGENT,
          maxChunkBytes: DEFAULT_MAX_CHUNK_BYTES,
        };
      }
    } catch {}
  }

  return null;
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
    const { artistAliases, titleAliases } = getLocalizedAliases(cleanArtistStr, cleanTitleStr);

    const stopArtist = new Set(['the', 'and', 'feat', 'ft', 'official']);
    const artistTokens = cleanArtistStr
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !stopArtist.has(w));
    const allArtistChecks = [
      ...artistTokens,
      ...artistAliases.map((a) => a.toLowerCase()),
    ];

    const searchJobs: Array<{ query: string; matchWords: string[] }> = [];
    const titleWords = cleanTitleStr
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2);
    const primaryQuery = cleanArtistStr ? `${cleanArtistStr} ${cleanTitleStr}` : rawQuery;
    searchJobs.push({ query: primaryQuery, matchWords: titleWords });

    if (artistAliases.length > 0 && titleAliases.length > 0) {
      for (const ja of artistAliases) {
        for (const jt of titleAliases) {
          searchJobs.push({
            query: `${ja} ${jt}`,
            matchWords: [jt.toLowerCase()],
          });
        }
      }
    }

    const qLower = rawQuery.toLowerCase();
    const allowLive = qLower.includes('live') || qLower.includes('acoustic') || qLower.includes('unplugged');
    const forbidden = [
      'cover', 'remix', 'flip', 'slowed', 'reverb', 'low pitch', 'karaoke', 'off vocal',
      'minus one', 'instrumental', 'nightcore', 'sped up', 'speed up', 'sped', 'dj ',
      'mashup', 'edit', 'amapiano', 'fanmade', 'fan made', 'fan-made', 'tribute',
      'gym', 'motivation', 'podcast', 'tutorial', 'tv size', '8d ', '3d ', 'piano',
      'guitar', 'drum', 'violin', 'cello', 'music box', 'lofi', 'lo-fi',
      'bass boosted', 'synthesia', '1 hour', 'tik tok', 'tiktok',
    ];

    for (const job of searchJobs) {
      const sr = await fetch(
        `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(job.query)}&limit=15&client_id=${cid}`,
        { headers: { 'User-Agent': WEB_USER_AGENT }, signal: AbortSignal.timeout(4000) }
      ).then((r) => r.json()).catch(() => null);

      const candidates = (sr?.collection || []).filter((t: any) => {
        if (!t?.duration || t.duration < 45000 || t.duration > 600000) return false;
        const hasAudio = t.media?.transcodings?.some(
          (x: any) =>
            !x.snipped &&
            (x.format?.mime_type?.includes('audio/mp4') || x.format?.mime_type?.includes('audio/mpeg'))
        );
        if (!hasAudio) return false;

        const tLower = `${t.title || ''}`.toLowerCase();
        const metaLower = `${t.title || ''} ${t.user?.username || ''} ${t.user?.permalink || ''} ${t.publisher_metadata?.artist || ''} ${t.tag_list || ''}`.toLowerCase();
        if (forbidden.some((f) => tLower.includes(f))) return false;
        if (!allowLive && (tLower.includes('live') || tLower.includes('unplugged') || tLower.includes('acoustic'))) return false;
        if (job.matchWords.length > 0 && !job.matchWords.every((w) => tLower.includes(w))) return false;
        if (allArtistChecks.length > 0 && !allArtistChecks.some((a) => metaLower.includes(a))) return false;

        if (durationSec > 30) {
          const diff = Math.abs(t.duration / 1000 - durationSec);
          if (diff > 22) return false;
        }
        return true;
      });

      if (candidates.length === 0) continue;

      candidates.sort((a: any, b: any) => {
        const scoreSc = (x: any) => {
          let s = 0;
          const uLower = `${x.user?.username || ''}`.toLowerCase();
          if (x.user?.verified) s += 80;
          if (cleanArtistStr && uLower.includes(cleanArtistStr.toLowerCase())) s += 60;
          if (x.publisher_metadata?.artist?.toLowerCase()?.includes(cleanArtistStr.toLowerCase())) s += 50;
          if (durationSec > 30) {
            s -= Math.abs(x.duration / 1000 - durationSec) * 3;
          }
          s += Math.min(30, Math.log10((x.playback_count || 1) + 1) * 4);
          return s;
        };
        return scoreSc(b) - scoreSc(a);
      });

      // Iterate top candidates so DRM-encrypted tracks (enca/#EXT-X-KEY) fall through cleanly
      for (const cand of candidates.slice(0, 5)) {
        const cleanAudio = await fetchSoundCloudTrackBuffer(cand, cid);
        if (cleanAudio) return cleanAudio;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function parseArchiveLengthSec(val: any): number {
  if (!val) return 0;
  const s = String(val).trim();
  if (s.includes(':')) {
    const parts = s.split(':').map((n) => parseFloat(n));
    if (parts.some((n) => Number.isNaN(n))) return 0;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  const f = parseFloat(s);
  return Number.isFinite(f) ? f : 0;
}

async function resolveViaArchiveOrg(
  artist: string,
  title: string,
  rawQuery: string,
  durationSec: number = 0
): Promise<Omit<CachedFormat, 'expires'> | null> {
  try {
    const cleanTitleStr = (title || rawQuery)
      .replace(/\(.*?\)|\[.*?\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const cleanArtistStr = artist.trim();
    if (!cleanArtistStr || !cleanTitleStr) return null;

    const qLower = `${artist} ${title} ${rawQuery}`.toLowerCase();
    const allowLive = qLower.includes('live') || qLower.includes('unplugged') || qLower.includes('acoustic');

    const titleWords = cleanTitleStr
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2);
    if (titleWords.length === 0) return null;

    const artistWords = cleanArtistStr
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2 && w !== 'the' && w !== 'and');

    const queries = [
      `title:("${cleanTitleStr}") AND creator:("${cleanArtistStr}") AND mediatype:(audio)`,
      `"${cleanTitleStr}" AND creator:("${cleanArtistStr}") AND mediatype:(audio)`,
      `creator:("${cleanArtistStr}") AND ("Nevermind" OR "In Utero" OR "Bleach" OR "Greatest Hits" OR "Remaster" OR "Studio" OR "Album") AND mediatype:(audio)`,
      `creator:("${cleanArtistStr}") AND mediatype:(audio)`,
    ];

    const seenIds = new Set<string>();
    const candidateDocs: Array<{ identifier: string; title?: string; creator?: string }> = [];
    const badDocWords = [
      'cover', 'tribute', 'karaoke', 'interview', 'podcast', 'instrumental',
      'episode', 'review', 'stems', 'mashup', 'remix', 'fanmade',
    ];

    for (const aq of queries) {
      const res: any = await fetch(
        `https://archive.org/advancedsearch.php?q=${encodeURIComponent(aq)}&fl[]=identifier,title,creator&rows=12&output=json`,
        { signal: AbortSignal.timeout(4000) }
      ).then((r) => r.json()).catch(() => null);

      for (const doc of res?.response?.docs || []) {
        if (!doc?.identifier || seenIds.has(doc.identifier)) continue;
        const creatorStr = Array.isArray(doc.creator) ? doc.creator.join(' ') : String(doc.creator || '');
        const s = `${doc.identifier} ${doc.title || ''} ${creatorStr}`.toLowerCase();
        if (badDocWords.some((w) => s.includes(w))) continue;
        if (artistWords.length > 0 && !artistWords.some((w) => s.includes(w))) continue;
        seenIds.add(doc.identifier);
        candidateDocs.push(doc);
      }
      if (candidateDocs.length >= 10) break;
    }

    if (candidateDocs.length === 0) return null;

    const scoreDoc = (d: { identifier: string; title?: string; creator?: string }) => {
      const creatorStr = Array.isArray(d.creator) ? d.creator.join(' ') : String(d.creator || '');
      const s = `${d.identifier} ${d.title || ''} ${creatorStr}`.toLowerCase();
      let sc = 0;
      if (
        s.includes('nevermind') ||
        s.includes('in-utero') ||
        s.includes('in utero') ||
        s.includes('bleach') ||
        s.includes('studio') ||
        s.includes('album') ||
        s.includes('remaster') ||
        s.includes('greatest') ||
        s.includes('single')
      ) {
        sc += 60;
      }
      if (titleWords.every((w) => s.includes(w))) sc += 25;
      if (!allowLive) {
        if (s.includes('unplugged')) sc -= 10;
        if (
          s.includes('live') ||
          s.includes('bootleg') ||
          s.includes('soundboard') ||
          s.includes('rehearsal') ||
          s.includes('demo')
        ) {
          sc -= 40;
        }
      }
      return sc;
    };
    candidateDocs.sort((a, b) => scoreDoc(b) - scoreDoc(a));

    const fileLists = await Promise.all(
      candidateDocs.slice(0, 8).map(async (doc) => {
        try {
          const m: any = await fetch(`https://archive.org/metadata/${doc.identifier}/files`, {
            signal: AbortSignal.timeout(4000),
          }).then((r) => r.json());
          return { doc, files: (m?.result || []) as any[] };
        } catch {
          return { doc, files: [] as any[] };
        }
      })
    );

    const minBytes = durationSec >= 90 ? 900000 : 400000;
    const validMatches: Array<{ ident: string; file: any; score: number }> = [];
    for (const { doc, files } of fileLists) {
      const ident = doc.identifier;
      const docCreator = (Array.isArray(doc.creator) ? doc.creator.join(' ') : String(doc.creator || '')).toLowerCase();
      for (const f of files) {
        const name = (f.name || '').toLowerCase();
        if (!name.endsWith('.mp3') && !name.endsWith('.m4a') && !name.endsWith('.ogg')) continue;
        if (
          name.includes('64kb') ||
          name.includes('cover') ||
          name.includes('demo') ||
          name.includes('instrumental') ||
          name.includes('karaoke') ||
          name.includes('remix') ||
          name.includes('mashup') ||
          name.includes('fanmade') ||
          name.includes('sample')
        ) {
          continue;
        }
        if (Number(f.size || 0) < minBytes) continue;
        if (!titleWords.every((w) => name.includes(w))) continue;

        const fileSec = parseArchiveLengthSec(f.length);
        if (fileSec > 0 && durationSec > 30 && Math.abs(fileSec - durationSec) > 32) {
          continue;
        }

        const fMetaArtist = `${f.artist || ''} ${f.creator || ''} ${docCreator} ${name} ${ident}`.toLowerCase();
        if (artistWords.length > 0 && !artistWords.some((w) => fMetaArtist.includes(w))) {
          continue;
        }

        let sc = 0;
        const fArtistStr = `${f.artist || ''} ${f.creator || ''}`.toLowerCase();
        if (artistWords.length > 0 && artistWords.every((w) => fArtistStr.includes(w))) sc += 40;
        if (docCreator && artistWords.every((w) => docCreator.includes(w))) sc += 30;
        if (!allowLive && (name.includes('live') || name.includes('unplugged') || ident.toLowerCase().includes('live'))) {
          sc -= 50;
        }
        if (fileSec > 0 && durationSec > 30) {
          sc -= Math.abs(fileSec - durationSec);
        }
        validMatches.push({ ident, file: f, score: sc });
      }
    }

    validMatches.sort((a, b) => b.score - a.score);
    const picked = validMatches[0];
    if (picked) {
      const fileUrl = `https://archive.org/download/${picked.ident}/${encodeURIComponent(picked.file.name)}`;
      const lower = picked.file.name.toLowerCase();
      const mimeType = lower.endsWith('.m4a')
        ? 'audio/mp4'
        : lower.endsWith('.ogg')
        ? 'audio/ogg'
        : 'audio/mpeg';

      return {
        url: fileUrl,
        mimeType,
        contentLength: picked.file.size ? String(picked.file.size) : undefined,
        maxChunkBytes: DEFAULT_MAX_CHUNK_BYTES,
      };
    }
  } catch {}
  return null;
}

const BILI_WBI_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
  61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
  36, 20, 34, 44, 52,
];

let cachedBiliCookie: { val: string; expires: number } | null = null;
async function getBiliCookie(): Promise<string> {
  const now = Date.now();
  if (cachedBiliCookie && cachedBiliCookie.expires > now) return cachedBiliCookie.val;
  try {
    const spi: any = await fetch('https://api.bilibili.com/x/frontend/finger/spi', {
      headers: { 'User-Agent': WEB_USER_AGENT },
      signal: AbortSignal.timeout(3000),
    }).then((r) => r.json());
    if (spi?.data?.b_3) {
      const bNut = Math.floor(now / 1000);
      const val = `buvid3=${spi.data.b_3}; buvid4=${spi.data.b_4 || ''}; b_nut=${bNut};`;
      cachedBiliCookie = { val, expires: now + 30 * 60 * 1000 };
      return val;
    }
  } catch {}
  return '';
}

let cachedBiliMixin: { key: string; expires: number } | null = null;
async function getBiliWbiMixin(): Promise<string> {
  const now = Date.now();
  if (cachedBiliMixin && cachedBiliMixin.expires > now) return cachedBiliMixin.key;
  try {
    const nav: any = await fetch('https://api.bilibili.com/x/web-interface/nav', {
      headers: { 'User-Agent': WEB_USER_AGENT, Referer: 'https://www.bilibili.com/' },
      signal: AbortSignal.timeout(3000),
    }).then((r) => r.json());
    const ik = String(nav?.data?.wbi_img?.img_url || '').split('/').pop()?.split('.')[0] || '';
    const sk = String(nav?.data?.wbi_img?.sub_url || '').split('/').pop()?.split('.')[0] || '';
    if (ik && sk) {
      const raw = ik + sk;
      const key = BILI_WBI_TAB.map((n) => raw[n] || '').join('').slice(0, 32);
      if (key.length === 32) {
        cachedBiliMixin = { key, expires: now + 30 * 60 * 1000 };
        return key;
      }
    }
  } catch {}
  return '';
}

function parseBiliHtmlCards(html: string): Array<{ bvid: string; title: string; duration: string }> {
  const out: Array<{ bvid: string; title: string; duration: string }> = [];
  for (const part of html.split('bili-video-card__wrap').slice(1)) {
    const chunk = part.slice(0, 4500);
    const bvid =
      /href="\/\/www\.bilibili\.com(?:\/[a-zA-Z-]+)?\/video\/(BV1[a-zA-Z0-9]{9})\/?"/.exec(chunk)?.[1] ||
      /(BV1[a-zA-Z0-9]{9})/.exec(chunk)?.[1];
    const duration = /bili-video-card__stats__duration[^>]*>([^<]+)</.exec(chunk)?.[1]?.trim();
    const title = /class="bili-video-card__info--tit"[^>]*title="([^"]+)"/.exec(chunk)?.[1];
    if (bvid && title && duration) out.push({ bvid, title, duration });
  }
  return out;
}

function parseBiliDuration(durStr: string): number {
  const parts = String(durStr || '')
    .split(':')
    .map((n) => parseInt(n, 10));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

async function resolveViaBilibili(
  artist: string,
  title: string,
  rawQuery: string,
  durationSec: number,
  diag?: string[]
): Promise<Omit<CachedFormat, 'expires'> | null> {
  try {
    const [cookie, mixin] = await Promise.all([getBiliCookie(), getBiliWbiMixin()]);
    const biliHeaders: Record<string, string> = {
      'User-Agent': WEB_USER_AGENT,
      Referer: 'https://search.bilibili.com/',
      Origin: 'https://search.bilibili.com',
    };
    if (cookie) biliHeaders['Cookie'] = cookie;

    const cleanTitleStr = (title || rawQuery)
      .replace(/\(.*?\)|\[.*?\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const cleanArtistStr = artist.trim();
    const { artistAliases, titleAliases } = getLocalizedAliases(cleanArtistStr, cleanTitleStr);

    const titleWords = cleanTitleStr
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    const searchJobs: Array<{ query: string; artistChecks: string[]; titleChecks: string[] }> = [];
    if (artistAliases.length > 0 && titleAliases.length > 0) {
      for (const ja of artistAliases) {
        for (const jt of titleAliases) {
          searchJobs.push({
            query: `${ja} ${jt}`,
            artistChecks: [ja.toLowerCase(), 'ユリイ', ...(cleanArtistStr ? [cleanArtistStr.toLowerCase()] : [])],
            titleChecks: [jt.toLowerCase(), ...titleWords],
          });
        }
      }
    } else if (cleanArtistStr && cleanTitleStr) {
      searchJobs.push({
        query: `${cleanArtistStr} ${cleanTitleStr}`,
        artistChecks: [cleanArtistStr.toLowerCase()],
        titleChecks: titleWords,
      });
    }

    const bad = [
      'ニコカラ', 'on vocal', 'off vocal', 'カラオケ', 'karaoke', 'cover', '翻唱',
      '歌ってみた', 'piano', 'ピアノ', 'instrumental', '伴奏', '鼓谱', '譜面', '钢琴',
      'drum', 'bass', 'guitar', 'tab', 'midi', '反応', 'reaction', 'nightcore',
      'sped up', 'slowed', 'mad', 'amv', '夢ノ結唱', 'cevio', 'synthesizer', 'utau',
      'fanmade', 'fan made', '饭制', '自制', '二创', 'remix', '现场', '演唱会', 'concert',
    ];
    const qLower = rawQuery.toLowerCase();
    const allowLive = qLower.includes('live') || qLower.includes('acoustic');

    for (const job of searchJobs) {
      let rawItems: any[] = [];
      let wbiCode: number | string = 'no-mixin';
      if (mixin) {
        const wts = Math.floor(Date.now() / 1000);
        const p: Record<string, string | number> = { keyword: job.query, search_type: 'video', wts };
        const qs = Object.keys(p)
          .sort()
          .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(p[k]).replace(/[!'()*]/g, ''))}`)
          .join('&');
        const w_rid = crypto.createHash('md5').update(qs + mixin).digest('hex');
        const sr: any = await fetch(`https://api.bilibili.com/x/web-interface/wbi/search/type?${qs}&w_rid=${w_rid}`, {
          headers: biliHeaders,
          signal: AbortSignal.timeout(4000),
        }).then((r) => r.json()).catch(() => null);
        wbiCode = sr?.code ?? 'err';
        rawItems = sr?.data?.result || [];
      }

      if (rawItems.length === 0) {
        // Fallback to SSR HTML card extraction if WBI search returned nothing or blocked
        const html = await fetch(`https://search.bilibili.com/all?keyword=${encodeURIComponent(job.query)}`, {
          headers: { 'User-Agent': WEB_USER_AGENT, Referer: 'https://www.bilibili.com/', ...(cookie ? { Cookie: cookie } : {}) },
          signal: AbortSignal.timeout(4000),
        }).then((r) => r.text()).catch(() => '');
        rawItems = parseBiliHtmlCards(html);
        diag?.push(`bili(${job.query}):wbi=${wbiCode},ssr=${rawItems.length}`);
      }

      const candidates = rawItems.filter((item: any) => {
        const tClean = String(item.title || '').replace(/<[^>]+>/g, '').toLowerCase();
        const d = parseBiliDuration(item.duration);
        if (d < 60 || d > 480) return false;
        if (durationSec > 30 && Math.abs(d - durationSec) > 38) return false;
        if (bad.some((b) => tClean.includes(b))) return false;
        if (job.artistChecks.length > 0 && !job.artistChecks.some((a) => tClean.includes(a))) return false;
        if (job.titleChecks.length > 0 && !job.titleChecks.some((w) => tClean.includes(w))) return false;
        return true;
      });

      if (candidates.length === 0) {
        diag?.push(`bili_cand0(${job.query},raw=${rawItems.length})`);
        continue;
      }

      candidates.sort((a: any, b: any) => {
        const scoreB = (it: any) => {
          const t = String(it.title || '').replace(/<[^>]+>/g, '').toLowerCase();
          let s = 0;
          if (t.includes('官方') || t.includes('official')) s += 80;
          if (t.includes('mv') || t.includes('music video')) s += 50;
          if (t.includes('完整版') || t.includes('op')) s += 20;
          if (!allowLive && t.includes('live')) s -= 60;
          if (durationSec > 30) {
            s -= Math.abs(parseBiliDuration(it.duration) - durationSec);
          }
          return s;
        };
        return scoreB(b) - scoreB(a);
      });

      for (const top of candidates.slice(0, 3)) {
        try {
          // Do NOT pass synthetic/incomplete Cookie to pagelist/playurl — it triggers Bilibili WAF HTML (-412)
          let cid: string | number | undefined;
          const plText = await fetch(`https://api.bilibili.com/x/player/pagelist?bvid=${top.bvid}`, {
            signal: AbortSignal.timeout(3500),
          }).then((r) => r.text());
          if (plText.startsWith('{')) {
            cid = JSON.parse(plText)?.data?.[0]?.cid;
          }
          if (!cid) {
            const vHtml = await fetch(`https://m.bilibili.com/video/${top.bvid}`, {
              headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
              signal: AbortSignal.timeout(3500),
            }).then((r) => r.text()).catch(() => '');
            cid = /"cid":(\d+)/.exec(vHtml)?.[1];
          }
          if (!cid) { diag?.push(`bili_nocid(${top.bvid})`); continue; }

          let play: any = null;
          const playUrl = `https://api.bilibili.com/x/player/playurl?bvid=${top.bvid}&cid=${cid}&qn=16&fnval=1&platform=html5`;
          const playText = await fetch(playUrl, {
            signal: AbortSignal.timeout(3500),
          }).then((r) => r.text());
          if (playText.startsWith('{')) {
            play = JSON.parse(playText);
          } else {
            const retryText = await fetch(playUrl, {
              headers: { 'User-Agent': WEB_USER_AGENT, Referer: 'https://www.bilibili.com/' },
              signal: AbortSignal.timeout(3500),
            }).then((r) => r.text()).catch(() => '');
            if (retryText.startsWith('{')) play = JSON.parse(retryText);
            else diag?.push(`bili_play_html(${top.bvid}:${playText.slice(0, 40)})`);
          }

          const d0 = play?.data?.durl?.[0];
          if (!d0?.url) { diag?.push(`bili_nodurl(${top.bvid},code=${play?.code})`); continue; }

          if (await isStreamUrlPlayable(d0.url, WEB_USER_AGENT, 'https://www.bilibili.com/')) {
            return {
              url: d0.url,
              mimeType: 'video/mp4',
              contentLength: d0.size ? String(d0.size) : undefined,
              userAgent: WEB_USER_AGENT,
              referer: 'https://www.bilibili.com/',
              maxChunkBytes: DEFAULT_MAX_CHUNK_BYTES,
            };
          }
          diag?.push(`bili_unplayable(${top.bvid})`);
        } catch (e: any) {
          diag?.push(`bili_err(${top.bvid}:${e?.message || 'err'})`);
        }
      }
    }
  } catch (e: any) {
    diag?.push(`bili_catch:${e?.message || 'err'}`);
  }
  return null;
}

let cachedVisitorData: { val: string; expires: number } | null = null;
async function fetchVisitorData(): Promise<string | undefined> {
  const now = Date.now();
  if (cachedVisitorData && cachedVisitorData.expires > now) {
    return cachedVisitorData.val;
  }
  try {
    const r = await fetch('https://www.youtube.com/youtubei/v1/visitor_id?prettyPrint=false', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': WEB_USER_AGENT },
      body: JSON.stringify({
        context: { client: { clientName: 'WEB', clientVersion: '2.20261027.01.00' } },
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) return undefined;
    const j: any = await r.json();
    const val = j?.responseContext?.visitorData;
    if (val) cachedVisitorData = { val, expires: now + 15 * 60 * 1000 };
    return val || undefined;
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

async function isStreamUrlPlayable(url: string, userAgent?: string, referer?: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = { Range: 'bytes=0-1024' };
    if (userAgent) headers['User-Agent'] = userAgent;
    if (referer) headers['Referer'] = referer;
    const check = await fetch(url, { headers, signal: AbortSignal.timeout(3500) });
    return check.status === 200 || check.status === 206;
  } catch {
    return false;
  }
}

async function resolveViaVisionOS(
  videoId: string,
  visionYtdl: Ytdl
): Promise<Omit<CachedFormat, 'expires'> | null> {
  try {
    const info = await Promise.race([
      visionYtdl.getInfo(videoId),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
    ]);
    if (!info) return null;
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
  } catch {}
  return null;
}

async function resolveAudioFormat(
  videoId: string,
  visionYtdl: Ytdl,
  artist: string,
  title: string,
  rawQuery: string,
  durationSec: number,
  diag?: string[]
): Promise<Omit<CachedFormat, 'expires'> | null> {
  if (videoId) {
    // Run VisionOS / ANDROID / IOS / Embedded-VM concurrently so AWS IP blocks fail fast in <=3.5s
    const [visionRes, androidRes, iosRes, embeddedRes] = await Promise.all([
      resolveViaVisionOS(videoId, visionYtdl),
      resolveViaAndroidInnerTube(videoId).then(async (r) =>
        r?.url && (await isStreamUrlPlayable(r.url, r.userAgent)) ? r : null
      ),
      resolveViaIosInnerTube(videoId).then(async (r) =>
        r?.url && (await isStreamUrlPlayable(r.url, r.userAgent)) ? r : null
      ),
      resolveViaEmbeddedInProcess(videoId).then(async (r) =>
        r?.url && (await isStreamUrlPlayable(r.url, r.userAgent)) ? r : null
      ),
    ]);
    if (visionRes) return visionRes;
    if (androidRes) return androidRes;
    if (iosRes) return iosRes;
    if (embeddedRes) return embeddedRes;
    diag?.push('yt=blocked');
  }

  // Tier 4: SoundCloud Strict Artist+Title Non-DRM HLS/Progressive Fallback
  const scResult = await resolveViaSoundCloud(artist, title, rawQuery, durationSec);
  if (scResult) {
    // If SoundCloud fMP4 exceeds single-response 4MB cap, check if Archive.org has a direct single-hop MP3 first
    if (scResult.buffer && scResult.buffer.length > DEFAULT_MAX_CHUNK_BYTES) {
      const archiveMp3 = await resolveViaArchiveOrg(artist, title, rawQuery, durationSec);
      if (archiveMp3) return archiveMp3;
    }
    return scResult;
  }
  diag?.push('sc=0');

  // Tier 5: Archive.org Studio/Album MP3/M4A Fallback
  const archiveResult = await resolveViaArchiveOrg(artist, title, rawQuery, durationSec);
  if (archiveResult) return archiveResult;
  diag?.push('ia=0');

  // Tier 6: Bilibili Official MV MP4 Fallback (J-Pop / Asian / Anime tracks)
  return await resolveViaBilibili(artist, title, rawQuery, durationSec, diag);
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
    ? `v4:id:${id}`
    : `v4:q:${rawQuery.toLowerCase()}|${artistParam.toLowerCase()}|${titleParam.toLowerCase()}`;

  try {
    const now = Date.now();
    const cached404 = notFoundCache.get(cacheKey);
    if (cached404 && cached404.expires > now) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(cached404.body);
      return;
    }

    let formatInfo = urlCache.get(cacheKey);

    // If cache expired or not found, resolve with ytdl
    if (!formatInfo || formatInfo.expires < now) {
      // Always instantiate VisionOS-only Ytdl for search & metadata (never triggers worker.js crash on Vercel)
      const y = new Ytdl({ clients: [Client.VisionOS] });
      let videoId = id;
      let candidateVideoIds: string[] = id ? [id] : [];

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
          'fanmade',
          'fan made',
          'fan-made',
          'tribute',
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
        candidateVideoIds = [...sortedMatches, ...validMatches, ...searchResults]
          .map((m: any) => m?.id)
          .filter((vid: any, idx: number, arr: any[]) => typeof vid === 'string' && vid && arr.indexOf(vid) === idx)
          .slice(0, 3);
      }

      const diag: string[] = [];
      const resolved = await resolveAudioFormat(
        videoId || '',
        y,
        artistParam,
        titleParam,
        rawQuery,
        durationParam,
        diag
      );
      if (!resolved || (!resolved.url && !resolved.buffer)) {
        const errBody = JSON.stringify({
          error: 'No audio stream format found for ' + (videoId || rawQuery),
          videoId: videoId || candidateVideoIds[0] || null,
          videoIds: candidateVideoIds,
          trace: diag,
        });
        if (notFoundCache.size >= 50) {
          const oldest = notFoundCache.keys().next().value;
          if (oldest) notFoundCache.delete(oldest);
        }
        notFoundCache.set(cacheKey, { body: errBody, expires: now + 3 * 60 * 1000 });
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(errBody);
        return;
      }

      formatInfo = {
        ...resolved,
        expires: now + 5 * 60 * 1000, // Cache for 5 minutes
      };
      if (urlCache.size >= 20) {
        const oldestKey = urlCache.keys().next().value;
        if (oldestKey) urlCache.delete(oldestKey);
      }
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
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('Vary', 'Range');
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
    if (formatInfo.referer) fetchHeaders['Referer'] = formatInfo.referer;

    let mediaRes = await fetch(formatInfo.url!, { headers: fetchHeaders });

    // If cached stream URL expired or rejected (403/410), clear cache once and re-resolve
    if ((mediaRes.status === 403 || mediaRes.status === 410) && !id) {
      urlCache.delete(cacheKey);
    }

    res.statusCode = mediaRes.status; // 206 for range requests, 200 for full stream
    res.setHeader('Content-Type', mediaRes.headers.get('content-type') || formatInfo.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Vary', 'Range');

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
