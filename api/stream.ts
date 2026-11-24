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
  const q = url.searchParams.get('q') || (req.query && req.query.q);
  const id = url.searchParams.get('id') || (req.query && req.query.id);

  if (!q && !id) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing parameter "q" or "id"' }));
    return;
  }

  const cacheKey = id || q.toLowerCase().trim();

  try {
    const now = Date.now();
    let formatInfo = urlCache.get(cacheKey);

    // If cache expired or not found, resolve with ytdl
    if (!formatInfo || formatInfo.expires < now) {
      const y = new Ytdl();
      let videoId = id;

      if (!videoId) {
        // Search clean audio target to match studio recording & lyrics timing
        const searchTarget = `${q}`;
        const searchResults = await y.search(searchTarget);

        const forbiddenKeywords = [
          'karaoke',
          'instrumental',
          'backing track',
          'minus one',
          'off vocal',
          'tanpa vokal',
          'no vocal',
          'karaoke version',
          'karaoke video',
          'lirik karaoke',
          'cover',
          'remix',
          'acoustic cover',
          'piano cover',
          'guitar cover',
          'drum cover',
          'fingerstyle',
          'bass tab',
          'tutorial',
          'how to play',
          'slowed',
          'reverb',
          'sped up',
          'speed up',
          'nightcore',
          'parody',
          'reaction',
          'teaser',
          'ringtone',
        ];

        const isForbidden = (title: string, authorName?: string) => {
          const lower = `${title} ${authorName || ''}`.toLowerCase();
          return forbiddenKeywords.some((word) => lower.includes(word));
        };

        // Filter out shorts (< 45s) and multi-hour mix loops (> 660s) and karaoke/instrumentals
        let validMatches = searchResults.filter((item: any) => {
          const sec = item.lengthSeconds || 0;
          return sec >= 45 && sec <= 660 && !isForbidden(item.title, item.author?.name);
        });

        // If all were filtered (rare), relax non-karaoke filter but strictly keep no-karaoke
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

        // Score candidates for official studio vocals & exact sync
        const scoreCandidate = (item: any) => {
          let score = 0;
          const t = (item.title || '').toLowerCase();
          const a = (item.author?.name || '').toLowerCase();
          const qLower = q.toLowerCase();

          // 1. YouTube Topic channel (Official release directly uploaded by record label/distributor)
          if (a.includes('- topic') || a.includes('topic')) score += 120;

          // 2. Author matches artist name in query
          const words = qLower.split(/[\s-]+/).filter((w: string) => w.length > 2);
          if (words.some((w: string) => a.includes(w))) score += 60;

          // 3. Official studio audio badges
          if (t.includes('official audio')) score += 50;
          if (t.includes('audio') || t.includes('official track')) score += 40;
          if (
            t.includes('official lyric video') ||
            t.includes('official video') ||
            t.includes('official music video')
          )
            score += 30;
          if (t.includes('lyric') || t.includes('lirik')) score += 25;

          // 4. Exact title matching
          if (t.includes(qLower) || qLower.includes(t)) score += 35;

          // 5. Heavy penalties for live, acoustic, concert, slowed
          if (t.includes('live') && !qLower.includes('live')) score -= 60;
          if (t.includes('concert') && !qLower.includes('concert')) score -= 60;
          if (t.includes('acoustic') && !qLower.includes('acoustic')) score -= 40;
          if (t.includes('mix') && !qLower.includes('mix')) score -= 50;

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
      const format = chooseFormat(info.formats, {
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
