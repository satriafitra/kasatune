import { Ytdl } from '@distube/ytdl-core';

const twiceSongs = [
  { id: 'twice-whatislove', query: 'TWICE What is Love official audio' },
  { id: 'twice-fancy', query: 'TWICE FANCY official audio' },
  { id: 'twice-feelspecial', query: 'TWICE Feel Special official audio' },
  { id: 'twice-thefeels', query: 'TWICE The Feels official audio' },
  { id: 'twice-scientist', query: 'TWICE SCIENTIST official audio' },
  { id: 'twice-icantstopme', query: "TWICE I CAN'T STOP ME official audio" },
  { id: 'twice-talkthattalk', query: 'TWICE Talk that Talk official audio' },
  { id: 'twice-alcoholfree', query: 'TWICE Alcohol-Free official audio' },
  { id: 'twice-setmefree', query: 'TWICE SET ME FREE official audio' },
  { id: 'twice-moonlightsunrise', query: 'TWICE MOONLIGHT SUNRISE official audio' },
  { id: 'twice-onespark', query: 'TWICE ONE SPARK official audio' },
  { id: 'twice-igotyou', query: 'TWICE I GOT YOU official audio' },
  { id: 'twice-tt', query: 'TWICE TT official audio' },
  { id: 'twice-cheerup', query: 'TWICE CHEER UP official audio' },
  { id: 'twice-likey', query: 'TWICE LIKEY official audio' },
  { id: 'twice-likeoohahh', query: 'TWICE Like OOH-AHH official audio' },
  { id: 'twice-knockknock', query: 'TWICE KNOCK KNOCK official audio' },
  { id: 'twice-dancethenightaway', query: 'TWICE Dance The Night Away official audio' },
  { id: 'twice-yesoryes', query: 'TWICE YES or YES official audio' },
  { id: 'twice-moremore', query: 'TWICE MORE & MORE official audio' },
  { id: 'twice-cryforme', query: 'TWICE CRY FOR ME official audio' }
];

async function findTwiceVideos() {
  const ytdl = new Ytdl();
  const results = {};
  for (const item of twiceSongs) {
    try {
      const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(item.query)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const text = await res.text();
      const rawIds = text.match(/"videoId":"([a-zA-Z0-9_-]{11})"/g) || [];
      const videoIds = [...new Set(rawIds.map(v => v.split(':"')[1].replace('"', '')))];
      
      let found = null;
      for (const vid of videoIds.slice(0, 4)) {
        try {
          const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${vid}`);
          const title = info.videoDetails.title;
          const dur = parseInt(info.videoDetails.lengthSeconds);
          // Looking for studio tracks (~160s to 250s)
          if (dur >= 160 && dur <= 260) {
            found = { vid, title, dur };
            break;
          }
        } catch (e) {}
      }
      if (found) {
        results[item.id] = found;
        console.log(`[FOUND] ${item.id} -> ${found.vid} : "${found.title}" (${found.dur}s)`);
      } else {
        console.log(`[MISSED] ${item.id}`);
      }
    } catch (e) {
      console.error(`[ERROR] ${item.id}:`, e.message);
    }
  }
  return results;
}

findTwiceVideos();
