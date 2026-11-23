import { Ytdl } from '@distube/ytdl-core';

const twiceList = [
  { id: 'twice-whatislove', title: 'What is Love?' },
  { id: 'twice-fancy', title: 'FANCY' },
  { id: 'twice-feelspecial', title: 'Feel Special' },
  { id: 'twice-thefeels', title: 'The Feels' },
  { id: 'twice-scientist', title: 'SCIENTIST' },
  { id: 'twice-icantstopme', title: "I CAN'T STOP ME" },
  { id: 'twice-talkthattalk', title: 'Talk that Talk' },
  { id: 'twice-alcoholfree', title: 'Alcohol-Free' },
  { id: 'twice-setmefree', title: 'SET ME FREE' },
  { id: 'twice-moonlightsunrise', title: 'MOONLIGHT SUNRISE' },
  { id: 'twice-onespark', title: 'ONE SPARK' },
  { id: 'twice-igotyou', title: 'I GOT YOU' },
  { id: 'twice-tt', title: 'TT' },
  { id: 'twice-cheerup', title: 'CHEER UP' },
  { id: 'twice-likey', title: 'LIKEY' },
  { id: 'twice-likeoohahh', title: 'Like OOH-AHH' },
  { id: 'twice-knockknock', title: 'KNOCK KNOCK' },
  { id: 'twice-dancethenightaway', title: 'Dance The Night Away' },
  { id: 'twice-yesoryes', title: 'YES or YES' },
  { id: 'twice-moremore', title: 'MORE & MORE' },
  { id: 'twice-cryforme', title: 'CRY FOR ME' }
];

async function findAllTopicTracks() {
  const ytdl = new Ytdl();
  const foundMap = {};

  for (const item of twiceList) {
    const q = `"${item.title}" "TWICE - Topic"`;
    try {
      const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const text = await res.text();
      const rawIds = text.match(/"videoId":"([a-zA-Z0-9_-]{11})"/g) || [];
      const videoIds = [...new Set(rawIds.map(v => v.split(':"')[1].replace('"', '')))];

      let matched = null;
      for (const vid of videoIds.slice(0, 5)) {
        try {
          const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${vid}`);
          const author = info.videoDetails.author.name;
          const title = info.videoDetails.title;
          const dur = parseInt(info.videoDetails.lengthSeconds);
          // Prefer TWICE - Topic
          if (author.includes('Topic') || (!title.includes('M/V') && !title.includes('MV') && !title.includes('Teaser'))) {
            matched = { vid, title, author, dur };
            break;
          }
          if (!matched) {
            matched = { vid, title, author, dur };
          }
        } catch (e) {}
      }

      if (matched) {
        foundMap[item.id] = matched;
        console.log(`[FOUND] ${item.id} -> ${matched.vid} : "${matched.title}" by "${matched.author}" (${matched.dur}s)`);
      } else {
        console.log(`[MISSED] ${item.id}`);
      }
    } catch (e) {
      console.error(`[ERR] ${item.id}:`, e.message);
    }
  }

  return foundMap;
}

findAllTopicTracks();
