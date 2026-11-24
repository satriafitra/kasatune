import { Ytdl, chooseFormat } from '@distube/ytdl-core';

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
  const redirect = (url.searchParams.get('redirect') || (req.query && req.query.redirect)) === 'true';

  if (!q && !id) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing parameter "q" or "id"' }));
    return;
  }

  try {
    const y = new Ytdl();
    let videoId = id;

    if (!videoId) {
      const searchTarget = `${q} audio`;
      const searchResults = await y.search(searchTarget);
      // Pick standard song length (1 to 10 minutes), avoid 1-hour loops or 10-second shorts
      const match =
        searchResults.find((item: any) => item.lengthSeconds >= 60 && item.lengthSeconds <= 600) ||
        searchResults[0];

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

    if (redirect) {
      res.statusCode = 302;
      res.setHeader('Location', format.url);
      res.end();
      return;
    }

    // Set streaming headers
    res.statusCode = 200;
    res.setHeader('Content-Type', format.mimeType || 'audio/webm; codecs="opus"');
    res.setHeader('Accept-Ranges', 'bytes');

    const audioStream = y.download(videoId, {
      quality: 'highestaudio',
      filter: (f: any) => f.hasAudio && !f.hasVideo,
    });

    audioStream.pipe(res);

    audioStream.on('error', (err: any) => {
      console.error('Audio stream pipe error:', err.message);
      if (!res.headersSent) {
        res.statusCode = 500;
      }
      res.end();
    });

    req.on('close', () => {
      audioStream.destroy();
    });
  } catch (err: any) {
    console.error('Error in /api/stream:', err.message);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
    }
  }
}
