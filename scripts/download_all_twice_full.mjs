import { Ytdl } from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';

const twiceTracks = [
  {
    id: 'twice-whatislove',
    title: 'What is Love?',
    dest: 'public/audio/twice/what_is_love.mp3',
    directUrl: 'https://archive.org/download/what-is-love_202604/01.%20What%20is%20Love.mp3'
  },
  {
    id: 'twice-fancy',
    title: 'FANCY',
    dest: 'public/audio/twice/fancy.mp3',
    directUrl: 'https://archive.org/download/fancy-you_202604/01.%20FANCY.mp3'
  },
  {
    id: 'twice-feelspecial',
    title: 'Feel Special',
    dest: 'public/audio/twice/feel_special.mp3',
    directUrl: 'https://archive.org/download/feel-special_202604/01.%20Feel%20Special.mp3'
  },
  {
    id: 'twice-thefeels',
    title: 'The Feels',
    dest: 'public/audio/twice/the_feels.m4a',
    ytUrl: 'https://www.youtube.com/watch?v=pQBntSH-qFA'
  },
  {
    id: 'twice-scientist',
    title: 'SCIENTIST',
    dest: 'public/audio/twice/scientist.m4a',
    ytUrl: 'https://www.youtube.com/watch?v=FOYH-CxtKI8'
  },
  {
    id: 'twice-icantstopme',
    title: "I CAN'T STOP ME",
    dest: 'public/audio/twice/icantstopme.mp3',
    directUrl: "https://archive.org/download/eyes-wide-open_202604/01.%20I%20CAN'T%20STOP%20ME.mp3"
  },
  {
    id: 'twice-talkthattalk',
    title: 'Talk that Talk',
    dest: 'public/audio/twice/talk_that_talk.m4a',
    ytUrl: 'https://www.youtube.com/watch?v=F2Y0Q9blUPk'
  },
  {
    id: 'twice-alcoholfree',
    title: 'Alcohol-Free',
    dest: 'public/audio/twice/alcohol_free.mp3',
    directUrl: 'https://archive.org/download/twice-alcohol-free_202305/TWICE%20-%20Alcohol%20Free.mp3'
  },
  {
    id: 'twice-setmefree',
    title: 'SET ME FREE',
    dest: 'public/audio/twice/set_me_free.m4a',
    directUrl: 'https://archive.org/download/20230416_20230416_1517/01%20SET%20ME%20FREE.m4a'
  },
  {
    id: 'twice-moonlightsunrise',
    title: 'MOONLIGHT SUNRISE',
    dest: 'public/audio/twice/moonlight_sunrise.m4a',
    directUrl: 'https://archive.org/download/20230416_20230416_1517/02%20MOONLIGHT%20SUNRISE.m4a'
  },
  {
    id: 'twice-onespark',
    title: 'ONE SPARK',
    dest: 'public/audio/twice/one_spark.m4a',
    ytUrl: 'https://www.youtube.com/watch?v=FRx4TH0rFvs'
  },
  {
    id: 'twice-igotyou',
    title: 'I GOT YOU',
    dest: 'public/audio/twice/i_got_you.m4a',
    ytUrl: 'https://www.youtube.com/watch?v=4G08xoCJiQw'
  },
  {
    id: 'twice-tt',
    title: 'TT',
    dest: 'public/audio/twice/tt.mp3',
    directUrl: 'https://archive.org/download/twice-twicecoasterlane1/TWICE%20-%20TWICEcoaster%20%20LANE%201%20%5Bwww.k2nblog.com%5D/01.%20TT.mp3'
  },
  {
    id: 'twice-cheerup',
    title: 'CHEER UP',
    dest: 'public/audio/twice/cheer_up.mp3',
    directUrl: 'https://archive.org/download/twice-pagetwo/TWICE%20-%20PAGE%20TWO%20(2nd%20Mini%20Album)%20%5Bwww.k2nblog.com%5D/01.%20CHEER%20UP.mp3'
  },
  {
    id: 'twice-likey',
    title: 'LIKEY',
    dest: 'public/audio/twice/likey.mp3',
    directUrl: 'https://archive.org/download/twicetagram_202604/01.%20LIKEY.mp3'
  },
  {
    id: 'twice-likeoohahh',
    title: 'Like OOH-AHH',
    dest: 'public/audio/twice/like_ooh_ahh.mp3',
    directUrl: 'https://archive.org/download/twice-thestorybegins/TWICE%20-%20THE%20STORY%20BEGINS%20(1st%20Mini%20Album)%20%5Bwww.k2nblog.com%5D%20edited%20cover/01.%20OOH-AHH%ED%95%98%EA%B2%8C.mp3'
  },
  {
    id: 'twice-knockknock',
    title: 'KNOCK KNOCK',
    dest: 'public/audio/twice/knock_knock.mp3',
    directUrl: 'https://archive.org/download/twice-twicecoasterlane2_201806/TWICE%20-%20TWICEcoaster%20%20LANE%202%20%5Bk2nblog.com%5D/01.%20KNOCK%20KNOCK.mp3'
  },
  {
    id: 'twice-dancethenightaway',
    title: 'Dance The Night Away',
    dest: 'public/audio/twice/dance_the_night_away.mp3',
    directUrl: 'https://archive.org/download/summer-nights_202604/01.%20Dance%20The%20Night%20Away.mp3'
  },
  {
    id: 'twice-yesoryes',
    title: 'YES or YES',
    dest: 'public/audio/twice/yes_or_yes.mp3',
    directUrl: 'https://archive.org/download/yes-or-yes/01.%20YES%20or%20YES.mp3'
  },
  {
    id: 'twice-moremore',
    title: 'MORE & MORE',
    dest: 'public/audio/twice/more_and_more.m4a',
    ytUrl: 'https://www.youtube.com/watch?v=TQpHkRMUotE'
  },
  {
    id: 'twice-cryforme',
    title: 'CRY FOR ME',
    dest: 'public/audio/twice/cry_for_me.m4a',
    ytUrl: 'https://www.youtube.com/watch?v=FF50-LY2Kro'
  }
];

async function downloadDirect(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buf));
}

async function downloadYt(ytdl, url, dest) {
  const stream = await ytdl.download(url, { filter: { hasAudio: true, hasVideo: false } });
  const out = fs.createWriteStream(dest);
  await new Promise((resolve, reject) => {
    stream.pipe(out);
    out.on('finish', resolve);
    out.on('error', reject);
    stream.on('error', reject);
  });
}

async function run() {
  const ytdl = new Ytdl();
  console.log(`Starting download of all ${twiceTracks.length} official TWICE studio tracks...`);

  for (let i = 0; i < twiceTracks.length; i++) {
    const t = twiceTracks[i];
    console.log(`[${i + 1}/${twiceTracks.length}] Downloading "${t.title}"...`);
    try {
      if (t.directUrl) {
        await downloadDirect(t.directUrl, t.dest);
      } else if (t.ytUrl) {
        await downloadYt(ytdl, t.ytUrl, t.dest);
      }
      const sz = fs.statSync(t.dest).size;
      console.log(`   SUCCESS: ${(sz / 1024 / 1024).toFixed(2)} MB -> ${t.dest}`);
    } catch (e) {
      console.error(`   ERROR for ${t.title}:`, e.message);
    }
  }

  console.log('\nAll TWICE downloads finished!');
}

run();
