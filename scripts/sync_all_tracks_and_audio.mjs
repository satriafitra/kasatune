import { Ytdl } from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';

fs.mkdirSync('public/audio/twice', { recursive: true });
fs.mkdirSync('public/audio/higuchi', { recursive: true });

const twiceConfigs = [
  { id: 'twice-whatislove', title: 'What is Love?', file: 'what_is_love.mp3', ytId: null, search: 'What is Love?' },
  { id: 'twice-fancy', title: 'FANCY', file: 'fancy.m4a', ytId: 'Pa6yt970yZo', search: 'FANCY' },
  { id: 'twice-feelspecial', title: 'Feel Special', file: 'feel_special.m4a', ytId: 'CZ61FaoaNHg', search: 'Feel Special' },
  { id: 'twice-thefeels', title: 'The Feels', file: 'the_feels.m4a', ytId: 'pQBntSH-qFA', search: 'The Feels' },
  { id: 'twice-scientist', title: 'SCIENTIST', file: 'scientist.m4a', ytId: 'FOYH-CxtKI8', search: 'SCIENTIST' },
  { id: 'twice-icantstopme', title: "I CAN'T STOP ME", file: 'icantstopme.m4a', ytId: '3d-D5bLDZSk', search: "I CAN'T STOP ME" },
  { id: 'twice-talkthattalk', title: 'Talk that Talk', file: 'talk_that_talk.m4a', ytId: 'F2Y0Q9blUPk', search: 'Talk that Talk' },
  { id: 'twice-alcoholfree', title: 'Alcohol-Free', file: 'alcohol_free.m4a', ytId: 'm8CyyxWgNd8', search: 'Alcohol-Free' },
  { id: 'twice-setmefree', title: 'SET ME FREE', file: 'set_me_free.m4a', ytId: 'IPk3M154M3s', search: 'SET ME FREE' },
  { id: 'twice-moonlightsunrise', title: 'MOONLIGHT SUNRISE', file: 'moonlight_sunrise.m4a', ytId: 'yHEdqF09Mgs', search: 'MOONLIGHT SUNRISE' },
  { id: 'twice-onespark', title: 'ONE SPARK', file: 'one_spark.m4a', ytId: 'FRx4TH0rFvs', search: 'ONE SPARK' },
  { id: 'twice-igotyou', title: 'I GOT YOU', file: 'i_got_you.m4a', ytId: '4G08xoCJiQw', search: 'I GOT YOU' },
  { id: 'twice-tt', title: 'TT', file: 'tt.m4a', ytId: 'ZOWzJwPMxSw', search: 'TT' },
  { id: 'twice-cheerup', title: 'CHEER UP', file: 'cheer_up.m4a', ytId: '0a1zTx1R0KE', search: 'CHEER UP' },
  { id: 'twice-likey', title: 'LIKEY', file: 'likey.m4a', ytId: 'NPYTNZAmINE', search: 'LIKEY' },
  { id: 'twice-likeoohahh', title: 'Like OOH-AHH', file: 'like_ooh_ahh.m4a', ytId: '9ygvjkDTQbM', search: 'Like OOH-AHH' },
  { id: 'twice-knockknock', title: 'KNOCK KNOCK', file: 'knock_knock.m4a', ytId: 'fMF5x20K5F8', search: 'KNOCK KNOCK' },
  { id: 'twice-dancethenightaway', title: 'Dance The Night Away', file: 'dance_the_night_away.m4a', ytId: 'z7zNn7Piti0', search: 'Dance The Night Away' },
  { id: 'twice-yesoryes', title: 'YES or YES', file: 'yes_or_yes.m4a', ytId: '6mTbxCBs0P4', search: 'YES or YES' },
  { id: 'twice-moremore', title: 'MORE & MORE', file: 'more_and_more.m4a', ytId: 'TQpHkRMUotE', search: 'MORE & MORE' },
  { id: 'twice-cryforme', title: 'CRY FOR ME', file: 'cry_for_me.m4a', ytId: 'FF50-LY2Kro', search: 'CRY FOR ME' }
];

const higuchiConfigs = [
  { id: 'higuchi-1597185922', title: '悪魔の子 (Akuma no Ko)', file: 'akuma_no_ko.m4a', ytId: 'sm8u7nigQ-8', search: '悪魔の子', artist: 'ヒグチアイ' },
  { id: 'higuchi-1597185932', title: 'まっさらな大地 (Massara na Daichi)', file: 'massara_na_daichi.m4a', ytId: 'fMgPOhjdUOQ', search: 'まっさらな大地', artist: 'ヒグチアイ' },
  { id: 'higuchi-1656225452', title: '悲しい歌がある理由 (Kanashii Uta ga Aru Riyuu)', file: 'kanashii_uta.m4a', ytId: 'sPge9xBPej8', search: '悲しい歌がある理由', artist: 'ヒグチアイ' },
  { id: 'higuchi-1656225352', title: 'やめるなら今 (Yamerunara Ima)', file: 'yamerunara_ima.m4a', ytId: 'rYnCmwIvaCo', search: 'やめるなら今', artist: 'ヒグチアイ' },
  { id: 'higuchi-1656225372', title: '劇場 (Gekijyou)', file: 'gekijyou.m4a', ytId: 'mPZ-5I1bAIY', search: '劇場', artist: 'ヒグチアイ' },
  { id: 'higuchi-2068133357', title: '悪魔の子 - From THE FIRST TAKE', file: 'akuma_no_ko_first_take.m4a', ytId: 'bOLYBRRpRsU', search: '悪魔の子 - From THE FIRST TAKE', artist: 'ヒグチアイ' }
];

async function downloadTrack(ytdl, ytId, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 100000) {
    console.log(`   [SKIP] Audio already exists (${(fs.statSync(dest).size / 1024 / 1024).toFixed(2)} MB): ${dest}`);
    return;
  }
  const url = `https://www.youtube.com/watch?v=${ytId}`;
  console.log(`   [DOWNLOADING] ${url} -> ${dest}`);
  const stream = await ytdl.download(url, { filter: { hasAudio: true, hasVideo: false } });
  const out = fs.createWriteStream(dest);
  await new Promise((resolve, reject) => {
    stream.pipe(out);
    out.on('finish', resolve);
    out.on('error', reject);
    stream.on('error', reject);
  });
  console.log(`   [DOWNLOAD COMPLETE] ${(fs.statSync(dest).size / 1024 / 1024).toFixed(2)} MB`);
}

async function fetchLyrics(artist, track) {
  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(track)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Webtify/1.0' } });
    if (res.ok) {
      const data = await res.json();
      if (data.syncedLyrics && data.syncedLyrics.length > 30) {
        return { synced: data.syncedLyrics, plain: data.plainLyrics, duration: data.duration };
      }
    }
  } catch (e) {
    console.warn(`LRCLIB fetch error for ${artist} - ${track}:`, e.message);
  }
  return null;
}

async function main() {
  const ytdl = new Ytdl();
  const libPath = 'src/data/music_library.json';
  const backendLibPath = 'backend/music_library.json';
  const lib = JSON.parse(fs.readFileSync(libPath, 'utf8'));

  console.log('=== Step 1: Processing TWICE Audio & Lyrics ===');
  for (const conf of twiceConfigs) {
    const dest = path.join('public/audio/twice', conf.file);
    if (conf.ytId) {
      try {
        await downloadTrack(ytdl, conf.ytId, dest);
      } catch (e) {
        console.error(`Error downloading TWICE ${conf.title}:`, e.message);
      }
    }

    const tIndex = lib.findIndex(t => t.id === conf.id);
    if (tIndex !== -1) {
      lib[tIndex].previewUrl = `/audio/twice/${conf.file}`;
      
      // Fetch fresh LRCLIB synced lyrics
      const lrc = await fetchLyrics('TWICE', conf.search);
      if (lrc) {
        lib[tIndex].syncedLyrics = lrc.synced;
        if (lrc.plain) lib[tIndex].plainLyrics = lrc.plain;
        if (lrc.duration) lib[tIndex].duration = Math.round(lrc.duration);
        console.log(`   [LYRICS SYNCED] TWICE - ${conf.title} (duration: ${lib[tIndex].duration}s)`);
      }
    }
  }

  console.log('\n=== Step 2: Processing Ai Higuchi Audio & Lyrics ===');
  for (const conf of higuchiConfigs) {
    const dest = path.join('public/audio/higuchi', conf.file);
    if (conf.ytId) {
      try {
        await downloadTrack(ytdl, conf.ytId, dest);
      } catch (e) {
        console.error(`Error downloading Higuchi ${conf.title}:`, e.message);
      }
    }

    const tIndex = lib.findIndex(t => t.id === conf.id);
    if (tIndex !== -1) {
      lib[tIndex].previewUrl = `/audio/higuchi/${conf.file}`;

      const lrc = await fetchLyrics(conf.artist, conf.search);
      if (lrc) {
        lib[tIndex].syncedLyrics = lrc.synced;
        if (lrc.plain) lib[tIndex].plainLyrics = lrc.plain;
        if (lrc.duration) lib[tIndex].duration = Math.round(lrc.duration);
        console.log(`   [LYRICS SYNCED] Higuchi - ${conf.title} (duration: ${lib[tIndex].duration}s)`);
      }
    }
  }

  console.log('\n=== Step 3: Saving library datasets ===');
  fs.writeFileSync(libPath, JSON.stringify(lib, null, 2), 'utf8');
  if (fs.existsSync(backendLibPath)) {
    fs.writeFileSync(backendLibPath, JSON.stringify(lib, null, 2), 'utf8');
  }
  console.log(`Successfully updated ${libPath} and ${backendLibPath}`);
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
