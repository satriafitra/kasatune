import { Ytdl } from '@distube/ytdl-core';

async function findRest() {
  const ytdl = new Ytdl();
  const queries = [
    { name: 'The Feels', q: '"The Feels" TWICE "Formula of Love" audio' },
    { name: 'MORE & MORE', q: '"MORE & MORE" TWICE "MORE & MORE" audio' },
    { name: 'CRY FOR ME', q: '"CRY FOR ME" TWICE audio' }
  ];

  for (const q of queries) {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q.q)}`);
    const text = await res.text();
    const rawIds = text.match(/"videoId":"([a-zA-Z0-9_-]{11})"/g) || [];
    const videoIds = [...new Set(rawIds.map(v => v.split(':"')[1].replace('"', '')))];

    for (const vid of videoIds.slice(0, 5)) {
      try {
        const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${vid}`);
        console.log(`[${q.name}] -> ${vid} : "${info.videoDetails.title}" (${info.videoDetails.lengthSeconds}s)`);
        break;
      } catch (e) {}
    }
  }
}
findRest();
