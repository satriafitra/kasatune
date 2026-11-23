import { Ytdl } from '@distube/ytdl-core';

const songsToLookup = [
  { id: 'twice-fancy', q: 'FANCY TWICE "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-feelspecial', q: 'Feel Special TWICE "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-thefeels', q: 'The Feels TWICE "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-icantstopme', q: 'I CANT STOP ME TWICE "Eyes wide open" "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-talkthattalk', q: 'Talk that Talk TWICE "BETWEEN 1&2" "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-setmefree', q: 'SET ME FREE TWICE "READY TO BE" "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-moonlightsunrise', q: 'MOONLIGHT SUNRISE TWICE "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-onespark', q: 'ONE SPARK TWICE "With YOU-th" "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-igotyou', q: 'I GOT YOU TWICE "With YOU-th" "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-tt', q: 'TT TWICE "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-cheerup', q: 'CHEER UP TWICE "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-likey', q: 'LIKEY TWICE "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-likeoohahh', q: 'Like OOH AHH TWICE "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-knockknock', q: 'KNOCK KNOCK TWICE "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-dancethenightaway', q: 'Dance The Night Away TWICE "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-yesoryes', q: 'YES or YES TWICE "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-moremore', q: 'MORE & MORE TWICE "Provided to YouTube by JYP Entertainment"' },
  { id: 'twice-cryforme', q: 'CRY FOR ME TWICE "Provided to YouTube by JYP Entertainment"' }
];

async function lookupAll() {
  const ytdl = new Ytdl();
  for (const s of songsToLookup) {
    try {
      const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(s.q)}`);
      const text = await res.text();
      const rawIds = text.match(/"videoId":"([a-zA-Z0-9_-]{11})"/g) || [];
      const videoIds = [...new Set(rawIds.map(v => v.split(':"')[1].replace('"', '')))];

      for (const vid of videoIds.slice(0, 5)) {
        try {
          const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${vid}`);
          const title = info.videoDetails.title;
          const author = info.videoDetails.author.name;
          const dur = parseInt(info.videoDetails.lengthSeconds);
          if (!title.toLowerCase().includes('japanese') && !title.toLowerCase().includes('instrumental') && !title.toLowerCase().includes('remix')) {
            console.log(`[MAP] '${s.id}': '${vid}', // "${title}" (${dur}s)`);
            break;
          }
        } catch(e) {}
      }
    } catch (e) {
      console.error(s.id, e.message);
    }
  }
}

lookupAll();
