const fs = require('fs');

const musicLibPath = 'src/data/music_library.json';
const backendLibPath = 'backend/music_library.json';

const currentLib = JSON.parse(fs.readFileSync(musicLibPath, 'utf8'));

// Vander updated tracks with local static audio & synced intro lyrics
const vanderTracksData = [
  {
    id: 'vander-kingmokondo',
    title: 'KING MOKONDO',
    artist: 'vander!',
    album: 'KING MOKONDO',
    category: 'vander',
    year: 2025,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/398631fbbcee960e798eb8e90909c46d/1000x1000-000000-80-0-0.jpg',
    previewUrl: '/audio/vander/king_mokondo.mp3',
    durationMs: 30000,
    bpm: 130,
    mood: 'Satirical Drill & Street Rap',
    dominantColors: ['#D73027', '#1E1F22', '#FDAE61'],
    spotifyUrl: 'https://open.spotify.com/search/vander%20KING%20MOKONDO',
    syncedLyrics: `[00:00.00] ♪ (Intro Beat - Vander! King Mokondo) ♪
[00:03.50] Yeah, gua financial freedom
[00:06.80] Bini gua kerja, gua di rumah diem
[00:10.20] Siang ke warung jadah, kalo malem gua dugem
[00:13.80] Gua mau ke altar, stang gua malah belok sarkem
[00:17.50] Modal kontol doang, tangan gua masuk kutang
[00:21.00] Cewe-cewe antre, minta gua temenin malam
[00:24.50] King Mokondo di sini, gak usah banyak gaya
[00:27.80] Duit lu habis buat cicilan, gua ketawa aja
[00:29.80] ♪ (Beat Drops) ♪`
  },
  {
    id: 'vander-bencanaalam',
    title: 'Bencana Alam',
    artist: 'vander!',
    album: 'Bencana Alam',
    category: 'vander',
    year: 2024,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/9a6470574875d804b28c0539640ae272/1000x1000-000000-80-0-0.jpg',
    previewUrl: '/audio/vander/bencana_alam.mp3',
    durationMs: 30000,
    bpm: 126,
    mood: 'Hardcore Satirical Hip-Hop',
    dominantColors: ['#B2182B', '#212121', '#F46D43'],
    spotifyUrl: 'https://open.spotify.com/search/vander%20Bencana%20Alam',
    syncedLyrics: `[00:00.00] ♪ (Intro Beat - Pantai Selatan Sound) ♪
[00:03.80] Duit keras macam batu malin kundang ku
[00:07.20] Celana sobek-sobek dia kira gua pemulung
[00:10.80] Pake sepatu kulit lebih tebel dari buku
[00:14.20] Ini lagu komedi, tapi hidup lu lebih lucu
[00:17.60] Gua berandalan, persetan peraturan
[00:21.00] Gua bawain ombak langsung dari pantai selatan
[00:24.50] Outfit gua kacau, panggil gua bencana alam
[00:28.00] Bencana alam datang, semua rata dengan tanah!`
  },
  {
    id: 'vander-balikanfeatchaeroel',
    title: 'Balikan (feat. Chaeroel)',
    artist: 'vander!',
    album: 'Balikan',
    category: 'vander',
    year: 2026,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/17a498e7435059f4a6cb61d02be74ecd/1000x1000-000000-80-0-0.jpg',
    previewUrl: '/audio/vander/balikan.mp3',
    durationMs: 30000,
    bpm: 122,
    mood: 'Melodic Street Rap',
    dominantColors: ['#C51B7D', '#271B24', '#E9A3C9'],
    spotifyUrl: 'https://open.spotify.com/search/vander%20Balikan',
    syncedLyrics: `[00:00.00] ♪ (Intro Melody - Vander x Chaeroel) ♪
[00:04.20] Sayang, ku nggak bisa bohong
[00:07.50] Aku belum bisa move on dari kamu
[00:10.80] Dari kamu, dari kamu...
[00:14.00] Banyak jablay yang deketin tapi gua cuma diemin
[00:17.50] Sumpah kalo yang lain abis pake trus tinggalin
[00:21.20] Cuma kamu, gak ada yang lain
[00:24.80] Share loc sekarang, gua samperin...
[00:28.00] ♪ (Balikan lagi sama kamu) ♪`
  },
  {
    id: 'vander-baleskeroyokfeatvander',
    title: 'Bales Keroyok (feat. Vander)',
    artist: 'vander!',
    album: 'Sdr Kematian',
    category: 'vander',
    year: 2026,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/837d6a9b236c8e3fd2c2582d401bf603/1000x1000-000000-80-0-0.jpg',
    previewUrl: '/audio/vander/bales_keroyok.mp3',
    durationMs: 30000,
    bpm: 132,
    mood: 'Underground Aggressive Rap',
    dominantColors: ['#8D2B1C', '#1E1F22', '#D9822B'],
    spotifyUrl: 'https://open.spotify.com/search/Riski%20Inrahim%20Bales%20Keroyok',
    syncedLyrics: `[00:00.00] ♪ (Intro Beat - Sdr Kematian Underground) ♪
[00:04.00] Sdr Kematian, Riski Inrahim feat Vander!
[00:07.20] Lo bawa pasukan, gua bales keroyok
[00:10.50] Jangan main belakang, mental lu pada loyo
[00:13.80] Sekali gua hajar, langsung bonyok bonyok
[00:17.20] Di jalanan keras, bukan buat bocah manja
[00:20.50] Vander masuk beat, suara makin membara
[00:24.00] Bales keroyok, bales keroyok!
[00:27.50] Jangan lari lu pada, bales keroyok!`
  },
  {
    id: 'vander-puterbalikfeatspsdausvanderyungusman',
    title: 'Puter Balik (feat. SPS Daus, Vander & Yung Usman)',
    artist: 'vander!',
    album: 'Sdr Kematian',
    category: 'vander',
    year: 2026,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/837d6a9b236c8e3fd2c2582d401bf603/1000x1000-000000-80-0-0.jpg',
    previewUrl: '/audio/vander/puter_balik.mp3',
    durationMs: 30000,
    bpm: 128,
    mood: 'Night Street Trap',
    dominantColors: ['#8D2B1C', '#1E1F22', '#E08214'],
    spotifyUrl: 'https://open.spotify.com/search/Riski%20Inrahim%20Puter%20Balik',
    syncedLyrics: `[00:00.00] ♪ (Intro Bassline - Sdr Kematian) ♪
[00:03.50] Puter Balik! SPS Daus, Vander, Yung Usman, Riski Inrahim
[00:07.50] Jalan buntu di depan, mending lu puter balik
[00:11.00] Jangan sok jagoan, nanti kepala lu panik
[00:14.50] Gas pol rem blong, aspal makin licin
[00:18.00] Anak liar nongkrong, gak kenal kata dingin
[00:21.50] Vander turun tangan, ritme makin kenceng
[00:25.00] Jangan macam-macam sebelum lu gepeng
[00:28.20] Puter balik woi, puter balik!`
  },
  {
    id: 'vander-kampungan',
    title: 'Kampungan',
    artist: 'vander!',
    album: 'Kampungan',
    category: 'vander',
    year: 2026,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/e8cba9727b60b9d399736ad365463355/1000x1000-000000-80-0-0.jpg',
    previewUrl: '/audio/vander/kampungan.mp3',
    durationMs: 30000,
    bpm: 125,
    mood: 'Satirical Boom Bap',
    dominantColors: ['#4393C3', '#1A242F', '#92C5DE'],
    spotifyUrl: 'https://open.spotify.com/search/vander%20Kampungan',
    syncedLyrics: `[00:00.00] ♪ (Intro Beat - Vander! Kampungan) ♪
[00:03.80] Vander! Gaya kampung tapi rezeki kota
[00:07.50] Gak perlu gengsi asal dapur ngebul nyata
[00:11.20] Kalian yang sok elit banyak hutang sana sini
[00:15.00] Gua yang kampungan hidup tenang tiap hari
[00:18.80] Nongkrong di pos ronda kopi item sebat dua
[00:22.50] Kampungan bukan berarti murahan!
[00:26.20] Asli dari akar rumput, bikin kita juara
[00:29.00] ♪ (Outro Kampungan) ♪`
  },
  {
    id: 'vander-agaklaen',
    title: 'Agak Laen',
    artist: 'vander!',
    album: 'Agak Laen',
    category: 'vander',
    year: 2025,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/322f703d84e7b582356abb8f0ff846ef/1000x1000-000000-80-0-0.jpg',
    previewUrl: '/audio/vander/agak_laen.mp3',
    durationMs: 30000,
    bpm: 130,
    mood: 'Comedic Street Rap',
    dominantColors: ['#FDBF6F', '#2B1A09', '#FF7F00'],
    spotifyUrl: 'https://open.spotify.com/search/vander%20Agak%20Laen',
    syncedLyrics: `[00:00.00] ♪ (Intro Beat - Vander! Agak Laen) ♪
[00:03.50] Emang agak laen lu punya tingkah laku
[00:07.00] Ditanya kemana, jawabnya gak menentu
[00:10.50] Orang jalan lurus lu malah belok kiri
[00:14.00] Ngakunya bos besar dompet lu gak berisi
[00:17.50] Agak laen, agak laen lu emang unik
[00:21.00] Jangan kaget kalo liat kami makin asik
[00:25.00] Vander datang bawa gaya agak laen!
[00:28.50] ♪ (Outro Beat) ♪`
  },
  {
    id: 'vander-pantaiselatan',
    title: 'pantai selatan',
    artist: 'vander!',
    album: 'pantai selatan',
    category: 'vander',
    year: 2025,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/587711512516b057c095f0f3c79db147/1000x1000-000000-80-0-0.jpg',
    previewUrl: '/audio/vander/pantai_selatan.mp3',
    durationMs: 30000,
    bpm: 120,
    mood: 'Atmospheric Mystical Rap',
    dominantColors: ['#2166AC', '#0C1C2E', '#67A9CF'],
    spotifyUrl: 'https://open.spotify.com/search/vander%20pantai%20selatan',
    syncedLyrics: `[00:00.00] ♪ (Intro Ombak & Beat - Vander) ♪
[00:04.00] Angin kencang menerpa ombak samudra
[00:07.80] Nyi Roro Kidul jadi saksi legenda kita
[00:11.50] Misteri malam berselimut pasir putih
[00:15.20] Lagu ini mengalir hilangkan rasa sedih
[00:19.00] Berdiri di tebing menatap luasnya lautan
[00:22.80] Suara ombak memanggil dari pantai selatan
[00:26.50] Vander abadikan semua dalam nada tembang
[00:29.50] ♪ (Outro Pantai Selatan) ♪`
  },
  {
    id: 'vander-batuponari',
    title: 'batu ponari',
    artist: 'vander!',
    album: 'batu ponari',
    category: 'vander',
    year: 2025,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/898e6441c9272268ed82ec9603736310/1000x1000-000000-80-0-0.jpg',
    previewUrl: '/audio/vander/batu_ponari.mp3',
    durationMs: 30000,
    bpm: 128,
    mood: 'Nostalgic Satirical Trap',
    dominantColors: ['#762A83', '#1F0B24', '#AF8DC3'],
    spotifyUrl: 'https://open.spotify.com/search/vander%20batu%20ponari',
    syncedLyrics: `[00:00.00] ♪ (Intro Gamelan Beat - Vander!) ♪
[00:03.80] Batu Ponari, celup ke air langsung sakti
[00:07.50] Mitos atau fakta bikin orang antre pagi
[00:11.20] Zaman dulu viral sekarang jadi memori
[00:15.00] Vander bawa nostalgia batu ponari
[00:18.80] Mau kaya mau sembuh semua minta tuah
[00:22.50] Lucu tapi nyata bikin tertawa sumringah
[00:26.20] Batu ponari, legenda abadi Indonesia
[00:29.20] ♪ (Outro Batu Ponari) ♪`
  },
  {
    id: 'vander-gayagua',
    title: 'gaya gua',
    artist: 'vander!',
    album: 'gaya gua',
    category: 'vander',
    year: 2025,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/020e5ffd2b1a54e765dff1527db2317d/1000x1000-000000-80-0-0.jpg',
    previewUrl: '/audio/vander/gaya_gua.mp3',
    durationMs: 30000,
    bpm: 134,
    mood: 'Fast Flow Underground Drill',
    dominantColors: ['#1B7837', '#0A2411', '#7FBF7B'],
    spotifyUrl: 'https://open.spotify.com/search/vander%20gaya%20gua',
    syncedLyrics: `[00:00.00] ♪ (Intro Drill Beat - Vander!) ♪
[00:03.50] Ini gaya gua, terserah lu mau bilang apa
[00:07.00] Gak peduli tren musiman yang gampang sirna
[00:10.50] Asli dari jalanan, autentik dan berani
[00:14.00] Pakaian apa adanya tapi swag gua murni
[00:17.50] Jangan atur hidup orang kalo hidup lu kacau
[00:21.00] Gaya gua bebas, bikin haters lu meracau
[00:24.80] Vander tetap vander sampai akhir zaman!
[00:28.00] ♪ (Outro Gaya Gua) ♪`
  }
];

// Riski Inrahim local audio map
const riskiFilesMap = {
  'Malay': '/audio/riski/malay.mp3',
  'Kebakaran': '/audio/riski/kebakaran.mp3',
  'Akhir Dunia': '/audio/riski/akhir_dunia.mp3',
  'Bales Keroyok': '/audio/riski/bales_keroyok.mp3',
  'Dinamo Setan': '/audio/riski/dinamo_setan.mp3',
  'DI Block Bapak': '/audio/riski/di_block_bapak.mp3',
  'Wayang Alif vs Syachrizal': '/audio/riski/wayang_alif_vs_syachrizal.mp3',
  'Gasing': '/audio/riski/gasing.mp3',
  'Marapthon': '/audio/riski/marapthon.mp3',
  'Paling Panjang': '/audio/riski/paling_panjang.mp3',
  'Semua Perek Mati': '/audio/riski/semua_perek_mati.mp3',
  'Puter Balik': '/audio/riski/puter_balik.mp3',
  'Tanya Gua': '/audio/riski/tanya_gua.mp3'
};

// Filter out old Vander tracks and replace with new ones
const vanderTrackIds = new Set(vanderTracksData.map(t => t.id));
let updatedLib = currentLib.filter(t => !vanderTrackIds.has(t.id) && t.category !== 'vander' && !t.id.startsWith('vander-'));

// Append updated Vander tracks
updatedLib.push(...vanderTracksData);

// Update Riski Inrahim tracks to use local audio and clean intro lyrics
updatedLib = updatedLib.map(t => {
  if (t.category === 'riskiinrahim') {
    const cleanTitle = t.title.split(' (')[0].trim();
    const localAudio = riskiFilesMap[cleanTitle] || riskiFilesMap[t.title];
    if (localAudio) {
      t.previewUrl = localAudio;
      t.durationMs = 30000;
    }
    if (!t.syncedLyrics.includes('[00:00.00]')) {
      t.syncedLyrics = `[00:00.00] ♪ (Intro Beat - Sdr Kematian) ♪\n` + t.syncedLyrics;
    }
  }
  return t;
});

fs.writeFileSync(musicLibPath, JSON.stringify(updatedLib, null, 2), 'utf8');
fs.writeFileSync(backendLibPath, JSON.stringify(updatedLib, null, 2), 'utf8');

console.log('Successfully updated library with local Vander & Riski tracks!');
console.log('Total library count:', updatedLib.length);
