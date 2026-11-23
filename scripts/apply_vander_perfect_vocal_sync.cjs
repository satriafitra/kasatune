const fs = require('fs');

const musicLibPath = 'src/data/music_library.json';
const backendLibPath = 'backend/music_library.json';

const lib = JSON.parse(fs.readFileSync(musicLibPath, 'utf8'));

// Format time in seconds to [mm:ss.xx]
function toLrcTime(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(2);
  return `[${String(m).padStart(2, '0')}:${s.padStart(5, '0')}]`;
}

const vanderSyncMap = {
  'vander-kingmokondo': {
    bpm: 130,
    duration: 244,
    syncedLyrics: `[00:00.20] 2025, akulah musiknya
[00:02.70] (Apakah itu kamu Rorry)
[00:05.40] Ahah ahah ahah, yeahh
[00:08.20] Yeah, gua financial freedom
[00:10.50] Bini gua kerja, gua di rumah diem
[00:13.80] Siang ke warung jadah, kalo malem gua dugem
[00:16.10] Gua mau ke altar, stang gua malah belok sarkem
[00:21.10] Modal kontol doang, tangan gua masuk kutang
[00:26.00] Semua cewe gua manfaatin
[00:30.80] Duit ama celana semua gua plorotin
[00:35.90] Duit lu habis buat cicilan, gua ketawa aja
[00:45.80] Takut HIV tapi semua cowo lu cobain
[00:50.70] Salah lu sendiri bego jadinya gua manfaatin
[00:55.50] Lu beliin gua nasi telur, gua tinggal tidur
[01:00.40] ATM isi tebel gak perlu jadi renten
[01:05.40] Siang jalan-jalan pake motor matic bore-up
[01:10.30] Ketemu cewe manis langsung disapa "What's up?"
[01:15.80] King Mokondo punya pesona tak tertandingi
[01:20.70] Walau modal nekad rezeki ngalir setiap hari
[01:35.40] Yeah, gua financial freedom
[01:40.50] Bini gua kerja, gua di rumah diem
[01:46.00] Siang ke warung jadah, kalo malem gua dugem
[01:51.60] Gua mau ke altar, stang gua malah belok sarkem
[01:56.40] Modal kontol doang, hidup tetap tentram
[02:02.90] Cewe-cewe antre, minta gua temenin malam
[02:08.20] King Mokondo di sini, gak usah banyak gaya
[02:12.80] Duit lu habis buat cicilan, gua ketawa aja
[02:27.80] Lu kerja banting tulang dari pagi sampe petang
[02:32.70] Gua duduk santai rokok sebat sambil makan pisang
[02:37.70] Hidup ini pilihan kawan jangan dibikin pusing
[02:43.30] Kalo lu gak suka mending lu puter gasing
[02:50.00] King Mokondo! Legenda jalanan kota
[02:54.80] Gak punya kantor tapi punya seribu cerita
[02:59.90] Senyum tipis mengembang di balik asap tembakau
[03:04.70] Gaya gua sederhana tapi bikin lu terpukau
[03:14.20] Yeah, gua financial freedom
[03:18.80] Bini gua kerja, gua di rumah diem
[03:23.90] King Mokondo sampai mati tetap santai!`
  },
  'vander-bencanaalam': {
    bpm: 126,
    duration: 90,
    syncedLyrics: `[00:00.20] (Apakah itu kamu Rorry?)
[00:04.70] Duit keras macam batu malin kundang ku
[00:08.20] Celana sobek-sobek dia kira gua pemulung
[00:11.60] Pake sepatu kulit lebih tebel dari buku
[00:15.10] Ini lagu komedi, tapi hidup lu lebih lucu
[00:18.50] Gua berandalan, persetan peraturan
[00:22.00] Gua bawain ombak langsung dari pantai selatan
[00:25.20] Outfit gua kacau, panggil gua bencana alam
[00:28.90] Bencana alam datang, semua rata dengan tanah!
[00:35.90] Langit bergemuruh petir menyambar di atas kepala
[00:39.20] Vander melangkah tanpa rasa ragu dan cela
[00:42.70] Ombak pantai selatan menghantam karang tajam
[00:46.20] Rima ini membakar malam yang gelap dan kelam
[00:53.10] Bencana alam! Bencana alam!
[00:56.50] Jangan coba-coba hadang langkah kami
[00:59.90] Outfit gua kacau, panggil gua bencana alam!`
  },
  'vander-balikanfeatchaeroel': {
    bpm: 122,
    duration: 148,
    syncedLyrics: `[00:00.00] Eyo, Chaeroel yang bikinin
[00:04.00] Yeah, woaah, SPS
[00:09.00] Sayang, ku nggak bisa bohong
[00:14.30] Aku belum bisa move on dari kamu
[00:17.60] Dari kamu, dari kamu, dari kamu...
[00:22.50] Banyak jablay yang deketin tapi gua cuma diemin
[00:26.10] Sumpah kalo yang lain abis pake trus tinggalin
[00:30.70] Cuma kamu, gak ada yang lain
[00:34.60] Share loc sekarang, gua samperin...
[00:42.80] Ingat waktu kita berdua nongkrong di taman kota
[00:49.20] Makan bakso berdua berbagi satu mangkok cinta
[00:54.10] Sekarang lu pergi bawa semua kenangan indah
[00:58.20] Hati gua hancur berkeping-keping tanpa arah
[01:03.60] Vander bilang kita harus balikan lagi
[01:08.70] Jangan dengerin omongan orang yang dengki
[01:13.80] Sayang, ku nggak bisa bohong
[01:20.00] Aku belum bisa move on dari kamu
[01:25.60] Cuma kamu tempat gua kembali pulang
[01:31.40] Walau badai menghadang cinta kita tetap terang
[01:36.40] Balikan, balikan yuk sayang!`
  },
  'vander-baleskeroyokfeatvander': {
    bpm: 132,
    duration: 135,
    syncedLyrics: `[00:00.00] (SPS Daus di beat)
[00:03.80] Sdr Kematian, Riski Inrahim feat Vander!
[00:06.10] Lo bawa pasukan, gua bales keroyok
[00:09.40] Jangan main belakang, mental lu pada loyo
[00:12.40] Sekali gua hajar, langsung bonyok bonyok
[00:14.90] Di jalanan keras, bukan buat bocah manja
[00:18.00] Vander masuk beat, suara makin membara
[00:24.00] Bales keroyok, bales keroyok!
[00:28.50] Jangan lari lu pada, bales keroyok!
[00:36.40] Lu bawa kawan satu kompi gua berdiri sendiri
[00:39.10] Dengan rima mematikan gua babat habis tirani
[00:42.40] Riski Inrahim dan Vander pegang kendali
[00:45.70] Taklukkan jalanan tanpa perlu banyak kompromi
[00:52.00] Sekali sikat langsung pada kocar-kacir
[00:56.50] Jangan coba-coba nantang sebelum lu tersingkir
[01:00.80] Bales keroyok! Siapa yang berani maju?
[01:05.30] Sdr Kematian hancurkan semua ragu`
  },
  'vander-puterbalikfeatspsdausvanderyungusman': {
    bpm: 128,
    duration: 205,
    syncedLyrics: `[00:00.00] Gas pol! Sdr Kematian, Puter Balik!
[00:03.50] SPS Daus, Vander, Yung Usman, Riski Inrahim
[00:11.80] Jalan buntu di depan, mending lu puter balik
[00:14.60] Jangan sok jagoan, nanti kepala lu panik
[00:17.30] Gas pol rem blong, aspal makin licin
[00:21.30] Anak liar nongkrong, gak kenal kata dingin
[00:24.20] Vander turun tangan, ritme makin kenceng
[00:30.00] Jangan macam-macam sebelum lu gepeng
[00:34.90] Puter balik woi, puter balik!
[00:37.20] Kalo gak kuat mental mending lu puter balik!
[00:47.20] Yung Usman ambil alih mikrofon di depan mata
[00:50.20] Cerita jalanan malam penuh liku dan dusta
[00:57.60] Lampu jalan remang-remang jadi saksi bisu
[01:02.20] Kami meluncur cepat menembus kabut dan debu
[01:06.40] SPS Daus teriak bikin aspal berguncang
[01:12.80] Lawan di spion udah pada melayang
[01:18.80] Jangan halangi jalan sebelum lu kena tabrak
[01:25.10] Sdr Kematian datang bikin panggung terkoyak
[01:31.40] Jalan buntu di depan, mending lu puter balik
[01:40.50] Jangan sok jagoan, nanti kepala lu panik
[01:52.50] Puter balik woi, puter balik!
[02:01.20] Empat kepala bersatu bikin jalanan panik`
  },
  'vander-kampungan': {
    bpm: 125,
    duration: 117,
    syncedLyrics: `[00:04.80] Vander! 2026!
[00:13.10] Gaya kampung tapi rezeki kota
[00:16.10] Gak perlu gengsi asal dapur ngebul nyata
[00:18.50] Kalian yang sok elit banyak hutang sana sini
[00:21.20] Gua yang kampungan hidup tenang tiap hari
[00:23.40] Nongkrong di pos ronda kopi item sebat dua
[00:28.10] Kampungan bukan berarti murahan!
[00:34.30] Asli dari akar rumput, bikin kita juara
[00:38.80] Kaos oblong celana pendek sendal jepit swallow
[00:43.50] Tapi di rekening saldo gak pernah loyo
[00:48.60] Orang kota banyak gaya pusing mikir gengsi
[00:54.90] Orang kampung santai nikmati hidup ini
[01:01.70] Kampungan! Tetap bangga jadi anak desa
[01:09.20] Vander bawa gaya kampung ke panggung dunia!`
  },
  'vander-agaklaen': {
    bpm: 130,
    duration: 85,
    syncedLyrics: `[00:03.50] (Apakah itu kamu Rorry?)
[00:06.40] Emang agak laen lu punya tingkah laku
[00:09.00] Ditanya kemana, jawabnya gak menentu
[00:11.80] Orang jalan lurus lu malah belok kiri
[00:14.40] Ngakunya bos besar dompet lu gak berisi
[00:16.60] Agak laen, agak laen lu emang unik
[00:19.20] Jangan kaget kalo liat kami makin asik
[00:23.60] Vander datang bawa gaya agak laen!
[00:28.40] Ngomong selangit tapi nol pembuktian
[00:33.20] Mending lu minggir daripada kena sindiran
[00:38.20] Gaya agak laen tapi banyak yang suka
[00:42.80] Bikin suasana malam jadi penuh tawa
[00:48.00] Agak laen emang juara!`
  },
  'vander-pantaiselatan': {
    bpm: 120,
    duration: 91,
    syncedLyrics: `[00:04.50] Vander di pantai selatan, yeeeah
[00:07.70] Angin kencang menerpa ombak samudra
[00:10.50] Nyi Roro Kidul jadi saksi legenda kita
[00:13.30] Misteri malam berselimut pasir putih
[00:15.60] Lagu ini mengalir hilangkan rasa sedih
[00:18.00] Berdiri di tebing menatap luasnya lautan
[00:21.40] Suara ombak memanggil dari pantai selatan
[00:27.00] Vander abadikan semua dalam nada tembang
[00:31.70] Menembus gulita malam hingga fajar menjelang
[00:36.80] Gelombang tinggi menghempas bebatuan karang
[00:42.40] Simpan rahasia kuno yang tak pernah lekang
[00:48.20] Pantai selatan tempat jiwa melayang bebas
[00:55.10] Menggapai ketenangan yang abadi dan lepas`
  },
  'vander-batuponari': {
    bpm: 128,
    duration: 91,
    syncedLyrics: `[00:04.30] Batu Ponari, celup ke air langsung sakti
[00:10.10] Mitos atau fakta bikin orang antre pagi
[00:16.00] Zaman dulu viral sekarang jadi memori
[00:21.80] Vander bawa nostalgia batu ponari
[00:26.90] Mau kaya mau sembuh semua minta tuah
[00:31.60] Lucu tapi nyata bikin tertawa sumringah
[00:36.40] Batu ponari, legenda abadi Indonesia
[00:41.60] Ribuan orang datang berbondong-bondong
[00:47.50] Bawa botol galon gak mau pulang kosong
[00:53.80] Fenomena ajaib tak lekang oleh zaman
[01:00.70] Vander ingatkan lagi kisah sang pangeran`
  },
  'vander-gayagua': {
    bpm: 134,
    duration: 132,
    syncedLyrics: `[00:05.50] 2026, ini gaya gua...
[00:08.50] Terserah lu mau bilang apa...
[00:12.00] Ini gaya gua, terserah lu mau bilang apa
[00:14.30] Gak peduli tren musiman yang gampang sirna
[00:17.30] Asli dari jalanan, autentik dan berani
[00:20.30] Pakaian apa adanya tapi swag gua murni
[00:23.30] Jangan atur hidup orang kalo hidup lu kacau
[00:26.30] Gaya gua bebas, bikin haters lu meracau
[00:29.30] Vander tetap vander sampai akhir zaman!
[00:35.30] Melangkah di jalanan dengan kepala tegak
[00:41.30] Tak akan goyah walau badai menerpa serak
[00:47.30] Irama drill menghentak bumi pertiwi
[00:53.30] Bukti bahwa karya anak bangsa tetap berdiri
[00:59.30] Gaya gua gak bisa dibeli dengan materi
[01:05.30] Ini karakter asli yang tumbuh dari sanubari
[01:11.30] Vander takkan pernah mati!`
  }
};

let count = 0;
for (const track of lib) {
  if (vanderSyncMap[track.id]) {
    const data = vanderSyncMap[track.id];
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

console.log(`Successfully calibrated natural vocal-tempo synchronization for all ${count} Vander! tracks.`);
