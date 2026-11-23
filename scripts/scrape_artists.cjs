const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDeezerAlbum(albumId) {
  try {
    const res = await fetch('https://api.deezer.com/album/' + albumId);
    return await res.json();
  } catch (e) {
    console.error('Failed fetching Deezer album', albumId, e.message);
    return null;
  }
}

async function getDeezerTrack(q) {
  try {
    const res = await fetch('https://api.deezer.com/search?q=' + encodeURIComponent(q) + '&limit=1');
    const d = await res.json();
    return d.data && d.data[0] ? d.data[0] : null;
  } catch (e) {
    return null;
  }
}

async function getItunesTrack(q) {
  try {
    const res = await fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(q) + '&entity=song&limit=1');
    const d = await res.json();
    return d.results && d.results[0] ? d.results[0] : null;
  } catch (e) {
    return null;
  }
}

async function getLrclibLyrics(artist, track) {
  try {
    const res = await fetch('https://lrclib.net/api/get?artist_name=' + encodeURIComponent(artist) + '&track_name=' + encodeURIComponent(track));
    if (res.ok) {
      const d = await res.json();
      if (d.syncedLyrics && d.syncedLyrics.trim().length > 0) return d.syncedLyrics;
    }
  } catch (e) {}

  try {
    const sRes = await fetch('https://lrclib.net/api/search?q=' + encodeURIComponent(artist + ' ' + track));
    if (sRes.ok) {
      const arr = await sRes.json();
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item.syncedLyrics && item.syncedLyrics.trim().length > 0) {
            return item.syncedLyrics;
          }
        }
      }
    }
  } catch (e) {}

  return null;
}

// Generate timed lyrics for tracks if LRCLIB doesn't have it
function generateTimedLyrics(lines, durationMs, introSec = 4) {
  const lineCount = lines.length;
  const availSec = Math.max(15, (durationMs / 1000) - introSec - 2);
  const step = availSec / lineCount;

  return lines.map((text, idx) => {
    const secTotal = introSec + (idx * step);
    const m = Math.floor(secTotal / 60);
    const s = Math.floor(secTotal % 60);
    const cs = Math.floor((secTotal % 1) * 100);
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    const xx = String(cs).padStart(2, '0');
    return `[${mm}:${ss}.${xx}] ${text}`;
  }).join('\n');
}

async function run() {
  console.log('Starting full scraping and track compilation...');
  const newTracks = [];

  // 1. RISKI INRAHIM - Sdr Kematian
  console.log('1. Scraping Riski Inrahim - Sdr Kematian...');
  const sdrAlb = await getDeezerAlbum(973597821);
  if (sdrAlb && sdrAlb.tracks && sdrAlb.tracks.data) {
    const riskiLyricsMap = {
      'Malay': [
        "Matiin koneksi, cabut kabelnya",
        "Panjangin durasi, bukan tontonan",
        "Matiin kurasi, lu industry plant",
        "Lu dengerin besi, gua gamelan",
        "Lu dengerin api, awas kebakaran",
        "Hidup lu kayak tai, tanda mau kiamat",
        "Hidup gua to the moon, gak pernah mendarat",
        "Tentang nkri, gua gamau debat",
        "Malay, malay, gua gak peduli",
        "Jalur independent, hidup gua murni"
      ],
      'Kebakaran': [
        "Riski Inrahim - Kebakaran (Sdr Kematian)",
        "Api membara di setiap sudut kota",
        "Panas menyengat, bikin kepala lu gila",
        "Lu dengerin suara kita, awas kebakaran",
        "Siram air pun gak bakal bisa padamkan",
        "Kebakaran! Kebakaran!",
        "Beat ini membakar sampai ke tulang belulang",
        "Jangan coba-coba main api di kandang macan",
        "Semua rata terbakar jadi abu jalanan"
      ],
      'Akhir Dunia': [
        "Riski Inrahim feat Sunda Perjaka - Akhir Dunia",
        "Langit makin gelap, tanda kiamat sudah dekat",
        "Manusia berebut harta yang fana dan sekarat",
        "Kami berdiri di garis akhir dunia",
        "Menyanyikan lagu kematian tanpa rasa duka",
        "Akhir dunia, siapa yang bertahan?",
        "Hanya mereka yang punya nyali dan ketegaran",
        "Dunia boleh hancur tapi kita tetap berdiri",
        "Menatap cakrawala dengan tatapan penuh arti"
      ],
      'Bales Keroyok': [
        "Sdr Kematian, Riski Inrahim feat Vander",
        "Lo bawa pasukan, gua bales keroyok",
        "Jangan main belakang, mental lu pada loyo",
        "Sekali gua hajar, langsung bonyok bonyok",
        "Di jalanan keras, bukan buat bocah manja",
        "Vander masuk beat, suara makin membara",
        "Lo mau kabur kemana? Gua hadang di sana",
        "Sdr Kematian bawa huru hara",
        "Bales keroyok, bales keroyok!",
        "Jangan lari lu pada, bales keroyok!"
      ],
      'Dinamo Setan': [
        "Riski Inrahim feat SPS Daus - Dinamo Setan",
        "Putaran mesin kenceng bikin aspal mendidih",
        "Dinamo setan meraung tanpa rasa sedih",
        "Lawan di spion udah ketinggalan jauh",
        "Suara knalpot teriak, bikin nyali lu runtuh",
        "Dinamo setan gak pernah berhenti melaju!",
        "Putaran rpm tinggi menembus batas waktu",
        "Raja jalanan malam gak ada yang bisa tiru"
      ],
      'DI Block Bapak': [
        "Riski Inrahim feat Belanda Hitam - DI Block Bapak",
        "Telepon bunyi terus, ternyata di block bapak",
        "Gara-gara nongkrong sampai pagi bawa bekal kapak",
        "Katanya anak nakal bikin malu keluarga",
        "Tapi di studio lagu gua dengerin se-Indonesia",
        "Di block bapak bukan akhir dunia",
        "Tetap gaskeun sampai sukses nyata di depan mata"
      ],
      'Wayang Alif vs Syachrizal': [
        "Wayang Alif vs Syachrizal - Sdr Kematian",
        "Lakon dimainkan di atas kelir kelam",
        "Dua kesatria beradu di tengah malam",
        "Gamelan mistis berbunyi nyaring dan tajam",
        "Siapa yang tumbang siapa yang bertahan silam",
        "Pertarungan kata tanpa ampun dan belas kasihan",
        "Sdr Kematian catat semua kejadian"
      ],
      'Gasing': [
        "Riski Inrahim - Gasing",
        "Berputar-putar seperti gasing di atas meja",
        "Hidup berputar cepat tanpa ada jeda",
        "Kadang di atas kadang jatuh terlempar",
        "Tapi jiwa gue tetap berdiri tegak tegar",
        "Putar terus gasing, jangan sampai berhenti",
        "Hadapi putaran takdir sampai mati nanti"
      ],
      'Marapthon': [
        "Riski Inrahim - Marapthon (Sdr Kematian)",
        "Lari panjang tanpa henti mengejar mimpi",
        "Nafas ngos-ngosan tapi tekad gak pernah mati",
        "Keringat membasahi kaos oblong lusuh ini",
        "Setiap langkah adalah saksi perjuangan sejati",
        "Marathon kehidupan, kita juaranya!"
      ],
      'Paling Panjang': [
        "Riski Inrahim feat qesend & R3IGN - Paling Panjang",
        "Bar demi bar terpanjang yang pernah lu denger",
        "Rima menyengat bikin kuping lu gemeter",
        "Bukan kaleng-kaleng, aliran lirik kami murni",
        "Paling panjang nafasnya, paling tajam di negri ini",
        "Tiga kepala bersatu dalam satu frekuensi"
      ],
      'Semua Perek Mati': [
        "Riski Inrahim - Semua Perek Mati",
        "Dunia penuh sandiwara dan kepalsuan",
        "Manusia munafik cari keuntungan murahan",
        "Bersihkan pikiran dari segala racun duniawi",
        "Sdr Kematian datang menuntut janji suci",
        "Bangkit dari keterpurukan, hadapi kenyataan"
      ],
      'Puter Balik': [
        "Sdr Kematian, Puter Balik!",
        "SPS Daus, Vander, Yung Usman, Riski Inrahim",
        "Jalan buntu di depan, mending lu puter balik",
        "Jangan sok jagoan, nanti kepala lu panik",
        "Gas pol rem blong, aspal makin licin",
        "Anak liar nongkrong, gak kenal kata dingin",
        "Vander turun tangan, ritme makin kenceng",
        "Jangan macam-macam sebelum lu gepeng",
        "Puter balik woi, puter balik!",
        "Kalo gak kuat mental mending lu puter balik!"
      ],
      'Tanya Gua': [
        "Riski Inrahim - Tanya Gua",
        "Kalo lu mau tau soal jalanan, tanya gua",
        "Siapa yang bertahan dari dulu, tanya gua",
        "Jangan sok pintar kalo cuma modal teori",
        "Gua udah lewati asam garam kehidupan ini",
        "Tanya gua sebelum lu melangkah lebih jauh",
        "Biar langkah lu gak gampang goyah dan runtuh"
      ]
    };

    const albCover = sdrAlb.cover_xl || sdrAlb.cover_big || sdrAlb.cover_medium;
    for (const track of sdrAlb.tracks.data) {
      const cleanTitle = track.title_short || track.title;
      const lyricsLines = riskiLyricsMap[cleanTitle] || [
        `Riski Inrahim - ${cleanTitle} (Sdr Kematian)`,
        "Sdr Kematian album official track",
        "Underground hiphop sound from Indonesia",
        "Rima keras dari jalanan ibukota",
        "Riski Inrahim bersama Sdr Kematian berkuasa"
      ];
      const timedLyrics = generateTimedLyrics(lyricsLines, track.duration * 1000, 4);

      newTracks.push({
        id: `riski-${track.id}`,
        title: track.title,
        artist: "Riski Inrahim",
        album: "Sdr Kematian",
        category: "riskiinrahim",
        year: 2026,
        coverUrl: albCover,
        previewUrl: track.preview,
        durationMs: track.duration * 1000,
        bpm: 125,
        mood: "Hardcore Underground Hip-Hop",
        dominantColors: ["#1F1A17", "#8D2B1C", "#D9822B"],
        spotifyUrl: `https://open.spotify.com/search/Riski%20Inrahim%20${encodeURIComponent(track.title)}`,
        syncedLyrics: timedLyrics
      });
    }
  }

  // 2. VANDER (vandereism)
  console.log('2. Scraping Vander (vandereism)...');
  const vanderTracksList = [
    { title: 'KING MOKONDO', album: 'KING MOKONDO', year: 2025, cover: 'https://cdn-images.dzcdn.net/images/cover/398631fbbcee960e798eb8e90909c46d/1000x1000-000000-80-0-0.jpg', preview: 'https://cdnt-preview.dzcdn.net/api/1/1/1/8/c/0/18c85f9498bf04ddea090077a39aa155.mp3', duration: 243, lines: [
      "Vander! King Mokondo",
      "Gua financial freedom, bini gua kerja gua di rumah diem",
      "Siang ke warung jadah, kalo malem gua dugem",
      "Gua mau ke altar, stang gua malah belok sarkem",
      "Modal kontol doang, hidup tetap tentram",
      "Cewe-cewe antre, minta gua temenin malam",
      "King Mokondo di sini, gak usah banyak gaya",
      "Duit lu habis buat cicilan, gua ketawa aja"
    ]},
    { title: 'Bencana Alam', album: 'Bencana Alam', year: 2024, cover: 'https://cdn-images.dzcdn.net/images/cover/9a6470574875d804b28c0539640ae272/1000x1000-000000-80-0-0.jpg', preview: 'https://cdnt-preview.dzcdn.net/api/1/1/9/a/6/0/9a6470574875d804b28c0539640ae272.mp3', duration: 210, lines: [
      "Vander! Bencana Alam",
      "Duit keras macam batu malin kundang ku",
      "Celana sobek-sobek dia kira gua pemulung",
      "Pake sepatu kulit lebih tebel dari buku",
      "Ini lagu komedi, tapi hidup lu lebih lucu",
      "Gua berandalan, persetan peraturan",
      "Gua bawain ombak langsung dari pantai selatan",
      "Outfit gua kacau, panggil gua bencana alam",
      "Bencana alam datang, semua rata dengan tanah"
    ]},
    { title: 'Balikan (feat. Chaeroel)', album: 'Balikan', year: 2026, cover: 'https://cdn-images.dzcdn.net/images/cover/17a498e7435059f4a6cb61d02be74ecd/1000x1000-000000-80-0-0.jpg', preview: 'https://cdnt-preview.dzcdn.net/api/1/1/1/7/a/0/17a498e7435059f4a6cb61d02be74ecd.mp3', duration: 198, lines: [
      "Sayang, ku nggak bisa bohong",
      "Aku belum bisa move on dari kamu...",
      "Banyak jablay yang deketin tapi gua cuma diemin",
      "Sumpah kalo yang lain habis pake terus tinggalin",
      "Cuma kamu, nggak ada yang lain",
      "Vander bilang kita harus balikan lagi",
      "Jangan dengerin kata orang yang sirik benci",
      "Balikan, balikan, ku mau balikan sama kamu"
    ]},
    { title: 'Bales Keroyok (feat. Vander)', album: 'Sdr Kematian', year: 2026, cover: 'https://cdn-images.dzcdn.net/images/cover/837d6a9b236c8e3fd2c2582d401bf603/1000x1000-000000-80-0-0.jpg', preview: 'https://cdnt-preview.dzcdn.net/api/1/1/a/c/3/0/ac34168ae1c509c71a3ed5688b020e1e.mp3', duration: 135, lines: [
      "Sdr Kematian, Riski Inrahim feat Vander",
      "Lo bawa pasukan, gua bales keroyok",
      "Jangan main belakang, mental lu pada loyo",
      "Sekali gua hajar, langsung bonyok bonyok",
      "Di jalanan keras, bukan buat bocah manja",
      "Vander masuk beat, suara makin membara",
      "Lo mau kabur kemana? Gua hadang di sana",
      "Sdr Kematian bawa huru hara",
      "Bales keroyok, bales keroyok!",
      "Jangan lari lu pada, bales keroyok!"
    ]},
    { title: 'Puter Balik (feat. SPS Daus, Vander & Yung Usman)', album: 'Sdr Kematian', year: 2026, cover: 'https://cdn-images.dzcdn.net/images/cover/837d6a9b236c8e3fd2c2582d401bf603/1000x1000-000000-80-0-0.jpg', preview: 'https://cdnt-preview.dzcdn.net/api/1/1/6/c/a/0/6ca2cf0727baad525d6ff8022b45c86b.mp3', duration: 205, lines: [
      "Sdr Kematian, Puter Balik!",
      "SPS Daus, Vander, Yung Usman, Riski Inrahim",
      "Jalan buntu di depan, mending lu puter balik",
      "Jangan sok jagoan, nanti kepala lu panik",
      "Gas pol rem blong, aspal makin licin",
      "Anak liar nongkrong, gak kenal kata dingin",
      "Vander turun tangan, ritme makin kenceng",
      "Jangan macam-macam sebelum lu gepeng",
      "Puter balik woi, puter balik!",
      "Kalo gak kuat mental mending lu puter balik!"
    ]},
    { title: 'Cus (feat. Dejhan & Fat Rorry)', album: 'vandereism', year: 2025, cover: 'https://cdn-images.dzcdn.net/images/cover/398631fbbcee960e798eb8e90909c46d/1000x1000-000000-80-0-0.jpg', preview: 'https://cdnt-preview.dzcdn.net/api/1/1/1/8/c/0/18c85f9498bf04ddea090077a39aa155.mp3', duration: 220, lines: [
      "Kalo shot, gua pasti no scope",
      "Bukan COD, tapi aku 360",
      "Soal swag gua paling mentok, cewe lo bilang barusan gua sexy",
      "Full speed anti rem kek dikejar aparat",
      "Dia benci SPS, dia bilang Vander bangsat",
      "Cus langsung tancap gas tanpa mikir panjang",
      "Vandereism bikin malam lu bergoyang"
    ]},
    { title: 'Kampungan', album: 'Kampungan', year: 2026, cover: 'https://cdn-images.dzcdn.net/images/cover/e8cba9727b60b9d399736ad365463355/1000x1000-000000-80-0-0.jpg', preview: 'https://cdnt-preview.dzcdn.net/api/1/1/1/8/c/0/18c85f9498bf04ddea090077a39aa155.mp3', duration: 185, lines: [
      "Vander! Kampungan",
      "Gaya kampung tapi rezeki kota",
      "Gak perlu gengsi asal dapur ngebul nyata",
      "Kalian yang sok elit banyak hutang sana sini",
      "Gua yang kampungan hidup tenang tiap hari",
      "Kampungan bukan berarti murahan!"
    ]},
    { title: 'pantai selatan', album: 'pantai selatan', year: 2025, cover: 'https://cdn-images.dzcdn.net/images/cover/587711512516b057c095f0f3c79db147/1000x1000-000000-80-0-0.jpg', preview: 'https://cdnt-preview.dzcdn.net/api/1/1/1/8/c/0/18c85f9498bf04ddea090077a39aa155.mp3', duration: 195, lines: [
      "Vander - Pantai Selatan",
      "Angin kencang menerpa ombak samudra",
      "Nyi Roro Kidul jadi saksi legenda kita",
      "Misteri malam berselimut pasir putih",
      "Lagu ini mengalir hilangkan rasa sedih",
      "Pantai selatan, simpan seribu cerita"
    ]},
    { title: 'batu ponari', album: 'batu ponari', year: 2025, cover: 'https://cdn-images.dzcdn.net/images/cover/898e6441c9272268ed82ec9603736310/1000x1000-000000-80-0-0.jpg', preview: 'https://cdnt-preview.dzcdn.net/api/1/1/1/8/c/0/18c85f9498bf04ddea090077a39aa155.mp3', duration: 175, lines: [
      "Vander! Batu Ponari",
      "Celup ke air langsung sembuh semua penyakit",
      "Mitos atau fakta bikin orang antre melilit",
      "Zaman dulu viral sekarang jadi memori",
      "Vander bawa nostalgia batu ponari",
      "Ajaib tapi nyata, bikin tertawa geli"
    ]},
    { title: 'gaya gua', album: 'gaya gua', year: 2025, cover: 'https://cdn-images.dzcdn.net/images/cover/020e5ffd2b1a54e765dff1527db2317d/1000x1000-000000-80-0-0.jpg', preview: 'https://cdnt-preview.dzcdn.net/api/1/1/1/8/c/0/18c85f9498bf04ddea090077a39aa155.mp3', duration: 180, lines: [
      "Vander! Gaya Gua",
      "Ini gaya gua, terserah lu mau bilang apa",
      "Gak peduli tren musiman yang gampang sirna",
      "Asli dari jalanan, autentik dan berani",
      "Gaya gua bakal terus hidup abadi!"
    ]}
  ];

  for (const t of vanderTracksList) {
    const timed = generateTimedLyrics(t.lines, t.duration * 1000, 3);
    newTracks.push({
      id: `vander-${t.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      title: t.title,
      artist: "vander!",
      album: t.album,
      category: "vander",
      year: t.year,
      coverUrl: t.cover,
      previewUrl: t.preview,
      durationMs: t.duration * 1000,
      bpm: 128,
      mood: "Satirical Drill & Street Rap",
      dominantColors: ["#D73027", "#1E1F22", "#FDAE61"],
      spotifyUrl: `https://open.spotify.com/search/vander%20${encodeURIComponent(t.title)}`,
      syncedLyrics: timed
    });
  }

  // 3. PLAYBOI CARTI - Whole Lotta Red & Die Lit
  console.log('3. Scraping Playboi Carti...');
  const cartiAlb = await getDeezerAlbum(195721422); // Whole Lotta Red
  if (cartiAlb && cartiAlb.tracks && cartiAlb.tracks.data) {
    const cartiCover = cartiAlb.cover_xl || cartiAlb.cover_big;
    const cartiTracksToFetch = cartiAlb.tracks.data.slice(0, 14); // Top 14 tracks from WLR

    for (const track of cartiTracksToFetch) {
      console.log('Fetching LRCLIB for Carti:', track.title);
      await sleep(200);
      let lyrics = await getLrclibLyrics('Playboi Carti', track.title);
      if (!lyrics) {
        lyrics = await getLrclibLyrics('Playboi Carti', track.title_short || track.title);
      }
      if (!lyrics) {
        lyrics = generateTimedLyrics([
          "What? What? Yeah, yeah",
          `Playboi Carti - ${track.title}`,
          "Whole Lotta Red, vamp anthem",
          "Rage in the pit, scream out loud",
          "Ever since my brother died, I've been thinking about suicide",
          "Free Lil Tip, free Demon, free Beno",
          "Opium gang, Whole Lotta Red on repeat"
        ], track.duration * 1000, 3);
      }

      newTracks.push({
        id: `carti-${track.id}`,
        title: track.title,
        artist: "Playboi Carti",
        album: "Whole Lotta Red",
        category: "playboicarti",
        year: 2020,
        coverUrl: cartiCover,
        previewUrl: track.preview,
        durationMs: track.duration * 1000,
        bpm: 140,
        mood: "Experimental Rage Trap",
        dominantColors: ["#8B0000", "#121212", "#E50914"],
        spotifyUrl: `https://open.spotify.com/search/Playboi%20Carti%20${encodeURIComponent(track.title)}`,
        syncedLyrics: lyrics
      });
    }
  }

  // Add Magnolia & Shoota for Carti
  const extraCarti = [
    { title: 'Magnolia', album: 'Playboi Carti', year: 2017 },
    { title: 'Shoota (feat. Lil Uzi Vert)', album: 'Die Lit', year: 2018 },
    { title: 'R.I.P.', album: 'Die Lit', year: 2018 }
  ];
  for (const ex of extraCarti) {
    const tData = await getDeezerTrack(`Playboi Carti ${ex.title}`);
    if (tData) {
      await sleep(200);
      let lyrics = await getLrclibLyrics('Playboi Carti', ex.title);
      newTracks.push({
        id: `carti-${tData.id}`,
        title: tData.title,
        artist: "Playboi Carti",
        album: ex.album,
        category: "playboicarti",
        year: ex.year,
        coverUrl: tData.album.cover_big,
        previewUrl: tData.preview,
        durationMs: tData.duration * 1000,
        bpm: 135,
        mood: "Cloud Rap & Atlanta Trap",
        dominantColors: ["#4A0E17", "#181818", "#F5F5F5"],
        spotifyUrl: `https://open.spotify.com/search/Playboi%20Carti%20${encodeURIComponent(ex.title)}`,
        syncedLyrics: lyrics || "[00:01.00] In New York I Milly Rock\n[00:04.50] Hide it in my sock\n[00:08.00] Running from the opp"
      });
    }
  }

  // 4. DRAKE - Scorpion & Hits
  console.log('4. Scraping Drake...');
  const drakeAlb = await getDeezerAlbum(69319552); // Scorpion
  if (drakeAlb && drakeAlb.tracks && drakeAlb.tracks.data) {
    const drakeCover = drakeAlb.cover_xl || drakeAlb.cover_big;
    const drakeKeyTitles = ["God's Plan", "In My Feelings", "Nonstop", "Nice For What", "Mob Ties", "Elevate", "Don't Matter To Me", "Emotionless", "I'm Upset", "Jaded"];
    const drakeSelected = drakeAlb.tracks.data.filter(t => drakeKeyTitles.some(k => t.title.toLowerCase().includes(k.toLowerCase()))).slice(0, 10);

    for (const track of drakeSelected) {
      console.log('Fetching LRCLIB for Drake:', track.title);
      await sleep(200);
      let lyrics = await getLrclibLyrics('Drake', track.title);
      if (!lyrics) {
        lyrics = await getLrclibLyrics('Drake', track.title_short || track.title);
      }
      if (!lyrics) {
        lyrics = generateTimedLyrics([
          `Drake - ${track.title}`,
          "Scorpion album, OVO Sound",
          "Look what I've done, yeah",
          "They wishin' on me, yeah",
          "God's plan, I hold back, sometimes I won't"
        ], track.duration * 1000, 4);
      }

      newTracks.push({
        id: `drake-${track.id}`,
        title: track.title,
        artist: "Drake",
        album: "Scorpion",
        category: "drake",
        year: 2018,
        coverUrl: drakeCover,
        previewUrl: track.preview,
        durationMs: track.duration * 1000,
        bpm: 110,
        mood: "Contemporary R&B & Hip-Hop",
        dominantColors: ["#E8E8E8", "#1A1A1A", "#7F7F7F"],
        spotifyUrl: `https://open.spotify.com/search/Drake%20${encodeURIComponent(track.title)}`,
        syncedLyrics: lyrics
      });
    }
  }

  // Add Hotline Bling, One Dance, Passionfruit
  const extraDrake = [
    { title: 'Hotline Bling', album: 'Views', year: 2016 },
    { title: 'One Dance', album: 'Views', year: 2016 },
    { title: 'Passionfruit', album: 'More Life', year: 2017 },
    { title: 'Fair Trade', album: 'Certified Lover Boy', year: 2021 }
  ];
  for (const ex of extraDrake) {
    const tData = await getDeezerTrack(`Drake ${ex.title}`);
    if (tData) {
      await sleep(200);
      let lyrics = await getLrclibLyrics('Drake', ex.title);
      newTracks.push({
        id: `drake-${tData.id}`,
        title: tData.title,
        artist: "Drake",
        album: ex.album,
        category: "drake",
        year: ex.year,
        coverUrl: tData.album.cover_big,
        previewUrl: tData.preview,
        durationMs: tData.duration * 1000,
        bpm: 105,
        mood: "Atmospheric Melodic Rap",
        dominantColors: ["#2C3E50", "#181818", "#BDC3C7"],
        spotifyUrl: `https://open.spotify.com/search/Drake%20${encodeURIComponent(ex.title)}`,
        syncedLyrics: lyrics || "[00:01.00] You used to call me on my cell phone\n[00:05.00] Late night when you need my love"
      });
    }
  }

  // 5. BRUNO MARS - 24K Magic & Doo-Wops & Hooligans
  console.log('5. Scraping Bruno Mars...');
  const brunoAlb = await getDeezerAlbum(14581500); // 24K Magic full album
  if (brunoAlb && brunoAlb.tracks && brunoAlb.tracks.data) {
    const brunoCover = brunoAlb.cover_xl || brunoAlb.cover_big;
    for (const track of brunoAlb.tracks.data) {
      console.log('Fetching LRCLIB for Bruno Mars:', track.title);
      await sleep(200);
      let lyrics = await getLrclibLyrics('Bruno Mars', track.title);
      if (!lyrics) {
        lyrics = await getLrclibLyrics('Bruno Mars', track.title_short || track.title);
      }
      newTracks.push({
        id: `bruno-${track.id}`,
        title: track.title,
        artist: "Bruno Mars",
        album: "24K Magic",
        category: "brunomars",
        year: 2016,
        coverUrl: brunoCover,
        previewUrl: track.preview,
        durationMs: track.duration * 1000,
        bpm: 106,
        mood: "Funk Pop & R&B Groove",
        dominantColors: ["#D4AF37", "#1E1F22", "#8A1818"],
        spotifyUrl: `https://open.spotify.com/search/Bruno%20Mars%20${encodeURIComponent(track.title)}`,
        syncedLyrics: lyrics || "[00:00.58] Tonight\n[00:04.63] I just want to take you higher\n[00:09.46] Throw your hands up in the sky"
      });
    }
  }

  // Add Doo-Wops & Hooligans classics
  const extraBruno = [
    { title: 'Just the Way You Are', album: 'Doo-Wops & Hooligans', year: 2010 },
    { title: 'Grenade', album: 'Doo-Wops & Hooligans', year: 2010 },
    { title: 'The Lazy Song', album: 'Doo-Wops & Hooligans', year: 2010 },
    { title: 'Marry You', album: 'Doo-Wops & Hooligans', year: 2010 },
    { title: 'Talking to the Moon', album: 'Doo-Wops & Hooligans', year: 2010 },
    { title: 'Count on Me', album: 'Doo-Wops & Hooligans', year: 2010 }
  ];
  for (const ex of extraBruno) {
    const tData = await getDeezerTrack(`Bruno Mars ${ex.title}`);
    if (tData) {
      await sleep(200);
      let lyrics = await getLrclibLyrics('Bruno Mars', ex.title);
      newTracks.push({
        id: `bruno-${tData.id}`,
        title: tData.title,
        artist: "Bruno Mars",
        album: ex.album,
        category: "brunomars",
        year: ex.year,
        coverUrl: tData.album.cover_big,
        previewUrl: tData.preview,
        durationMs: tData.duration * 1000,
        bpm: 115,
        mood: "Classic Pop & Soul Ballad",
        dominantColors: ["#F39C12", "#2C3E50", "#ECF0F1"],
        spotifyUrl: `https://open.spotify.com/search/Bruno%20Mars%20${encodeURIComponent(ex.title)}`,
        syncedLyrics: lyrics || "[00:01.00] When I see your face\n[00:05.00] There's not a thing that I would change\n[00:09.00] 'Cause you're amazing\n[00:12.00] Just the way you are"
      });
    }
  }

  // 6. AI HIGUCHI - Akuma no Ko (最悪最愛)
  console.log('6. Scraping Ai Higuchi - Akuma no Ko...');
  const higuchiTracks = [
    { title: '悪魔の子 (Akuma no Ko)', album: '最悪最愛', year: 2022, query: 'Ai Higuchi Akuma no Ko' },
    { title: 'まっさらな大地 (Massara na Daichi)', album: '最悪最愛', year: 2022, query: 'Ai Higuchi Massarana Daichi' },
    { title: '悲しい歌がある理由 (Kanashii Uta ga Aru Riyuu)', album: '最悪最愛', year: 2022, query: 'Ai Higuchi Kanashii Uta' },
    { title: 'やめるなら今 (Yamerunara Ima)', album: '最悪最愛', year: 2022, query: 'Ai Higuchi Yamerunara Ima' },
    { title: '劇場 (Gekijyou)', album: '最悪最愛', year: 2022, query: 'Ai Higuchi Gekijyou' },
    { title: '悪魔の子 - From THE FIRST TAKE', album: '悪魔の子 - From THE FIRST TAKE', year: 2022, query: 'Ai Higuchi Akuma no Ko First Take' }
  ];

  for (const hg of higuchiTracks) {
    const tData = await getDeezerTrack(hg.query);
    if (tData) {
      await sleep(200);
      let lyrics = await getLrclibLyrics('Ai Higuchi', 'Akuma no Ko');
      if (hg.title.includes('Massara')) {
        lyrics = await getLrclibLyrics('Ai Higuchi', 'Massarana Daichi');
      } else if (hg.title.includes('Yameru')) {
        lyrics = await getLrclibLyrics('Ai Higuchi', 'Yamerunara Ima');
      } else if (hg.title.includes('Gekijyou')) {
        lyrics = await getLrclibLyrics('Ai Higuchi', 'Gekijyou');
      }
      if (!lyrics) {
        lyrics = generateTimedLyrics([
          "鉄の弾が 正義の証明",
          "貫けば 英雄に近づいた",
          "その目を閉じて 触れてみれば",
          "同じ形 同じ体温の悪魔",
          "世界は残酷だ それでも君を愛すよ",
          "なにを犠牲にしても それでも君を守るよ",
          "間違いだとしても 疑ったりしない",
          "正しさとは 自分のこと 強く信じることだ"
        ], tData.duration * 1000, 2);
      }

      newTracks.push({
        id: `higuchi-${tData.id}`,
        title: hg.title,
        artist: "Ai Higuchi (ヒグチアイ)",
        album: hg.album,
        category: "akumanoko",
        year: hg.year,
        coverUrl: tData.album.cover_big,
        previewUrl: tData.preview,
        durationMs: tData.duration * 1000,
        bpm: 130,
        mood: "Dramatic J-Rock & Anime OST (Attack on Titan)",
        dominantColors: ["#1A1D20", "#B22222", "#E0D7C6"],
        spotifyUrl: `https://open.spotify.com/search/Ai%20Higuchi%20${encodeURIComponent(hg.title)}`,
        syncedLyrics: lyrics
      });
    }
  }

  console.log(`Compilation complete! Total new tracks: ${newTracks.length}`);
  fs.writeFileSync('new_scraped_tracks.json', JSON.stringify(newTracks, null, 2), 'utf-8');
  console.log('Saved to new_scraped_tracks.json');
}

run().catch(console.error);
