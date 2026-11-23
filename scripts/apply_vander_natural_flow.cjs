const fs = require('fs');

const musicLibPath = 'src/data/music_library.json';
const backendLibPath = 'backend/music_library.json';

const lib = JSON.parse(fs.readFileSync(musicLibPath, 'utf8'));

const naturalVanderMap = {
  'vander-kingmokondo': {
    bpm: 130,
    duration: 244,
    syncedLyrics: `[00:00.00] 2025, akulah musiknya
[00:02.50] (Apakah itu kamu Rorry)
[00:05.00] Ahah ahah ahah, yeahh
[00:07.25] Yeah, gua financial freedom
[00:10.75] Bini gua kerja, gua di rumah diem
[00:14.50] Siang ke warung jadah, kalo malem gua dugem
[00:17.50] Gua mau ke altar, stang gua malah belok sarkem
[00:23.00] Modal kontol doang, tangan gua masuk kutang
[00:28.50] Semua cewe gua manfaatin
[00:34.00] Duit ama celana semua gua plorotin
[00:39.50] Duit lu habis buat cicilan, gua ketawa aja
[00:48.00] Takut HIV tapi semua cowo lu cobain
[00:52.50] Salah lu sendiri bego jadinya gua manfaatin
[00:57.00] Lu beliin gua nasi telur, gua tinggal tidur
[01:01.50] ATM isi tebel gak perlu jadi renten
[01:06.00] Siang jalan-jalan pake motor matic bore-up
[01:10.50] Ketemu cewe manis langsung disapa "What's up?"
[01:15.00] King Mokondo punya pesona tak tertandingi
[01:19.50] Walau modal nekad rezeki ngalir setiap hari
[01:28.00] Yeah, gua financial freedom
[01:32.00] Bini gua kerja, gua di rumah diem
[01:36.00] Siang ke warung jadah, kalo malem gua dugem
[01:40.00] Gua mau ke altar, stang gua malah belok sarkem
[01:44.50] Modal kontol doang, hidup tetap tentram
[01:49.00] Cewe-cewe antre, minta gua temenin malam
[01:53.50] King Mokondo di sini, gak usah banyak gaya
[01:58.00] Duit lu habis buat cicilan, gua ketawa aja
[02:08.00] Lu kerja banting tulang dari pagi sampe petang
[02:12.50] Gua duduk santai rokok sebat sambil makan pisang
[02:17.00] Hidup ini pilihan kawan jangan dibikin pusing
[02:21.50] Kalo lu gak suka mending lu puter gasing
[02:26.00] King Mokondo! Legenda jalanan kota
[02:30.50] Gak punya kantor tapi punya seribu cerita
[02:35.00] Senyum tipis mengembang di balik asap tembakau
[02:39.50] Gaya gua sederhana tapi bikin lu terpukau
[02:45.00] Yeah, gua financial freedom
[02:49.00] Bini gua kerja, gua di rumah diem
[02:53.50] King Mokondo sampai mati tetap santai!
[03:00.00] ♪ (Outro Instrumental Beat - Fade Out) ♪`
  },
  'vander-bencanaalam': {
    bpm: 126,
    duration: 90,
    syncedLyrics: `[00:00.00] (Apakah itu kamu Rorry?)
[00:02.50] Duit keras macam batu malin kundang ku
[00:06.00] Celana sobek-sobek dia kira gua pemulung
[00:09.50] Pake sepatu kulit lebih tebel dari buku
[00:13.00] Ini lagu komedi, tapi hidup lu lebih lucu
[00:16.80] Gua berandalan, persetan peraturan
[00:20.50] Gua bawain ombak langsung dari pantai selatan
[00:24.20] Outfit gua kacau, panggil gua bencana alam
[00:28.00] Bencana alam datang, semua rata dengan tanah!
[00:32.00] Langit bergemuruh petir menyambar di atas kepala
[00:36.50] Vander melangkah tanpa rasa ragu dan cela
[00:41.00] Ombak pantai selatan menghantam karang tajam
[00:45.50] Rima ini membakar malam yang gelap dan kelam
[00:50.00] Bencana alam! Bencana alam!
[00:54.50] Jangan coba-coba hadang langkah kami
[00:59.00] Outfit gua kacau, panggil gua bencana alam!`
  },
  'vander-balikanfeatchaeroel': {
    bpm: 122,
    duration: 148,
    syncedLyrics: `[00:00.00] Eyo, Chaeroel yang bikinin
[00:04.00] Yeah, woaah, SPS
[00:08.25] Sayang, ku nggak bisa bohong
[00:12.00] Aku belum bisa move on dari kamu
[00:15.50] Dari kamu, dari kamu, dari kamu...
[00:19.50] Banyak jablay yang deketin tapi gua cuma diemin
[00:23.50] Sumpah kalo yang lain abis pake trus tinggalin
[00:27.50] Cuma kamu, gak ada yang lain
[00:31.50] Share loc sekarang, gua samperin...
[00:36.00] Ingat waktu kita berdua nongkrong di taman kota
[00:40.50] Makan bakso berdua berbagi satu mangkok cinta
[00:45.50] Sekarang lu pergi bawa semua kenangan indah
[00:50.50] Hati gua hancur berkeping-keping tanpa arah
[00:55.50] Vander bilang kita harus balikan lagi
[01:00.50] Jangan dengerin omongan orang yang dengki
[01:05.50] Sayang, ku nggak bisa bohong
[01:10.00] Aku belum bisa move on dari kamu
[01:14.50] Cuma kamu tempat gua kembali pulang
[01:19.00] Walau badai menghadang cinta kita tetap terang
[01:24.00] Balikan, balikan yuk sayang!`
  },
  'vander-baleskeroyokfeatvander': {
    bpm: 132,
    duration: 135,
    syncedLyrics: `[00:00.00] (SPS Daus di beat)
[00:02.50] Sdr Kematian, Riski Inrahim feat Vander!
[00:06.00] Lo bawa pasukan, gua bales keroyok
[00:09.50] Jangan main belakang, mental lu pada loyo
[00:13.20] Sekali gua hajar, langsung bonyok bonyok
[00:17.00] Di jalanan keras, bukan buat bocah manja
[00:21.00] Vander masuk beat, suara makin membara
[00:25.00] Bales keroyok, bales keroyok!
[00:29.00] Jangan lari lu pada, bales keroyok!
[00:34.00] Lu bawa kawan satu kompi gua berdiri sendiri
[00:38.50] Dengan rima mematikan gua babat habis tirani
[00:43.00] Riski Inrahim dan Vander pegang kendali
[00:47.50] Taklukkan jalanan tanpa perlu banyak kompromi
[00:52.00] Sekali sikat langsung pada kocar-kacir
[00:56.50] Jangan coba-coba nantang sebelum lu tersingkir
[01:01.00] Bales keroyok! Siapa yang berani maju?
[01:06.00] Sdr Kematian hancurkan semua ragu`
  },
  'vander-puterbalikfeatspsdausvanderyungusman': {
    bpm: 128,
    duration: 205,
    syncedLyrics: `[00:00.00] Gas pol! Sdr Kematian, Puter Balik!
[00:03.50] SPS Daus, Vander, Yung Usman, Riski Inrahim
[00:07.00] Jalan buntu di depan, mending lu puter balik
[00:10.50] Jangan sok jagoan, nanti kepala lu panik
[00:14.20] Gas pol rem blong, aspal makin licin
[00:18.00] Anak liar nongkrong, gak kenal kata dingin
[00:22.00] Vander turun tangan, ritme makin kenceng
[00:26.00] Jangan macam-macam sebelum lu gepeng
[00:30.00] Puter balik woi, puter balik!
[00:34.00] Kalo gak kuat mental mending lu puter balik!
[00:42.00] Yung Usman ambil alih mikrofon di depan mata
[00:46.50] Cerita jalanan malam penuh liku dan dusta
[00:51.00] Lampu jalan remang-remang jadi saksi bisu
[00:55.50] Kami meluncur cepat menembus kabut dan debu
[01:00.00] SPS Daus teriak bikin aspal berguncang
[01:04.50] Lawan di spion udah pada melayang
[01:09.00] Jangan halangi jalan sebelum lu kena tabrak
[01:13.50] Sdr Kematian datang bikin panggung terkoyak
[01:18.50] Jalan buntu di depan, mending lu puter balik
[01:23.00] Jangan sok jagoan, nanti kepala lu panik
[01:27.50] Puter balik woi, puter balik!
[01:32.00] Empat kepala bersatu bikin jalanan panik`
  },
  'vander-kampungan': {
    bpm: 125,
    duration: 117,
    syncedLyrics: `[00:00.00] (Intro Beat - Vander! Kampungan)
[00:03.50] Vander! 2026!
[00:06.50] Gaya kampung tapi rezeki kota
[00:10.00] Gak perlu gengsi asal dapur ngebul nyata
[00:13.80] Kalian yang sok elit banyak hutang sana sini
[00:17.50] Gua yang kampungan hidup tenang tiap hari
[00:21.50] Nongkrong di pos ronda kopi item sebat dua
[00:25.50] Kampungan bukan berarti murahan!
[00:29.50] Asli dari akar rumput, bikin kita juara
[00:33.50] Kaos oblong celana pendek sendal jepit swallow
[00:37.50] Tapi di rekening saldo gak pernah loyo
[00:41.50] Orang kota banyak gaya pusing mikir gengsi
[00:45.50] Orang kampung santai nikmati hidup ini
[00:50.00] Kampungan! Tetap bangga jadi anak desa
[00:55.00] Vander bawa gaya kampung ke panggung dunia!`
  },
  'vander-agaklaen': {
    bpm: 130,
    duration: 85,
    syncedLyrics: `[00:00.00] (Intro Beat - Agak Laen)
[00:03.50] (Apakah itu kamu Rorry?)
[00:06.50] Emang agak laen lu punya tingkah laku
[00:10.00] Ditanya kemana, jawabnya gak menentu
[00:13.50] Orang jalan lurus lu malah belok kiri
[00:17.00] Ngakunya bos besar dompet lu gak berisi
[00:20.50] Agak laen, agak laen lu emang unik
[00:24.00] Jangan kaget kalo liat kami makin asik
[00:27.50] Vander datang bawa gaya agak laen!
[00:31.00] Ngomong selangit tapi nol pembuktian
[00:35.00] Mending lu minggir daripada kena sindiran
[00:39.00] Gaya agak laen tapi banyak yang suka
[00:43.00] Bikin suasana malam jadi penuh tawa
[00:47.50] Agak laen emang juara!`
  },
  'vander-pantaiselatan': {
    bpm: 120,
    duration: 91,
    syncedLyrics: `[00:00.00] (Deburan ombak pantai selatan...)
[00:04.50] Vander di pantai selatan, yeeeah
[00:08.00] Angin kencang menerpa ombak samudra
[00:12.00] Nyi Roro Kidul jadi saksi legenda kita
[00:16.00] Misteri malam berselimut pasir putih
[00:20.00] Lagu ini mengalir hilangkan rasa sedih
[00:24.00] Berdiri di tebing menatap luasnya lautan
[00:28.00] Suara ombak memanggil dari pantai selatan
[00:32.00] Vander abadikan semua dalam nada tembang
[00:36.00] Menembus gulita malam hingga fajar menjelang
[00:40.50] Gelombang tinggi menghempas bebatuan karang
[00:45.00] Simpan rahasia kuno yang tak pernah lekang
[00:49.50] Pantai selatan tempat jiwa melayang bebas
[00:54.00] Menggapai ketenangan yang abadi dan lepas`
  },
  'vander-batuponari': {
    bpm: 128,
    duration: 91,
    syncedLyrics: `[00:00.00] (TB ajaib, batu ponari...)
[00:04.00] Batu Ponari, celup ke air langsung sakti
[00:07.50] Mitos atau fakta bikin orang antre pagi
[00:11.20] Zaman dulu viral sekarang jadi memori
[00:15.00] Vander bawa nostalgia batu ponari
[00:18.80] Mau kaya mau sembuh semua minta tuah
[00:22.50] Lucu tapi nyata bikin tertawa sumringah
[00:26.50] Batu ponari, legenda abadi Indonesia
[00:30.50] Ribuan orang datang berbondong-bondong
[00:34.50] Bawa botol galon gak mau pulang kosong
[00:38.50] Fenomena ajaib tak lekang oleh zaman
[00:42.50] Vander ingatkan lagi kisah sang pangeran`
  },
  'vander-gayagua': {
    bpm: 134,
    duration: 132,
    syncedLyrics: `[00:00.00] 2026, ini gaya gua...
[00:04.00] Terserah lu mau bilang apa...
[00:07.00] Ini gaya gua, terserah lu mau bilang apa
[00:10.50] Gak peduli tren musiman yang gampang sirna
[00:14.20] Asli dari jalanan, autentik dan berani
[00:18.00] Pakaian apa adanya tapi swag gua murni
[00:22.00] Jangan atur hidup orang kalo hidup lu kacau
[00:26.00] Gaya gua bebas, bikin haters lu meracau
[00:30.00] Vander tetap vander sampai akhir zaman!
[00:34.00] Melangkah di jalanan dengan kepala tegak
[00:38.00] Tak akan goyah walau badai menerpa serak
[00:42.00] Irama drill menghentak bumi pertiwi
[00:46.00] Bukti bahwa karya anak bangsa tetap berdiri
[00:50.50] Gaya gua gak bisa dibeli dengan materi
[00:55.00] Ini karakter asli yang tumbuh dari sanubari
[00:59.50] Vander takkan pernah mati!`
  }
};

let count = 0;
for (const track of lib) {
  if (naturalVanderMap[track.id]) {
    const data = naturalVanderMap[track.id];
    track.bpm = data.bpm;
    track.duration = data.duration;
    track.durationMs = data.duration * 1000;
    track.syncedLyrics = data.syncedLyrics;
    track.plainLyrics = data.syncedLyrics.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]\s*/g, '');
    count++;
  }
}

fs.writeFileSync(musicLibPath, JSON.stringify(lib, null, 2), 'utf8');
if (fs.existsSync(backendLibPath)) {
  fs.writeFileSync(backendLibPath, JSON.stringify(lib, null, 2), 'utf8');
}

console.log(`Applied natural vocal-paced timestamps for ${count} Vander tracks!`);
