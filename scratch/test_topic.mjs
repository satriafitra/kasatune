import { Ytdl } from '@distube/ytdl-core';

async function testTopic() {
  const ytdl = new Ytdl();
  const queries = [
    'What is Love TWICE "Provided to YouTube by JYP Entertainment"',
    'The Feels TWICE "Provided to YouTube by JYP Entertainment"',
    'SCIENTIST TWICE "Provided to YouTube by JYP Entertainment"',
    'Talk that Talk TWICE "Provided to YouTube by JYP Entertainment"'
  ];

  for (const q of queries) {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`);
    const text = await res.text();
    const rawIds = text.match(/"videoId":"([a-zA-Z0-9_-]{11})"/g) || [];
    const videoIds = [...new Set(rawIds.map(v => v.split(':"')[1].replace('"', '')))];
    for (const vid of videoIds.slice(0, 3)) {
      try {
        const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${vid}`);
        console.log(`[TOPIC] "${info.videoDetails.title}" by "${info.videoDetails.author.name}" (${info.videoDetails.lengthSeconds}s) -> ${vid}`);
        break;
      } catch (e) {}
    }
  }
}

testTopic();
