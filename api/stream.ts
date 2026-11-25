import { Ytdl, chooseFormat } from '@distube/ytdl-core';
import { Readable } from 'stream';

// In-memory cache for resolved format URLs to make Range scrubbing & repeated plays instant
interface CachedFormat {
  url: string;
  mimeType: string;
  contentLength?: string;
  expires: number;
}
const urlCache = new Map<string, CachedFormat>();

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
    ? `v2:id:${id}`
    : `v2:q:${rawQuery.toLowerCase()}|${artistParam.toLowerCase()}|${titleParam.toLowerCase()}`;

  try {
    const now = Date.now();
    let formatInfo = urlCache.get(cacheKey);

    // If cache expired or not found, resolve with ytdl
    if (!formatInfo || formatInfo.expires < now) {
      const y = new Ytdl();
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

        if (!match) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'No matching track found' }));
          return;
        }
        videoId = match.id;
      }

      const info = await y.getInfo(videoId);
      // Prefer universal AAC MP4 audio (itag 140 / audio/mp4) for reliable playback & seeking across all browsers
      const mp4AudioFormats = (info.formats || [])
        .filter((f: any) => f.hasAudio && !f.hasVideo && f.mimeType?.includes('audio/mp4') && f.url)
        .sort((a: any, b: any) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

      const format =
        mp4AudioFormats[0] ||
        chooseFormat(info.formats, {
          quality: 'highestaudio',
          filter: (f: any) => f.hasAudio && !f.hasVideo,
        });

      if (!format || !format.url) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'No audio stream format found' }));
        return;
      }

      formatInfo = {
        url: format.url,
        mimeType: format.mimeType || 'audio/mp4; codecs="mp4a.40.2"',
        contentLength: format.contentLength ? String(format.contentLength) : undefined,
        expires: now + 5 * 60 * 1000, // Cache for 5 minutes
      };
      urlCache.set(cacheKey, formatInfo);
    }

    // Handle Client Range Requests for seamless seeking and full-length intro-to-outro playback
    const clientRange = req.headers ? (req.headers.range || req.headers['range']) : undefined;
    const fetchHeaders: Record<string, string> = {};
    if (clientRange) {
      fetchHeaders['Range'] = clientRange;
    }

    const mediaRes = await fetch(formatInfo.url, {
      headers: fetchHeaders,
    });

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
