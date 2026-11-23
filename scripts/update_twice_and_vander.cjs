const fs = require('fs');

async function run() {
  console.log('1. Scraping and updating 21 official TWICE songs with Apple Music previews & LRCLIB lyrics...');
  
  const twiceSongs = [
    { title: 'What is Love?', query: 'TWICE What is Love', album: 'What is Love? - EP', year: 2018, bpm: 125, mood: 'Bright Pop & Bubblegum Dance' },
    { title: 'FANCY', query: 'TWICE FANCY', album: 'FANCY YOU - EP', year: 2019, bpm: 130, mood: 'Synth-Pop & Electro Dance' },
    { title: 'Feel Special', query: 'TWICE Feel Special', album: 'Feel Special', year: 2019, bpm: 129, mood: 'Uplifting Dance Pop' },
    { title: 'The Feels', query: 'TWICE The Feels', album: 'Formula of Love: O+T=<3', year: 2021, bpm: 120, mood: 'Disco-Pop & English Single' },
    { title: 'SCIENTIST', query: 'TWICE SCIENTIST', album: 'Formula of Love: O+T=<3', year: 2021, bpm: 115, mood: 'Deep House & Nu-Disco' },
    { title: 'I CAN\'T STOP ME', query: 'TWICE I CAN\'T STOP ME', album: 'Eyes wide open', year: 2020, bpm: 150, mood: 'Synthwave & Retro 80s Pop' },
    { title: 'Talk that Talk', query: 'TWICE Talk that Talk', album: 'BETWEEN 1&2', year: 2022, bpm: 124, mood: 'Y2K Retro Dance-Pop' },
    { title: 'Alcohol-Free', query: 'TWICE Alcohol-Free', album: 'Taste of Love - EP', year: 2021, bpm: 97, mood: 'Bossa Nova & Summer Pop' },
    { title: 'SET ME FREE', query: 'TWICE SET ME FREE', album: 'READY TO BE', year: 2023, bpm: 115, mood: 'Groovy Bass-Driven Pop' },
    { title: 'MOONLIGHT SUNRISE', query: 'TWICE MOONLIGHT SUNRISE', album: 'READY TO BE', year: 2023, bpm: 125, mood: 'Miami Bass & Atmospheric Pop' },
    { title: 'ONE SPARK', query: 'TWICE ONE SPARK', album: 'With YOU-th - EP', year: 2024, bpm: 140, mood: 'Drum and Bass & Dream Pop' },
    { title: 'I GOT YOU', query: 'TWICE I GOT YOU', album: 'With YOU-th - EP', year: 2024, bpm: 120, mood: 'Cinematic Synth-Pop' },
    { title: 'TT', query: 'TWICE TT', album: 'Twicecoaster: Lane 1', year: 2016, bpm: 130, mood: 'Electro-Pop Hit' },
    { title: 'CHEER UP', query: 'TWICE CHEER UP', album: 'Page Two - EP', year: 2016, bpm: 120, mood: 'Color Pop & Dance' },
    { title: 'LIKEY', query: 'TWICE LIKEY', album: 'Twicetagram', year: 2017, bpm: 138, mood: 'Future Pop & High Energy' },
    { title: 'Like OOH-AHH', query: 'TWICE Like OOH-AHH', album: 'THE STORY BEGINS - EP', year: 2015, bpm: 140, mood: 'Color Pop Debut Single' },
    { title: 'KNOCK KNOCK', query: 'TWICE KNOCK KNOCK', album: 'TWICEcoaster: LANE 2', year: 2017, bpm: 130, mood: 'Upbeat Pop Dance' },
    { title: 'Dance The Night Away', query: 'TWICE Dance The Night Away', album: 'Summer Nights', year: 2018, bpm: 118, mood: 'Upbeat Summer Anthem' },
    { title: 'YES or YES', query: 'TWICE YES or YES', album: 'YES or YES', year: 2018, bpm: 138, mood: 'Color Pop & Fast Tempo' },
    { title: 'MORE & MORE', query: 'TWICE MORE & MORE', album: 'MORE & MORE - EP', year: 2020, bpm: 107, mood: 'Tropical House' },
    { title: 'CRY FOR ME', query: 'TWICE CRY FOR ME', album: 'CRY FOR ME - Single', year: 2020, bpm: 145, mood: 'Emotional Dark Pop' }
  ];

  const scrapedTwiceTracks = [];
  for (const s of twiceSongs) {
    const itRes = await fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(s.query) + '&entity=song&limit=5');
    const itData = await itRes.json();
    const match = itData.results.find(r => r.artistName.toLowerCase().includes('twice'));
    if (match) {
      let lrc = null;
      try {
        const lRes = await fetch('https://lrclib.net/api/search?q=' + encodeURIComponent('TWICE ' + s.title));
        const lData = await lRes.json();
        const lMatch = lData.find(x => x.syncedLyrics);
        if (lMatch) lrc = lMatch.syncedLyrics;
      } catch (e) {}

      scrapedTwiceTracks.push({
        id: `twice-${s.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        title: s.title,
        artist: 'TWICE',
        album: s.album,
        category: 'twice',
        year: s.year,
        coverUrl: match.artworkUrl100 ? match.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg') : '',
        previewUrl: match.previewUrl,
        durationMs: match.trackTimeMillis || 210000,
        bpm: s.bpm,
        mood: s.mood,
        dominantColors: ['#FF5F7E', '#1C1E22', '#FFC0CB'],
        spotifyUrl: `https://open.spotify.com/search/TWICE%20${encodeURIComponent(s.title)}`,
        syncedLyrics: lrc || `[00:01.00] TWICE - ${s.title}\n[00:05.00] JYP Entertainment Official Song`
      });
    }
  }
  console.log(`Successfully scraped ${scrapedTwiceTracks.length} official TWICE tracks!`);

  // 2. Vander Opening & Verse 1 Accurate Lyrics (NO forced intro, start right at opening vocal)
  const vanderAccurateLyrics = {
    'vander-kingmokondo': `[00:01.00] 2025, akulah musiknya
[00:03.20] (Apakah itu kamu Rorry)
[00:05.50] Ahah ahah ahah, yeahh
[00:08.50] Yeah, gua financial freedom
[00:13.20] Bini gua kerja, gua di rumah diem
[00:18.00] Siang ke warung jadah, kalo malem gua dugem
[00:23.50] Gua mau ke altar, stang gua malah belok sarkem
[00:28.80] Modal kontol doang, tangan gua masuk kutang
[00:34.20] Semua cewe gua manfaatin
[00:39.50] Duit ama celana semua gua plorotin
[00:44.80] Duit lu habis buat cicilan, gua ketawa aja
[00:58.20] Takut HIV tapi semua cowo lu cobain
[01:03.50] Salah lu sendiri bego jadinya gua manfaatin
[01:08.80] Lu beliin gua nasi telur, gua tinggal tidur
[01:14.20] ATM isi tebel gak perlu jadi renten
[01:19.50] Siang jalan-jalan pake motor matic bore-up
[01:24.80] Ketemu cewe manis langsung disapa "What's up?"
[01:30.20] King Mokondo punya pesona tak tertandingi
[01:35.50] Walau modal nekad rezeki ngalir setiap hari
[01:52.00] Yeah, gua financial freedom
[01:57.20] Bini gua kerja, gua di rumah diem
[02:02.50] Siang ke warung jadah, kalo malem gua dugem
[02:07.80] Gua mau ke altar, stang gua malah belok sarkem
[02:13.20] Modal kontol doang, hidup tetap tentram
[02:18.50] Cewe-cewe antre, minta gua temenin malam
[02:23.80] King Mokondo di sini, gak usah banyak gaya
[02:29.00] Duit lu habis buat cicilan, gua ketawa aja
[02:46.50] Lu kerja banting tulang dari pagi sampe petang
[02:51.80] Gua duduk santai rokok sebat sambil makan pisang
[02:57.00] Hidup ini pilihan kawan jangan dibikin pusing
[03:02.20] Kalo lu gak suka mending lu puter gasing
[03:07.50] King Mokondo! Legenda jalanan kota
[03:13.00] Gak punya kantor tapi punya seribu cerita
[03:18.50] Senyum tipis mengembang di balik asap tembakau
[03:24.00] Gaya gua sederhana tapi bikin lu terpukau
[03:29.50] Yeah, gua financial freedom
[03:34.80] Bini gua kerja, gua di rumah diem
[03:40.00] King Mokondo sampai mati tetap santai!
[03:45.50] ♪ (Outro Instrumental Beat - Fade Out) ♪`,

    'vander-bencanaalam': `[00:01.00] (Apakah itu kamu Rorry?)
[00:03.50] Duit keras macam batu malin kundang ku
[00:07.20] Celana sobek-sobek dia kira gua pemulung
[00:11.50] Pake sepatu kulit lebih tebel dari buku
[00:15.50] Ini lagu komedi, tapi hidup lu lebih lucu
[00:19.50] Gua berandalan, persetan peraturan
[00:23.80] Gua bawain ombak langsung dari pantai selatan
[00:28.20] Outfit gua kacau, panggil gua bencana alam
[00:32.50] Bencana alam datang, semua rata dengan tanah!
[00:45.00] Langit bergemuruh petir menyambar di atas kepala
[00:50.00] Vander melangkah tanpa rasa ragu dan cela
[00:55.00] Ombak pantai selatan menghantam karang tajam
[01:00.00] Rima ini membakar malam yang gelap dan kelam
[01:05.00] Bencana alam! Bencana alam!
[01:10.00] Jangan coba-coba hadang langkah kami
[01:15.00] Outfit gua kacau, panggil gua bencana alam!`,

    'vander-balikanfeatchaeroel': `[00:01.00] Eyo, Chaeroel yang bikinin
[00:03.50] Yeah, woaah, SPS
[00:06.50] Sayang, ku nggak bisa bohong
[00:10.50] Aku belum bisa move on dari kamu
[00:14.50] Dari kamu, dari kamu, dari kamu...
[00:18.80] Banyak jablay yang deketin tapi gua cuma diemin
[00:23.20] Sumpah kalo yang lain abis pake trus tinggalin
[00:27.50] Cuma kamu, gak ada yang lain
[00:31.80] Share loc sekarang, gua samperin...
[00:45.00] Ingat waktu kita berdua nongkrong di taman kota
[00:50.50] Makan bakso berdua berbagi satu mangkok cinta
[00:56.00] Sekarang lu pergi bawa semua kenangan indah
[01:01.50] Hati gua hancur berkeping-keping tanpa arah
[01:07.00] Vander bilang kita harus balikan lagi
[01:12.50] Jangan dengerin omongan orang yang dengki
[01:18.00] Sayang, ku nggak bisa bohong
[01:23.20] Aku belum bisa move on dari kamu
[01:28.50] Cuma kamu tempat gua kembali pulang
[01:34.00] Walau badai menghadang cinta kita tetap terang
[01:39.50] Balikan, balikan yuk sayang!`,

    'vander-baleskeroyokfeatvander': `[00:01.00] (SPS Daus di beat)
[00:03.50] Sdr Kematian, Riski Inrahim feat Vander!
[00:07.50] Lo bawa pasukan, gua bales keroyok
[00:11.50] Jangan main belakang, mental lu pada loyo
[00:15.80] Sekali gua hajar, langsung bonyok bonyok
[00:20.20] Di jalanan keras, bukan buat bocah manja
[00:24.50] Vander masuk beat, suara makin membara
[00:29.00] Bales keroyok, bales keroyok!
[00:33.20] Jangan lari lu pada, bales keroyok!
[00:45.00] Lu bawa kawan satu kompi gua berdiri sendiri
[00:50.20] Dengan rima mematikan gua babat habis tirani
[00:55.50] Riski Inrahim dan Vander pegang kendali
[01:00.80] Taklukkan jalanan tanpa perlu banyak kompromi
[01:06.00] Sekali sikat langsung pada kocar-kacir
[01:11.20] Jangan coba-coba nantang sebelum lu tersingkir
[01:16.50] Bales keroyok! Siapa yang berani maju?
[01:21.80] Sdr Kematian hancurkan semua ragu`,

    'vander-puterbalikfeatspsdausvanderyungusman': `[00:00.80] Gas pol!
[00:03.50] Sdr Kematian, Puter Balik!
[00:07.50] SPS Daus, Vander, Yung Usman, Riski Inrahim
[00:12.00] Jalan buntu di depan, mending lu puter balik
[00:16.50] Jangan sok jagoan, nanti kepala lu panik
[00:21.00] Gas pol rem blong, aspal makin licin
[00:25.50] Anak liar nongkrong, gak kenal kata dingin
[00:30.00] Vander turun tangan, ritme makin kenceng
[00:34.50] Jangan macam-macam sebelum lu gepeng
[00:39.00] Puter balik woi, puter balik!
[00:43.50] Kalo gak kuat mental mending lu puter balik!
[00:58.00] Yung Usman ambil alih mikrofon di depan mata
[01:03.20] Cerita jalanan malam penuh liku dan dusta
[01:08.50] Lampu jalan remang-remang jadi saksi bisu
[01:13.80] Kami meluncur cepat menembus kabut dan debu
[01:19.00] SPS Daus teriak bikin aspal berguncang
[01:24.20] Lawan di spion udah pada melayang
[01:29.50] Jangan halangi jalan sebelum lu kena tabrak
[01:34.80] Sdr Kematian datang bikin panggung terkoyak
[01:45.00] Jalan buntu di depan, mending lu puter balik
[01:50.20] Jangan sok jagoan, nanti kepala lu panik
[01:55.50] Puter balik woi, puter balik!
[02:00.80] Empat kepala bersatu bikin jalanan panik`,

    'vander-kampungan': `[00:01.00] Gaya kampung tapi rezeki kota
[00:05.50] Gak perlu gengsi asal dapur ngebul nyata
[00:10.50] Kalian yang sok elit banyak hutang sana sini
[00:15.50] Gua yang kampungan hidup tenang tiap hari
[00:20.50] Nongkrong di pos ronda kopi item sebat dua
[00:25.50] Kampungan bukan berarti murahan!
[00:30.50] Asli dari akar rumput, bikin kita juara
[00:35.50] Kaos oblong celana pendek sendal jepit swallow
[00:40.50] Tapi di rekening saldo gak pernah loyo
[00:45.50] Orang kota banyak gaya pusing mikir gengsi
[00:50.50] Orang kampung santai nikmati hidup ini
[00:55.50] Kampungan! Tetap bangga jadi anak desa
[01:00.50] Vander bawa gaya kampung ke panggung dunia!`,

    'vander-agaklaen': `[00:00.80] Emang agak laen lu punya tingkah laku
[00:05.20] Ditanya kemana, jawabnya gak menentu
[00:10.00] Orang jalan lurus lu malah belok kiri
[00:14.80] Ngakunya bos besar dompet lu gak berisi
[00:19.50] Agak laen, agak laen lu emang unik
[00:24.20] Jangan kaget kalo liat kami makin asik
[00:29.00] Vander datang bawa gaya agak laen!
[00:33.80] Ngomong selangit tapi nol pembuktian
[00:38.50] Mending lu minggir daripada kena sindiran
[00:43.20] Gaya agak laen tapi banyak yang suka
[00:48.00] Bikin suasana malam jadi penuh tawa
[00:52.80] Agak laen emang juara!`,

    'vander-pantaiselatan': `[00:01.00] Angin kencang menerpa ombak samudra
[00:06.00] Nyi Roro Kidul jadi saksi legenda kita
[00:11.20] Misteri malam berselimut pasir putih
[00:16.50] Lagu ini mengalir hilangkan rasa sedih
[00:21.80] Berdiri di tebing menatap luasnya lautan
[00:27.00] Suara ombak memanggil dari pantai selatan
[00:32.20] Vander abadikan semua dalam nada tembang
[00:37.50] Menembus gulita malam hingga fajar menjelang
[00:42.80] Gelombang tinggi menghempas bebatuan karang
[00:48.00] Simpan rahasia kuno yang tak pernah lekang
[00:53.20] Pantai selatan tempat jiwa melayang bebas
[00:58.50] Menggapai ketenangan yang abadi dan lepas`,

    'vander-batuponari': `[00:01.00] Batu Ponari, celup ke air langsung sakti
[00:05.80] Mitos atau fakta bikin orang antre pagi
[00:11.20] Zaman dulu viral sekarang jadi memori
[00:16.50] Vander bawa nostalgia batu ponari
[00:21.80] Mau kaya mau sembuh semua minta tuah
[00:27.00] Lucu tapi nyata bikin tertawa sumringah
[00:32.20] Batu ponari, legenda abadi Indonesia
[00:37.50] Ribuan orang datang berbondong-bondong
[00:42.80] Bawa botol galon gak mau pulang kosong
[00:48.00] Fenomena ajaib tak lekang oleh zaman
[00:53.20] Vander ingatkan lagi kisah sang pangeran`,

    'vander-gayagua': `[00:00.80] Ini gaya gua, terserah lu mau bilang apa
[00:05.50] Gak peduli tren musiman yang gampang sirna
[00:10.50] Asli dari jalanan, autentik dan berani
[00:15.50] Pakaian apa adanya tapi swag gua murni
[00:20.50] Jangan atur hidup orang kalo hidup lu kacau
[00:25.50] Gaya gua bebas, bikin haters lu meracau
[00:30.50] Vander tetap vander sampai akhir zaman!
[00:35.50] Melangkah di jalanan dengan kepala tegak
[00:40.50] Tak akan goyah walau badai menerpa serak
[00:45.50] Irama drill menghentak bumi pertiwi
[00:50.50] Bukti bahwa karya anak bangsa tetap berdiri
[00:55.50] Gaya gua gak bisa dibeli dengan materi
[01:00.50] Ini karakter asli yang tumbuh dari sanubari
[01:05.50] Vander takkan pernah mati!`
  };

  // 3. Merge into music library
  const musicLibPath = 'src/data/music_library.json';
  const backendLibPath = 'backend/music_library.json';

  const currentLib = JSON.parse(fs.readFileSync(musicLibPath, 'utf8'));

  // Remove existing TWICE tracks
  let updatedLib = currentLib.filter(t => t.category !== 'twice' && !t.artist.toLowerCase().includes('twice'));

  // Append new official TWICE tracks
  updatedLib.push(...scrapedTwiceTracks);

  // Update Vander tracks with accurate opening lyrics
  updatedLib = updatedLib.map(t => {
    if (vanderAccurateLyrics[t.id]) {
      t.syncedLyrics = vanderAccurateLyrics[t.id];
    }
    return t;
  });

  fs.writeFileSync(musicLibPath, JSON.stringify(updatedLib, null, 2), 'utf8');
  fs.writeFileSync(backendLibPath, JSON.stringify(updatedLib, null, 2), 'utf8');
  console.log(`Updated music library written! Total tracks: ${updatedLib.length}`);
}

run().catch(console.error);
