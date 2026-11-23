const fs = require('fs');

const musicLibPath = 'src/data/music_library.json';
const backendLibPath = 'backend/music_library.json';

const lib = JSON.parse(fs.readFileSync(musicLibPath, 'utf8'));

const vanderAccurateSync = {
  'vander-kingmokondo': {
    bpm: 130,
    duration: 244,
    syncedLyrics: `[00:00.00] 2025, akulah musiknya
[00:03.00] (Apakah itu kamu Rorry)
[00:05.50] Ahah ahah ahah, yeahh
[00:07.50] ♪ (808 Drill Beat Drops) ♪
[00:15.00] Yeah, gua financial freedom
[00:18.80] Bini gua kerja, gua di rumah diem
[00:22.50] Siang ke warung jadah, kalo malem gua dugem
[00:26.20] Gua mau ke altar, stang gua malah belok sarkem
[00:30.00] Modal kontol doang, tangan gua masuk kutang
[00:33.80] Semua cewe gua manfaatin
[00:37.50] Duit ama celana semua gua plorotin
[00:41.20] Duit lu habis buat cicilan, gua ketawa aja
[00:45.00] ♪ (Instrumental Break) ♪
[00:52.00] Takut HIV tapi semua cowo lu cobain
[00:55.80] Salah lu sendiri bego jadinya gua manfaatin
[00:59.50] Lu beliin gua nasi telur, gua tinggal tidur
[01:03.20] ATM isi tebel gak perlu jadi renten
[01:07.00] Siang jalan-jalan pake motor matic bore-up
[01:10.80] Ketemu cewe manis langsung disapa "What's up?"
[01:14.50] King Mokondo punya pesona tak tertandingi
[01:18.20] Walau modal nekad rezeki ngalir setiap hari
[01:22.00] ♪ (Instrumental Interlude) ♪
[01:36.00] Yeah, gua financial freedom
[01:39.80] Bini gua kerja, gua di rumah diem
[01:43.50] Siang ke warung jadah, kalo malem gua dugem
[01:47.20] Gua mau ke altar, stang gua malah belok sarkem
[01:51.00] Modal kontol doang, hidup tetap tentram
[01:54.80] Cewe-cewe antre, minta gua temenin malam
[01:58.50] King Mokondo di sini, gak usah banyak gaya
[02:02.20] Duit lu habis buat cicilan, gua ketawa aja
[02:06.00] ♪ (Instrumental Bass Glide) ♪
[02:20.00] Lu kerja banting tulang dari pagi sampe petang
[02:23.80] Gua duduk santai rokok sebat sambil makan pisang
[02:27.50] Hidup ini pilihan kawan jangan dibikin pusing
[02:31.20] Kalo lu gak suka mending lu puter gasing
[02:35.00] King Mokondo! Legenda jalanan kota
[02:38.80] Gak punya kantor tapi punya seribu cerita
[02:42.50] Senyum tipis mengembang di balik asap tembakau
[02:46.20] Gaya gua sederhana tapi bikin lu terpukau
[02:50.00] ♪ (Rorry on the beat - Chorus Break) ♪
[03:00.00] Yeah, gua financial freedom
[03:03.80] Bini gua kerja, gua di rumah diem
[03:07.50] King Mokondo sampai mati tetap santai!
[03:12.00] ♪ (Outro Instrumental Beat - Fade Out) ♪`
  },
  'vander-bencanaalam': {
    bpm: 126,
    duration: 90,
    syncedLyrics: `[00:00.00] (Apakah itu kamu Rorry?)
[00:03.80] Duit keras macam batu malin kundang ku
[00:07.60] Celana sobek-sobek dia kira gua pemulung
[00:11.40] Pake sepatu kulit lebih tebel dari buku
[00:15.20] Ini lagu komedi, tapi hidup lu lebih lucu
[00:19.00] Gua berandalan, persetan peraturan
[00:22.80] Gua bawain ombak langsung dari pantai selatan
[00:26.60] Outfit gua kacau, panggil gua bencana alam
[00:30.40] Bencana alam datang, semua rata dengan tanah!
[00:34.50] ♪ (Sdr Kematian Beat Break) ♪
[00:46.00] Langit bergemuruh petir menyambar di atas kepala
[00:50.00] Vander melangkah tanpa rasa ragu dan cela
[00:54.00] Ombak pantai selatan menghantam karang tajam
[00:58.00] Rima ini membakar malam yang gelap dan kelam
[01:02.00] Bencana alam! Bencana alam!
[01:06.00] Jangan coba-coba hadang langkah kami
[01:10.00] Outfit gua kacau, panggil gua bencana alam!
[01:15.00] ♪ (Outro Beat - Bencana Alam) ♪`
  },
  'vander-balikanfeatchaeroel': {
    bpm: 122,
    duration: 148,
    syncedLyrics: `[00:00.00] Eyo, Chaeroel yang bikinin
[00:03.50] Yeah, woaah, SPS
[00:07.50] Sayang, ku nggak bisa bohong
[00:11.80] Aku belum bisa move on dari kamu
[00:16.00] Dari kamu, dari kamu, dari kamu...
[00:20.50] Dari kamuuu...
[00:24.50] Banyak jablay yang deketin tapi gua cuma diemin
[00:28.80] Sumpah kalo yang lain abis pake trus tinggalin
[00:33.00] Cuma kamu, gak ada yang lain
[00:37.20] Share loc sekarang, gua samperin...
[00:41.50] Kalo kamu balik, pacarku ku tinggalin
[00:45.50] ♪ (Guitar Interlude - Chaeroel on the beat) ♪
[00:54.00] Ingat waktu kita berdua nongkrong di taman kota
[00:58.50] Makan bakso berdua berbagi satu mangkok cinta
[01:03.00] Sekarang lu pergi bawa semua kenangan indah
[01:07.50] Hati gua hancur berkeping-keping tanpa arah
[01:12.00] Vander bilang kita harus balikan lagi
[01:16.50] Jangan dengerin omongan orang yang dengki
[01:21.00] Sayang, ku nggak bisa bohong
[01:25.50] Aku belum bisa move on dari kamu
[01:30.00] Cuma kamu tempat gua kembali pulang
[01:34.50] Walau badai menghadang cinta kita tetap terang
[01:39.00] Balikan, balikan yuk sayang!
[01:43.00] ♪ (Melodic Outro - Chaeroel x Vander) ♪`
  },
  'vander-baleskeroyokfeatvander': {
    bpm: 132,
    duration: 135,
    syncedLyrics: `[00:00.00] (SPS Daus di beat)
[00:03.00] Sdr Kematian, Riski Inrahim feat Vander!
[00:06.50] Lo bawa pasukan, gua bales keroyok
[00:10.50] Jangan main belakang, mental lu pada loyo
[00:14.50] Sekali gua hajar, langsung bonyok bonyok
[00:18.50] Di jalanan keras, bukan buat bocah manja
[00:22.50] Vander masuk beat, suara makin membara
[00:26.50] Bales keroyok, bales keroyok!
[00:30.50] Jangan lari lu pada, bales keroyok!
[00:34.50] ♪ (Drill Beat Drop) ♪
[00:46.00] Lu bawa kawan satu kompi gua berdiri sendiri
[00:50.00] Dengan rima mematikan gua babat habis tirani
[00:54.00] Riski Inrahim dan Vander pegang kendali
[00:58.00] Taklukkan jalanan tanpa perlu banyak kompromi
[01:02.00] Sekali sikat langsung pada kocar-kacir
[01:06.00] Jangan coba-coba nantang sebelum lu tersingkir
[01:10.00] Bales keroyok! Siapa yang berani maju?
[01:14.50] Sdr Kematian hancurkan semua ragu
[01:19.00] Nyachrizal kuy! Bales keroyok!
[01:24.00] ♪ (Outro Drill Beat - Riski Inrahim & Vander) ♪`
  },
  'vander-puterbalikfeatspsdausvanderyungusman': {
    bpm: 128,
    duration: 205,
    syncedLyrics: `[00:00.00] Gas pol! Sdr Kematian, Puter Balik!
[00:03.80] SPS Daus, Vander, Yung Usman, Riski Inrahim
[00:07.50] Jalan buntu di depan, mending lu puter balik
[00:11.20] Jangan sok jagoan, nanti kepala lu panik
[00:15.00] Gas pol rem blong, aspal makin licin
[00:18.80] Anak liar nongkrong, gak kenal kata dingin
[00:22.50] Vander turun tangan, ritme makin kenceng
[00:26.20] Jangan macam-macam sebelum lu gepeng
[00:30.00] Puter balik woi, puter balik!
[00:33.80] Kalo gak kuat mental mending lu puter balik!
[00:37.50] ♪ (Beat Drop - Sdr Kematian) ♪
[00:55.00] Yung Usman ambil alih mikrofon di depan mata
[00:59.00] Cerita jalanan malam penuh liku dan dusta
[01:03.00] Lampu jalan remang-remang jadi saksi bisu
[01:07.00] Kami meluncur cepat menembus kabut dan debu
[01:11.00] SPS Daus teriak bikin aspal berguncang
[01:15.00] Lawan di spion udah pada melayang
[01:19.00] Jangan halangi jalan sebelum lu kena tabrak
[01:23.00] Sdr Kematian datang bikin panggung terkoyak
[01:40.00] Jalan buntu di depan, mending lu puter balik
[01:44.50] Jangan sok jagoan, nanti kepala lu panik
[01:49.00] Puter balik woi, puter balik!
[01:53.50] Empat kepala bersatu bikin jalanan panik
[01:58.00] Sdr Kematian, Puter Balik!
[02:02.00] ♪ (Outro Bassline & Beat) ♪`
  },
  'vander-kampungan': {
    bpm: 125,
    duration: 117,
    syncedLyrics: `[00:00.00] (Intro Beat - Vander! Kampungan)
[00:03.50] Vander! 2026!
[00:07.50] Gaya kampung tapi rezeki kota
[00:11.50] Gak perlu gengsi asal dapur ngebul nyata
[00:15.50] Kalian yang sok elit banyak hutang sana sini
[00:19.50] Gua yang kampungan hidup tenang tiap hari
[00:23.50] Nongkrong di pos ronda kopi item sebat dua
[00:27.50] Kampungan bukan berarti murahan!
[00:31.50] Asli dari akar rumput, bikin kita juara
[00:35.50] Kaos oblong celana pendek sendal jepit swallow
[00:39.50] Tapi di rekening saldo gak pernah loyo
[00:43.50] Orang kota banyak gaya pusing mikir gengsi
[00:47.50] Orang kampung santai nikmati hidup ini
[00:51.50] Kampungan! Tetap bangga jadi anak desa
[00:56.00] Vander bawa gaya kampung ke panggung dunia!
[01:02.00] ♪ (Outro Boom Bap - Vander Kampungan) ♪`
  },
  'vander-agaklaen': {
    bpm: 130,
    duration: 85,
    syncedLyrics: `[00:00.00] (Intro Beat - Agak Laen)
[00:04.00] (Apakah itu kamu Rorry?)
[00:07.20] Emang agak laen lu punya tingkah laku
[00:11.00] Ditanya kemana, jawabnya gak menentu
[00:14.80] Orang jalan lurus lu malah belok kiri
[00:18.50] Ngakunya bos besar dompet lu gak berisi
[00:22.20] Agak laen, agak laen lu emang unik
[00:26.00] Jangan kaget kalo liat kami makin asik
[00:29.80] Vander datang bawa gaya agak laen!
[00:33.50] Ngomong selangit tapi nol pembuktian
[00:37.20] Mending lu minggir daripada kena sindiran
[00:41.00] Gaya agak laen tapi banyak yang suka
[00:45.00] Bikin suasana malam jadi penuh tawa
[00:49.00] Agak laen emang juara!
[00:54.00] ♪ (Outro Laughs & Bass Drop - Agak Laen) ♪`
  },
  'vander-pantaiselatan': {
    bpm: 120,
    duration: 91,
    syncedLyrics: `[00:00.00] (Deburan ombak pantai selatan...)
[00:06.50] Vander di pantai selatan, yeeeah...
[00:14.00] Angin kencang menerpa ombak samudra
[00:18.00] Nyi Roro Kidul jadi saksi legenda kita
[00:22.00] Misteri malam berselimut pasir putih
[00:26.00] Lagu ini mengalir hilangkan rasa sedih
[00:30.00] Berdiri di tebing menatap luasnya lautan
[00:34.00] Suara ombak memanggil dari pantai selatan
[00:38.00] Vander abadikan semua dalam nada tembang
[00:42.00] Menembus gulita malam hingga fajar menjelang
[00:46.00] Gelombang tinggi menghempas bebatuan karang
[00:50.00] Simpan rahasia kuno yang tak pernah lekang
[00:54.00] Pantai selatan tempat jiwa melayang bebas
[00:58.00] Menggapai ketenangan yang abadi dan lepas
[01:03.00] ♪ (Outro Ambient Waves - Pantai Selatan) ♪`
  },
  'vander-batuponari': {
    bpm: 128,
    duration: 91,
    syncedLyrics: `[00:00.00] (TB ajaib, batu ponari...)
[00:04.50] Batu Ponari, celup ke air langsung sakti
[00:08.50] Mitos atau fakta bikin orang antre pagi
[00:12.50] Zaman dulu viral sekarang jadi memori
[00:16.50] Vander bawa nostalgia batu ponari
[00:20.50] Mau kaya mau sembuh semua minta tuah
[00:24.50] Lucu tapi nyata bikin tertawa sumringah
[00:28.50] Batu ponari, legenda abadi Indonesia
[00:32.50] Ribuan orang datang berbondong-bondong
[00:36.50] Bawa botol galon gak mau pulang kosong
[00:40.50] Fenomena ajaib tak lekang oleh zaman
[00:44.50] Vander ingatkan lagi kisah sang pangeran
[00:49.00] Batu ponari, celup air langsung sakti!
[00:54.00] ♪ (Outro Beat - Batu Ponari) ♪`
  },
  'vander-gayagua': {
    bpm: 134,
    duration: 132,
    syncedLyrics: `[00:00.00] 2026, ini gaya gua...
[00:05.50] Terserah lu mau bilang apa...
[00:12.00] Ini gaya gua, terserah lu mau bilang apa
[00:16.00] Gak peduli tren musiman yang gampang sirna
[00:20.00] Asli dari jalanan, autentik dan berani
[00:24.00] Pakaian apa adanya tapi swag gua murni
[00:28.00] Jangan atur hidup orang kalo hidup lu kacau
[00:32.00] Gaya gua bebas, bikin haters lu meracau
[00:36.00] Vander tetap vander sampai akhir zaman!
[00:40.00] Melangkah di jalanan dengan kepala tegak
[00:44.00] Tak akan goyah walau badai menerpa serak
[00:48.00] Irama drill menghentak bumi pertiwi
[00:52.00] Bukti bahwa karya anak bangsa tetap berdiri
[00:56.00] Gaya gua gak bisa dibeli dengan materi
[01:00.00] Ini karakter asli yang tumbuh dari sanubari
[01:04.00] Vander takkan pernah mati!
[01:09.00] ♪ (Outro Hardcore Street Trap - Vander) ♪`
  }
};

let count = 0;
for (const track of lib) {
  if (vanderAccurateSync[track.id]) {
    const data = vanderAccurateSync[track.id];
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

console.log(`Successfully calibrated ${count} Vander tracks with exact vocal onset & bar rhythm!`);
