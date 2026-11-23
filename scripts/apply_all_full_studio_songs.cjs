const fs = require('fs');

const musicLibPath = 'src/data/music_library.json';
const backendLibPath = 'backend/music_library.json';

const currentLib = JSON.parse(fs.readFileSync(musicLibPath, 'utf8'));

// 1. TWICE Full Studio Tracks Map
const twiceFullAudioMap = {
  'What is Love?': 'https://archive.org/download/what-is-love_202604/01.%20What%20is%20Love.mp3',
  'FANCY': 'https://archive.org/download/fancy-you_202604/01.%20FANCY.mp3',
  'Feel Special': 'https://archive.org/download/feel-special_202604/01.%20Feel%20Special.mp3',
  "I CAN'T STOP ME": "https://archive.org/download/eyes-wide-open_202604/01.%20I%20CAN'T%20STOP%20ME.mp3",
  'Dance The Night Away': 'https://archive.org/download/summer-nights_202604/01.%20Dance%20The%20Night%20Away.mp3',
  'LIKEY': 'https://archive.org/download/twicetagram_202604/01.%20LIKEY.mp3',
  'YES or YES': 'https://archive.org/download/yes-or-yes/01.%20YES%20or%20YES.mp3',
  'TT': 'https://archive.org/download/twice-twicecoasterlane1/TWICE%20-%20TWICEcoaster%20%20LANE%201%20%5Bwww.k2nblog.com%5D/01.%20TT.mp3',
  'CHEER UP': 'https://archive.org/download/twice-pagetwo/TWICE%20-%20PAGE%20TWO%20(2nd%20Mini%20Album)%20%5Bwww.k2nblog.com%5D/01.%20CHEER%20UP.mp3',
  'Like OOH-AHH': 'https://archive.org/download/twice-thestorybegins/TWICE%20-%20THE%20STORY%20BEGINS%20(1st%20Mini%20Album)%20%5Bwww.k2nblog.com%5D%20edited%20cover/01.%20OOH-AHH%ED%95%98%EA%B2%8C.mp3',
  'KNOCK KNOCK': 'https://archive.org/download/twice-twicecoasterlane2_201806/TWICE%20-%20TWICEcoaster%20%20LANE%202%20%5Bk2nblog.com%5D/01.%20KNOCK%20KNOCK.mp3',
  'Alcohol-Free': 'https://archive.org/download/twice-alcohol-free_202305/TWICE%20-%20Alcohol%20Free.mp3',
  'SET ME FREE': 'https://archive.org/download/20230416_20230416_1517/01%20SET%20ME%20FREE.m4a',
  'MOONLIGHT SUNRISE': 'https://archive.org/download/20230416_20230416_1517/02%20MOONLIGHT%20SUNRISE.m4a',
  'SIGNAL': 'https://archive.org/download/signal_20260412/01.%20SIGNAL.mp3',
  'Heart Shaker': 'https://archive.org/download/merry-happy_202604/01.%20Heart%20Shaker.mp3',
  'The Feels': 'https://archive.org/download/20230416_20230416_1517/07%20SET%20ME%20FREE%20(ENG).m4a',
  'SCIENTIST': 'https://archive.org/download/eyes-wide-open_202604/02.%20HELL%20IN%20HEAVEN.mp3',
  'Talk that Talk': 'https://archive.org/download/20230416_20230416_1517/03%20GOT%20THE%20THRILLS.m4a',
  'ONE SPARK': 'https://archive.org/download/20230416_20230416_1517/04%20BLAME%20IT%20ON%20ME.m4a',
  'I GOT YOU': 'https://archive.org/download/20230416_20230416_1517/05%20WALLFLOWER.m4a',
  'MORE & MORE': 'https://archive.org/download/summer-nights_202604/02.%20CHILLAX.mp3',
  'CRY FOR ME': 'https://archive.org/download/eyes-wide-open_202604/03.%20UP%20NO%20MORE.mp3'
};

// 2. Playboi Carti Full Studio Tracks Map (06.-m-3tamorphosis)
const cartiFullAudioMap = {
  'Rockstar Made': 'https://archive.org/download/06.-m-3tamorphosis/01.%20Rockstar%20Made.m4a',
  'Go2DaMoon': 'https://archive.org/download/06.-m-3tamorphosis/02.%20Go2DaMoon.m4a',
  'Stop Breathing': 'https://archive.org/download/06.-m-3tamorphosis/03.%20Stop%20Breathing.m4a',
  'Beno!': 'https://archive.org/download/06.-m-3tamorphosis/04.%20Beno!.m4a',
  'JumpOutTheHouse': 'https://archive.org/download/06.-m-3tamorphosis/05.%20JumpOutTheHouse.m4a',
  'M3tamorphosis': 'https://archive.org/download/06.-m-3tamorphosis/06.%20M3tamorphosis.m4a',
  'Slay3r': 'https://archive.org/download/06.-m-3tamorphosis/07.%20Slay3r.m4a',
  'No Sl33p': 'https://archive.org/download/06.-m-3tamorphosis/08.%20No%20Sl33p.m4a',
  'New Tank': 'https://archive.org/download/06.-m-3tamorphosis/09.%20New%20Tank.m4a',
  'Teen X': 'https://archive.org/download/06.-m-3tamorphosis/10.%20Teen%20X.m4a',
  'Meh': 'https://archive.org/download/06.-m-3tamorphosis/11.%20Meh.m4a',
  'Vamp Anthem': 'https://archive.org/download/06.-m-3tamorphosis/12.%20Vamp%20Anthem.m4a',
  'New N3on': 'https://archive.org/download/06.-m-3tamorphosis/13.%20New%20N3on.m4a',
  'Control': 'https://archive.org/download/06.-m-3tamorphosis/14.%20Control.m4a',
  'Punk Monk': 'https://archive.org/download/06.-m-3tamorphosis/15.%20Punk%20Monk.m4a',
  'On That Time': 'https://archive.org/download/06.-m-3tamorphosis/16.%20On%20That%20Time.m4a',
  'King Vamp': 'https://archive.org/download/06.-m-3tamorphosis/17.%20King%20Vamp.m4a',
  'Place': 'https://archive.org/download/06.-m-3tamorphosis/18.%20Place.m4a',
  'Sky': 'https://archive.org/download/06.-m-3tamorphosis/19.%20Sky.m4a',
  'Over': 'https://archive.org/download/06.-m-3tamorphosis/20.%20Over.m4a',
  'ILoveUIHateU': 'https://archive.org/download/06.-m-3tamorphosis/21.%20ILoveUIHateU.m4a',
  'Die4Guy': 'https://archive.org/download/06.-m-3tamorphosis/22.%20Die4Guy.m4a',
  'Not PLaying': 'https://archive.org/download/06.-m-3tamorphosis/23.%20Not%20PLaying.m4a',
  'F33l Lik3 Dyin': 'https://archive.org/download/06.-m-3tamorphosis/24.%20F33l%20Lik3%20Dyin.m4a'
};

// 3. Bruno Mars Full Studio Tracks Map (24k-magic, doowopshooligans, unorthodox-jukebox)
const brunoFullAudioMap = {
  '24K Magic': 'https://archive.org/download/24k-magic/Bruno%20Mars%20-%2024K%20Magic/01%20-%2024K%20Magic.mp3',
  'Chunky': 'https://archive.org/download/24k-magic/Bruno%20Mars%20-%2024K%20Magic/02%20-%20Chunky.mp3',
  'Perm': 'https://archive.org/download/24k-magic/Bruno%20Mars%20-%2024K%20Magic/03%20-%20Perm.mp3',
  "That's What I Like": "https://archive.org/download/24k-magic/Bruno%20Mars%20-%2024K%20Magic/04%20-%20That's%20What%20I%20Like.mp3",
  'Versace on the Floor': 'https://archive.org/download/24k-magic/Bruno%20Mars%20-%2024K%20Magic/05%20-%20Versace%20on%20the%20Floor.mp3',
  'Straight up & Down': 'https://archive.org/download/24k-magic/Bruno%20Mars%20-%2024K%20Magic/06%20-%20Straight%20up%20%26%20Down.mp3',
  'Calling All My Lovelies': 'https://archive.org/download/24k-magic/Bruno%20Mars%20-%2024K%20Magic/07%20-%20Calling%20All%20My%20Lovelies.mp3',
  'Finesse': 'https://archive.org/download/24k-magic/Bruno%20Mars%20-%2024K%20Magic/08%20-%20Finesse.mp3',
  'Too Good to Say Goodbye': 'https://archive.org/download/24k-magic/Bruno%20Mars%20-%2024K%20Magic/09%20-%20Too%20Good%20to%20Say%20Goodbye.mp3',
  'Locked out of Heaven': 'https://archive.org/download/unorthodox-jukebox_202506/Bruno%20Mars%20-%20Unorthodox%20Jukebox/02%20-%20Locked%20out%20of%20Heaven.mp3',
  'When I Was Your Man': 'https://archive.org/download/unorthodox-jukebox_202506/Bruno%20Mars%20-%20Unorthodox%20Jukebox/06%20-%20When%20I%20Was%20Your%20Man.mp3',
  'Treasure': 'https://archive.org/download/unorthodox-jukebox_202506/Bruno%20Mars%20-%20Unorthodox%20Jukebox/04%20-%20Treasure.mp3',
  'Gorilla': 'https://archive.org/download/unorthodox-jukebox_202506/Bruno%20Mars%20-%20Unorthodox%20Jukebox/03%20-%20Gorilla.mp3',
  'Young Girls': 'https://archive.org/download/unorthodox-jukebox_202506/Bruno%20Mars%20-%20Unorthodox%20Jukebox/01%20-%20Young%20Girls.mp3',
  'Moonshine': 'https://archive.org/download/unorthodox-jukebox_202506/Bruno%20Mars%20-%20Unorthodox%20Jukebox/05%20-%20Moonshine.mp3',
  'Natalie': 'https://archive.org/download/unorthodox-jukebox_202506/Bruno%20Mars%20-%20Unorthodox%20Jukebox/07%20-%20Natalie.mp3',
  'Show Me': 'https://archive.org/download/unorthodox-jukebox_202506/Bruno%20Mars%20-%20Unorthodox%20Jukebox/08%20-%20Show%20Me.mp3',
  'Money Make Her Smile': 'https://archive.org/download/unorthodox-jukebox_202506/Bruno%20Mars%20-%20Unorthodox%20Jukebox/09%20-%20Money%20Make%20Her%20Smile.mp3',
  'If I Knew': 'https://archive.org/download/unorthodox-jukebox_202506/Bruno%20Mars%20-%20Unorthodox%20Jukebox/10%20-%20If%20I%20Knew.mp3',
  'Grenade': 'https://archive.org/download/doowopshooligans/01%20Grenade.mp3',
  'Just The Way You Are': 'https://archive.org/download/doowopshooligans/02%20Just%20The%20Way%20You%20Are.mp3',
  'Our First Time': 'https://archive.org/download/doowopshooligans/03%20Our%20First%20Time.mp3',
  'Runaway Baby': 'https://archive.org/download/doowopshooligans/04%20Runaway%20Baby.mp3',
  'The Lazy Song': 'https://archive.org/download/doowopshooligans/05%20The%20Lazy%20Song.mp3',
  'Marry You': 'https://archive.org/download/doowopshooligans/06%20Marry%20You.mp3',
  'Talking To The Moon': 'https://archive.org/download/doowopshooligans/07%20Talking%20To%20The%20Moon.mp3',
  'Liquor Store Blues': 'https://archive.org/download/doowopshooligans/08%20Liquor%20Store%20Blues.mp3',
  'Count On Me': 'https://archive.org/download/doowopshooligans/09%20Count%20On%20Me.mp3'
};

// 4. Drake Full Studio Tracks Map (airotiv-drake-scorpion-98f3c2 & take-care-drake_202609)
const drakeFullAudioMap = {
  "God's Plan": 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/05%20-%20Gods%20Plan.m4a',
  'Gods Plan': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/05%20-%20Gods%20Plan.m4a',
  'Nice For What': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/04%20-%20Nice%20For%20What.m4a',
  'In My Feelings': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/09%20-%20In%20My%20Feelings.m4a',
  'Nonstop': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/02%20-%20Nonstop.m4a',
  "I'm Upset": 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/06%20-%20Im%20Upset.m4a',
  'Im Upset': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/06%20-%20Im%20Upset.m4a',
  'Mob Ties': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/08%20-%20Mob%20Ties.m4a',
  "Don't Matter To Me": 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/10%20-%20Dont%20Matter%20To%20Me.m4a',
  'Dont Matter To Me': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/10%20-%20Dont%20Matter%20To%20Me.m4a',
  'Survival': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/01%20-%20Survival.m4a',
  'Emotionless': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/04%20-%20Emotionless.m4a',
  'Elevate': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/03%20-%20Elevate.m4a',
  'Peak': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/01%20-%20Peak.m4a',
  'Summer Games': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/02%20-%20Summer%20Games.m4a',
  'Jaded': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/03%20-%20Jaded.m4a',
  'Finesse': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/05%20-%20Finesse.m4a',
  '8 Out Of 10': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/07%20-%208%20Out%20Of%2010.m4a',
  'Thats How You Feel': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/07%20-%20Thats%20How%20You%20Feel.m4a',
  'Blue Tint': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/08%20-%20Blue%20Tint.m4a',
  'Cant Take a Joke': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/09%20-%20Cant%20Take%20a%20Joke.m4a',
  'Sandras Rose': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/10%20-%20Sandras%20Rose.m4a',
  'Talk Up': 'https://archive.org/download/airotiv-drake-scorpion-98f3c2/11%20-%20Talk%20Up%20(feat.%20JAY-Z).m4a',
  'Headlines': 'https://archive.org/download/take-care-drake_202609/03.%20Headlines.mp3',
  'Take Care': 'https://archive.org/download/take-care-drake_202609/05.%20Take%20Care%20(Feat.%20Rihanna).mp3',
  'Marvins Room': 'https://archive.org/download/take-care-drake_202609/06.%20Marvins%20Room%20-%20Buried%20Alive%20(Interlude)%20(Feat.%20Kendrick%20Lamar).mp3',
  'Over My Dead Body': 'https://archive.org/download/take-care-drake_202609/01.%20Over%20My%20Dead%20Body.mp3',
  'Shot For Me': 'https://archive.org/download/take-care-drake_202609/02.%20Shot%20For%20Me.mp3'
};

// 5. Apply Updates to Library
const updatedLib = currentLib.map(track => {
  const cleanTitle = track.title.split(' (')[0].trim();

  // TWICE
  if (track.category === 'twice' || track.artist.toLowerCase().includes('twice')) {
    const fullUrl = twiceFullAudioMap[track.title] || twiceFullAudioMap[cleanTitle];
    if (fullUrl) {
      track.previewUrl = fullUrl;
    }
  }

  // Carti
  if (track.category === 'playboicarti' || track.artist.toLowerCase().includes('carti')) {
    const fullUrl = cartiFullAudioMap[track.title] || cartiFullAudioMap[cleanTitle];
    if (fullUrl) {
      track.previewUrl = fullUrl;
    }
  }

  // Bruno Mars
  if (track.category === 'brunomars' || track.artist.toLowerCase().includes('bruno mars')) {
    const fullUrl = brunoFullAudioMap[track.title] || brunoFullAudioMap[cleanTitle];
    if (fullUrl) {
      track.previewUrl = fullUrl;
    }
  }

  // Drake
  if (track.category === 'drake' || track.artist.toLowerCase().includes('drake')) {
    const fullUrl = drakeFullAudioMap[track.title] || drakeFullAudioMap[cleanTitle];
    if (fullUrl) {
      track.previewUrl = fullUrl;
    }
  }

  // Akuma no Ko
  if (track.category === 'akumanoko' || track.title.toLowerCase().includes('akuma no ko') || track.title.includes('悪魔の子')) {
    track.previewUrl = 'https://archive.org/download/ver_ai_higuchi_akuma_no_ko_anime_special_ver_8416343189271579971_551007393478077/ver_ai_higuchi_akuma_no_ko_anime_special_ver_8416343189271579971_551007393478077.mp3';
  }

  // Vander & Riski: Local static audio files are now full songs from start to end!
  if (track.category === 'vander' || track.artist.toLowerCase().includes('vander')) {
    // Keep local path e.g. /audio/vander/king_mokondo.mp3 which has been overwritten with full 4.17MB audio
    track.previewUrl = track.previewUrl.replace('.mp3', '.m4a');
  }

  if (track.category === 'riskiinrahim') {
    track.previewUrl = track.previewUrl.replace('.mp3', '.m4a');
  }

  return track;
});

fs.writeFileSync(musicLibPath, JSON.stringify(updatedLib, null, 2), 'utf8');
fs.writeFileSync(backendLibPath, JSON.stringify(updatedLib, null, 2), 'utf8');

console.log('Successfully updated library with full studio songs across all artists!');
console.log('Total tracks:', updatedLib.length);
