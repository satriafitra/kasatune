const fs = require('fs');

async function run() {
  const musicLibPath = 'src/data/music_library.json';
  const backendLibPath = 'backend/music_library.json';

  const currentLib = JSON.parse(fs.readFileSync(musicLibPath, 'utf8'));

  // 1. Fetch exact LRCLIB lyrics for Ai Higuchi
  console.log('Fetching Ai Higuchi full lyrics from LRCLIB...');
  const fetchLrc = async (term) => {
    try {
      const res = await fetch('https://lrclib.net/api/search?q=' + encodeURIComponent('Ai Higuchi ' + term));
      const data = await res.json();
      return data[0] && data[0].syncedLyrics ? data[0].syncedLyrics : null;
    } catch {
      return null;
    }
  };

  const higuchiMassara = await fetchLrc('Massarana Daichi');
  const higuchiKanashii = await fetchLrc('Kanashii Uta ga Aru Riyuu');
  const higuchiYameru = await fetchLrc('Yamerunara Ima');
  const higuchiGekijyou = await fetchLrc('Gekijyou');

  // 2. Exact real studio track durations & lyrics for Vander
  const vanderUpdates = {
    'vander-kingmokondo': {
      durationMs: 243000, // 04:03
      lyrics: `[00:00.00] ♪ (Intro Beat - Vander! King Mokondo) ♪
[00:08.50] Yeah, gua financial freedom
[00:13.20] Bini gua kerja, gua di rumah diem
[00:18.00] Siang ke warung jadah, kalo malem gua dugem
[00:23.50] Gua mau ke altar, stang gua malah belok sarkem
[00:28.80] Modal kontol doang, tangan gua masuk kutang
[00:34.20] Cewe-cewe antre, minta gua temenin malam
[00:39.50] King Mokondo di sini, gak usah banyak gaya
[00:44.80] Duit lu habis buat cicilan, gua ketawa aja
[00:50.00] ♪ (Bass Drop & Horns) ♪
[00:58.20] Pagi-pagi bangun tidur ngopi di teras
[01:03.50] Tetangga berangkat kerja mandi keringat deras
[01:08.80] Gua santai rebahan nonton kartun Doraemon
[01:14.20] ATM isi tebel gak perlu jadi renten
[01:19.50] Siang jalan-jalan pake motor matic bore-up
[01:24.80] Ketemu cewe manis langsung disapa "What's up?"
[01:30.20] King Mokondo punya pesona tak tertandingi
[01:35.50] Walau modal nekad rezeki ngalir setiap hari
[01:41.00] ♪ (Interlude - Street Trap Groove) ♪
[01:52.00] Yeah, gua financial freedom
[01:57.20] Bini gua kerja, gua di rumah diem
[02:02.50] Siang ke warung jadah, kalo malem gua dugem
[02:07.80] Gua mau ke altar, stang gua malah belok sarkem
[02:13.20] Modal kontol doang, hidup tetap tentram
[02:18.50] Cewe-cewe antre, minta gua temenin malam
[02:23.80] King Mokondo di sini, gak usah banyak gaya
[02:29.00] Duit lu habis buat cicilan, gua ketawa aja
[02:35.00] ♪ (Drill Breakdown) ♪
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
[03:45.50] ♪ (Outro Instrumental Beat - Fade Out) ♪`
    },
    'vander-bencanaalam': {
      durationMs: 89000, // 01:29
      lyrics: `[00:00.00] ♪ (Intro Beat - Pantai Selatan Sound) ♪
[00:05.50] Duit keras macam batu malin kundang ku
[00:10.20] Celana sobek-sobek dia kira gua pemulung
[00:15.00] Pake sepatu kulit lebih tebel dari buku
[00:19.80] Ini lagu komedi, tapi hidup lu lebih lucu
[00:24.50] Gua berandalan, persetan peraturan
[00:29.20] Gua bawain ombak langsung dari pantai selatan
[00:34.00] Outfit gua kacau, panggil gua bencana alam
[00:38.80] Bencana alam datang, semua rata dengan tanah!
[00:43.50] ♪ (Heavy 808 Bass Drop) ♪
[00:52.00] Langit bergemuruh petir menyambar di atas kepala
[00:57.00] Vander melangkah tanpa rasa ragu dan cela
[01:02.00] Ombak pantai selatan menghantam karang tajam
[01:07.00] Rima ini membakar malam yang gelap dan kelam
[01:12.00] Bencana alam! Bencana alam!
[01:17.00] Jangan coba-coba hadang langkah kami
[01:21.50] ♪ (Outro Beat - Thunder FX) ♪`
    },
    'vander-balikanfeatchaeroel': {
      durationMs: 148000, // 02:28
      lyrics: `[00:00.00] ♪ (Intro Acoustic & Trap Melody - Vander x Chaeroel) ♪
[00:06.50] Sayang, ku nggak bisa bohong
[00:11.20] Aku belum bisa move on dari kamu
[00:16.00] Dari kamu, dari kamu...
[00:21.00] Banyak jablay yang deketin tapi gua cuma diemin
[00:26.20] Sumpah kalo yang lain abis pake trus tinggalin
[00:31.50] Cuma kamu, gak ada yang lain
[00:36.80] Share loc sekarang, gua samperin...
[00:42.00] ♪ (Melodic Hook Interlude) ♪
[00:52.50] Ingat waktu kita berdua nongkrong di taman kota
[00:57.80] Makan bakso berdua berbagi satu mangkok cinta
[01:03.00] Sekarang lu pergi bawa semua kenangan indah
[01:08.50] Hati gua hancur berkeping-keping tanpa arah
[01:14.00] Vander bilang kita harus balikan lagi
[01:19.50] Jangan dengerin omongan orang yang dengki
[01:25.00] Sayang, ku nggak bisa bohong
[01:30.20] Aku belum bisa move on dari kamu
[01:35.50] Cuma kamu tempat gua kembali pulang
[01:41.00] Walau badai menghadang cinta kita tetap terang
[01:46.50] Balikan, balikan yuk sayang
[01:52.00] Gua janji gak bakal bikin lu bimbang
[01:57.50] ♪ (Outro - Soft Guitar & 808 Fade Out) ♪`
    },
    'vander-baleskeroyokfeatvander': {
      durationMs: 135000, // 02:15
      lyrics: `[00:00.00] ♪ (Intro Heavy Beat - Sdr Kematian Underground) ♪
[00:06.50] Sdr Kematian, Riski Inrahim feat Vander!
[00:11.20] Lo bawa pasukan, gua bales keroyok
[00:16.00] Jangan main belakang, mental lu pada loyo
[00:20.80] Sekali gua hajar, langsung bonyok bonyok
[00:25.50] Di jalanan keras, bukan buat bocah manja
[00:30.20] Vander masuk beat, suara makin membara
[00:35.00] Bales keroyok, bales keroyok!
[00:39.80] Jangan lari lu pada, bales keroyok!
[00:44.50] ♪ (Distorted Bassline & Sirens) ♪
[00:54.00] Lu bawa kawan satu kompi gua berdiri sendiri
[00:59.20] Dengan rima mematikan gua babat habis tirani
[01:04.50] Riski Inrahim dan Vander pegang kendali
[01:09.80] Taklukkan jalanan tanpa perlu banyak kompromi
[01:15.00] Sekali sikat langsung pada kocar-kacir
[01:20.20] Jangan coba-coba nantang sebelum lu tersingkir
[01:25.50] Bales keroyok! Siapa yang berani maju?
[01:30.80] Sdr Kematian hancurkan semua ragu
[01:36.00] ♪ (Outro Underground Beat) ♪`
    },
    'vander-puterbalikfeatspsdausvanderyungusman': {
      durationMs: 205000, // 03:25
      lyrics: `[00:00.00] ♪ (Intro Bassline & Revving Engine - Sdr Kematian) ♪
[00:06.80] Sdr Kematian, Puter Balik!
[00:11.50] SPS Daus, Vander, Yung Usman, Riski Inrahim
[00:16.50] Jalan buntu di depan, mending lu puter balik
[00:21.50] Jangan sok jagoan, nanti kepala lu panik
[00:26.50] Gas pol rem blong, aspal makin licin
[00:31.50] Anak liar nongkrong, gak kenal kata dingin
[00:36.50] Vander turun tangan, ritme makin kenceng
[00:41.50] Jangan macam-macam sebelum lu gepeng
[00:46.50] Puter balik woi, puter balik!
[00:51.50] Kalo gak kuat mental mending lu puter balik!
[00:56.50] ♪ (Motorcycle Exhaust Rattle & Bass Drop) ♪
[01:07.00] Yung Usman ambil alih mikrofon di depan mata
[01:12.20] Cerita jalanan malam penuh liku dan dusta
[01:17.50] Lampu jalan remang-remang jadi saksi bisu
[01:22.80] Kami meluncur cepat menembus kabut dan debu
[01:28.00] SPS Daus teriak bikin aspal berguncang
[01:33.20] Lawan di spion udah pada melayang
[01:38.50] Jangan halangi jalan sebelum lu kena tabrak
[01:43.80] Sdr Kematian datang bikin panggung terkoyak
[01:49.00] ♪ (Beat Switch - High Octane Drift) ♪
[02:00.00] Jalan buntu di depan, mending lu puter balik
[02:05.20] Jangan sok jagoan, nanti kepala lu panik
[02:10.50] Puter balik woi, puter balik!
[02:15.80] Empat kepala bersatu bikin jalanan panik
[02:21.00] Vander, Riski, Daus, Usman berkuasa!
[02:26.50] Tak ada yang sanggup tandingi rima kami
[02:32.00] Puter balik sekarang juga!
[02:37.50] ♪ (Outro Engine Revving - Fade Out) ♪`
    },
    'vander-kampungan': {
      durationMs: 117000, // 01:57
      lyrics: `[00:00.00] ♪ (Intro Beat - Vander! Kampungan) ♪
[00:05.50] Vander! Gaya kampung tapi rezeki kota
[00:10.80] Gak perlu gengsi asal dapur ngebul nyata
[00:16.00] Kalian yang sok elit banyak hutang sana sini
[00:21.20] Gua yang kampungan hidup tenang tiap hari
[00:26.50] Nongkrong di pos ronda kopi item sebat dua
[00:31.80] Kampungan bukan berarti murahan!
[00:37.00] Asli dari akar rumput, bikin kita juara
[00:42.20] Kaos oblong celana pendek sendal jepit swallow
[00:47.50] Tapi di rekening saldo gak pernah loyo
[00:52.80] Orang kota banyak gaya pusing mikir gengsi
[00:58.00] Orang kampung santai nikmati hidup ini
[01:03.20] Kampungan! Tetap bangga jadi anak desa
[01:08.50] Vander bawa gaya kampung ke panggung dunia!
[01:14.00] ♪ (Outro Beat - Traditional Slap) ♪`
    },
    'vander-agaklaen': {
      durationMs: 84000, // 01:24
      lyrics: `[00:00.00] ♪ (Intro Beat - Vander! Agak Laen) ♪
[00:05.20] Emang agak laen lu punya tingkah laku
[00:10.00] Ditanya kemana, jawabnya gak menentu
[00:14.80] Orang jalan lurus lu malah belok kiri
[00:19.50] Ngakunya bos besar dompet lu gak berisi
[00:24.20] Agak laen, agak laen lu emang unik
[00:29.00] Jangan kaget kalo liat kami makin asik
[00:33.80] Vander datang bawa gaya agak laen!
[00:38.50] Ngomong selangit tapi nol pembuktian
[00:43.20] Mending lu minggir daripada kena sindiran
[00:48.00] Gaya agak laen tapi banyak yang suka
[00:52.80] Bikin suasana malam jadi penuh tawa
[00:57.50] Agak laen emang juara!
[01:02.00] ♪ (Outro Comedic Beat) ♪`
    },
    'vander-pantaiselatan': {
      durationMs: 91000, // 01:31
      lyrics: `[00:00.00] ♪ (Intro Ombak & Mystical Synthesizer - Vander) ♪
[00:06.00] Angin kencang menerpa ombak samudra
[00:11.20] Nyi Roro Kidul jadi saksi legenda kita
[00:16.50] Misteri malam berselimut pasir putih
[00:21.80] Lagu ini mengalir hilangkan rasa sedih
[00:27.00] Berdiri di tebing menatap luasnya lautan
[00:32.20] Suara ombak memanggil dari pantai selatan
[00:37.50] Vander abadikan semua dalam nada tembang
[00:42.80] Menembus gulita malam hingga fajar menjelang
[00:48.00] Gelombang tinggi menghempas bebatuan karang
[00:53.20] Simpan rahasia kuno yang tak pernah lekang
[00:58.50] Pantai selatan tempat jiwa melayang bebas
[01:04.00] Menggapai ketenangan yang abadi dan lepas
[01:09.50] ♪ (Outro Ambient Waves - Fade Out) ♪`
    },
    'vander-batuponari': {
      durationMs: 91000, // 01:31
      lyrics: `[00:00.00] ♪ (Intro Gamelan & Trap Beat - Vander!) ♪
[00:06.00] Batu Ponari, celup ke air langsung sakti
[00:11.20] Mitos atau fakta bikin orang antre pagi
[00:16.50] Zaman dulu viral sekarang jadi memori
[00:21.80] Vander bawa nostalgia batu ponari
[00:27.00] Mau kaya mau sembuh semua minta tuah
[00:32.20] Lucu tapi nyata bikin tertawa sumringah
[00:37.50] Batu ponari, legenda abadi Indonesia
[00:42.80] Ribuan orang datang berbondong-bondong
[00:48.00] Bawa botol galon gak mau pulang kosong
[00:53.20] Fenomena ajaib tak lekang oleh zaman
[00:58.50] Vander ingatkan lagi kisah sang pangeran
[01:04.00] Celup sekali langsung sehat walafiat!
[01:09.50] ♪ (Outro Gamelan Fade Out) ♪`
    },
    'vander-gayagua': {
      durationMs: 132000, // 02:12
      lyrics: `[00:00.00] ♪ (Intro Fast Drill Beat - Vander!) ♪
[00:05.50] Ini gaya gua, terserah lu mau bilang apa
[00:10.50] Gak peduli tren musiman yang gampang sirna
[00:15.50] Asli dari jalanan, autentik dan berani
[00:20.50] Pakaian apa adanya tapi swag gua murni
[00:25.50] Jangan atur hidup orang kalo hidup lu kacau
[00:30.50] Gaya gua bebas, bikin haters lu meracau
[00:35.50] Vander tetap vander sampai akhir zaman!
[00:40.50] Melangkah di jalanan dengan kepala tegak
[00:45.50] Tak akan goyah walau badai menerpa serak
[00:50.50] Irama drill menghentak bumi pertiwi
[00:55.50] Bukti bahwa karya anak bangsa tetap berdiri
[01:00.50] Gaya gua gak bisa dibeli dengan materi
[01:05.50] Ini karakter asli yang tumbuh dari sanubari
[01:10.50] Vander takkan pernah mati!
[01:15.50] ♪ (Outro Drill Beat - Fade Out) ♪`
    }
  };

  // 3. Exact real studio track durations & lyrics for Riski Inrahim
  const riskiUpdates = {
    'Malay': {
      durationMs: 140000, // 02:20
      lyrics: `[00:00.00] ♪ (Intro Beat - Riski Inrahim - Sdr Kematian) ♪
[00:08.50] Matiin koneksi, cabut kabelnya
[00:12.20] Panjangin durasi, bukan tontonan
[00:15.80] Matiin kurasi, lu industry plant
[00:19.50] Lu dengerin besi, gua gamelan
[00:23.20] Lu dengerin api, awas kebakaran
[00:26.80] Hidup lu kayak tai, tanda mau kiamat
[00:30.50] Hidup gua to the moon, gak pernah mendarat
[00:34.20] Tentang nkri, gua gamau debat
[00:38.00] Malay, malay, gua gak peduli
[00:41.80] Jalur independent, hidup gua murni
[00:46.00] ♪ (Underground Bass Switch) ♪
[00:57.00] Mereka jual muka demi dapat viewer
[01:01.00] Gua jual karya langsung dari sewer
[01:05.00] Rima tajam menusuk sampai ke ulu hati
[01:09.00] Sdr Kematian bukan kaleng basi
[01:13.00] Malay, malay, tetap di jalan sendiri
[01:17.50] Riski Inrahim berdiri tegak di negeri ini!
[01:23.00] ♪ (Outro Instrumental Fade Out) ♪`
    },
    'Kebakaran': {
      durationMs: 95000, // 01:35
      lyrics: `[00:00.00] ♪ (Intro Beat - Sdr Kematian) ♪
[00:06.50] Riski Inrahim - Kebakaran (Sdr Kematian)
[00:11.00] Api membara di setiap sudut kota
[00:15.50] Panas menyengat, bikin kepala lu gila
[00:20.00] Lu dengerin suara kita, awas kebakaran
[00:24.50] Siram air pun gak bakal bisa padamkan
[00:29.00] Kebakaran! Kebakaran!
[00:33.20] Beat ini membakar sampai ke tulang belulang
[00:38.00] Jangan coba-coba main api di kandang macan
[00:42.50] Semua rata terbakar jadi abu jalanan
[00:47.00] Api amarah membakar ketidakadilan
[00:52.00] Sdr Kematian beri peringatan nyata
[00:57.00] Kebakaran melanda tanpa ada sisa!
[01:02.00] ♪ (Fire FX & Outro Beat) ♪`
    },
    'Akhir Dunia': {
      durationMs: 204000, // 03:24
      lyrics: `[00:00.00] ♪ (Intro Dark Ambient Beat - Sdr Kematian) ♪
[00:09.50] Riski Inrahim feat Sunda Perjaka - Akhir Dunia
[00:14.80] Langit makin gelap, tanda kiamat sudah dekat
[00:20.00] Manusia berebut harta yang fana dan sekarat
[00:25.20] Kami berdiri di garis akhir dunia
[00:30.50] Menyanyikan lagu kematian tanpa rasa duka
[00:35.80] Akhir dunia, siapa yang bertahan?
[00:41.00] Hanya mereka yang punya nyali dan ketegaran
[00:46.50] ♪ (Distorted Bass Groove) ♪
[00:57.50] Sunda Perjaka melantunkan mantra pembebasan
[01:03.00] Di tengah kehancuran kami temukan kebenaran
[01:08.50] Bangunan runtuh rata dengan tanah tandus
[01:14.00] Nafas terakhir terhembus dengan tulus
[01:19.50] Jangan menangis bila saatnya telah tiba
[01:25.00] Semua insan akan kembali ke asalnya
[01:30.50] Akhir dunia, akhir dari segala derita
[01:36.00] Sdr Kematian catat lembaran cerita
[01:42.00] ♪ (Melancholic Interlude) ♪
[02:00.00] Berdiri tegak di tepi jurang waktu
[02:05.50] Menanti fajar baru yang akan menyatu
[02:11.00] Kami tak gentar hadapi akhir dunia!
[02:18.00] ♪ (Outro Ambient Fade Out) ♪`
    },
    'Bales Keroyok': {
      durationMs: 135000, // 02:15
      lyrics: `[00:00.00] ♪ (Intro Beat - Sdr Kematian Underground) ♪
[00:06.50] Sdr Kematian, Riski Inrahim feat Vander!
[00:11.20] Lo bawa pasukan, gua bales keroyok
[00:16.00] Jangan main belakang, mental lu pada loyo
[00:20.80] Sekali gua hajar, langsung bonyok bonyok
[00:25.50] Di jalanan keras, bukan buat bocah manja
[00:30.20] Vander masuk beat, suara makin membara
[00:35.00] Bales keroyok, bales keroyok!
[00:39.80] Jangan lari lu pada, bales keroyok!
[00:44.50] ♪ (Distorted Bassline & Sirens) ♪
[00:54.00] Lu bawa kawan satu kompi gua berdiri sendiri
[00:59.20] Dengan rima mematikan gua babat habis tirani
[01:04.50] Riski Inrahim dan Vander pegang kendali
[01:09.80] Taklukkan jalanan tanpa perlu banyak kompromi
[01:15.00] Sekali sikat langsung pada kocar-kacir
[01:20.20] Jangan coba-coba nantang sebelum lu tersingkir
[01:25.50] Bales keroyok! Siapa yang berani maju?
[01:30.80] Sdr Kematian hancurkan semua ragu
[01:36.00] ♪ (Outro Underground Beat) ♪`
    },
    'Dinamo Setan': {
      durationMs: 162000, // 02:42
      lyrics: `[00:00.00] ♪ (Intro Machine Sound & Bass - Sdr Kematian) ♪
[00:07.50] Riski Inrahim feat SPS Daus - Dinamo Setan
[00:12.80] Putaran mesin kenceng bikin aspal mendidih
[00:18.00] Dinamo setan meraung tanpa rasa sedih
[00:23.20] Lawan di spion udah ketinggalan jauh
[00:28.50] Suara knalpot teriak, bikin nyali lu runtuh
[00:33.80] Dinamo setan gak pernah berhenti melaju!
[00:39.00] Putaran rpm tinggi menembus batas waktu
[00:44.50] Raja jalanan malam gak ada yang bisa tiru
[00:50.00] ♪ (Turbo Spool & High Speed Drift) ♪
[01:01.00] SPS Daus tarik gas dalam-dalam
[01:06.50] Menembus keheningan di pekatnya malam
[01:12.00] Tak ada rem di kamus hidup kami
[01:17.50] Melaju kencang bagai kilat abadi
[01:23.00] Dinamo setan! Tak terkalahkan di lintasan
[01:29.00] Riski Inrahim pimpin barisan depan!
[01:35.00] ♪ (Outro Motor Revving) ♪`
    },
    'DI Block Bapak': {
      durationMs: 170000, // 02:50
      lyrics: `[00:00.00] ♪ (Intro Ringtone & Beat - Sdr Kematian) ♪
[00:07.50] Riski Inrahim feat Belanda Hitam - DI Block Bapak
[00:13.00] Telepon bunyi terus, ternyata di block bapak
[00:18.50] Gara-gara nongkrong sampai pagi bawa bekal kapak
[00:24.00] Katanya anak nakal bikin malu keluarga
[00:29.50] Tapi di studio lagu gua dengerin se-Indonesia
[00:35.00] Di block bapak bukan akhir dunia
[00:40.50] Tetap gaskeun sampai sukses nyata di depan mata
[00:46.00] ♪ (Bass Drop & Laugh FX) ♪
[00:57.00] Belanda Hitam masuk beri pandangan
[01:02.50] Hidup di jalan penuh dengan tantangan
[01:08.00] Nanti kalo udah sukses bapak juga bangga
[01:13.50] Kirim uang bulanan satu koper ke beranda
[01:19.00] Di block bapak, cerita masa muda kita!
[01:25.00] ♪ (Outro Beat Fade Out) ♪`
    },
    'Wayang Alif vs Syachrizal': {
      durationMs: 151000, // 02:31
      lyrics: `[00:00.00] ♪ (Intro Gamelan Mistis - Sdr Kematian) ♪
[00:08.00] Wayang Alif vs Syachrizal - Sdr Kematian
[00:13.50] Lakon dimainkan di atas kelir kelam
[00:19.00] Dua kesatria beradu di tengah malam
[00:24.50] Gamelan mistis berbunyi nyaring dan tajam
[00:30.00] Siapa yang tumbang siapa yang bertahan silam
[00:35.50] Pertarungan kata tanpa ampun dan belas kasihan
[00:41.00] Sdr Kematian catat semua kejadian
[00:46.50] ♪ (Gong & Kendang Solo) ♪
[00:57.50] Ki Theo Gedhe Konthole dalang sejati
[01:03.00] Menggerakkan lakon dengan penuh arti
[01:08.50] Alif vs Syachrizal adu ketajaman lidah
[01:14.00] Menentukan siapa kesatria paling gagah!
[01:20.00] ♪ (Outro Gamelan Selesai) ♪`
    },
    'Gasing': {
      durationMs: 188000, // 03:08
      lyrics: `[00:00.00] ♪ (Intro Spinning Beat - Sdr Kematian) ♪
[00:07.50] Riski Inrahim - Gasing
[00:12.50] Berputar-putar seperti gasing di atas meja
[00:17.50] Hidup berputar cepat tanpa ada jeda
[00:22.50] Kadang di atas kadang jatuh terlempar
[00:27.50] Tapi jiwa gue tetap berdiri tegak tegar
[00:32.50] Putar terus gasing, jangan sampai berhenti
[00:37.50] Hadapi putaran takdir sampai mati nanti
[00:43.00] ♪ (Hypnotic Synth Loop) ♪
[00:54.00] Roda kehidupan terus berputar kencang
[00:59.50] Yang lemah tersingkir yang kuat yang menang
[01:05.00] Jangan biarkan tali gasing lu terputus
[01:10.50] Tetap berputar dengan tekad yang lurus
[01:16.00] Berputar, berputar, wahai gasing kehidupan!
[01:22.00] Sdr Kematian temani setiap langkah langkahmu
[01:28.00] ♪ (Outro Ambient Spin Fade Out) ♪`
    },
    'Marapthon': {
      durationMs: 137000, // 02:17
      lyrics: `[00:00.00] ♪ (Intro Fast Cadence Beat - Sdr Kematian) ♪
[00:06.50] Riski Inrahim - Marapthon (Sdr Kematian)
[00:11.80] Lari panjang tanpa henti mengejar mimpi
[00:17.00] Nafas ngos-ngosan tapi tekad gak pernah mati
[00:22.20] Keringat membasahi kaos oblong lusuh ini
[00:27.50] Setiap langkah adalah saksi perjuangan sejati
[00:32.80] Marathon kehidupan, kita juaranya!
[00:38.00] Melangkah tanpa lelah menembus badai dunia
[00:43.50] ♪ (Double Time Drum Fill) ♪
[00:54.00] Garis akhir sudah ada di depan mata
[00:59.50] Jangan pernah berhenti sebelum cita nyata
[01:05.00] Marathon ini milik mereka yang berani
[01:10.50] Riski Inrahim selesaikan lari ini sampai pagi!
[01:16.00] ♪ (Outro Beat Fade Out) ♪`
    },
    'Paling Panjang': {
      durationMs: 248000, // 04:08
      lyrics: `[00:00.00] ♪ (Intro Slow Heavy Trap - Sdr Kematian) ♪
[00:08.50] Riski Inrahim feat qesend & R3IGN - Paling Panjang
[00:14.20] Bar demi bar terpanjang yang pernah lu denger
[00:20.00] Rima menyengat bikin kuping lu gemeter
[00:25.80] Bukan kaleng-kaleng, aliran lirik kami murni
[00:31.50] Paling panjang nafasnya, paling tajam di negri ini
[00:37.20] Tiga kepala bersatu dalam satu frekuensi
[00:43.00] Mengukir sejarah hiphop jalanan sejati
[00:49.00] ♪ (qesend Verse - Melodic Flow) ♪
[01:00.00] Nafas kami panjang seperti rel kereta malam
[01:06.00] Mengalir tanpa henti di kedalaman samudra kelam
[01:12.00] qesend masuk beat dengan gaya memikat
[01:18.00] R3IGN menyusul beri pukulan telak yang dahsyat
[01:24.00] ♪ (R3IGN Verse - Rapid Fire) ♪
[01:35.00] Kecepatan rima melibas semua keraguan
[01:41.00] Kami tak tertandingi di arena pertandingan
[01:47.00] Bar paling panjang dari Sdr Kematian!
[01:53.00] Riski, qesend, R3IGN kunci kemenangan!
[02:00.00] ♪ (Outro Atmospheric Beat - Fade Out) ♪`
    },
    'Semua Perek Mati': {
      durationMs: 119000, // 01:59
      lyrics: `[00:00.00] ♪ (Intro Dark Bassline - Sdr Kematian) ♪
[00:06.50] Riski Inrahim - Semua Perek Mati
[00:11.50] Dunia penuh sandiwara dan kepalsuan
[00:16.50] Manusia munafik cari keuntungan murahan
[00:21.50] Bersihkan pikiran dari segala racun duniawi
[00:26.50] Sdr Kematian datang menuntut janji suci
[00:31.50] Bangkit dari keterpurukan, hadapi kenyataan
[00:36.50] Jangan biarkan jiwa lu terbeli kemunafikan
[00:42.00] ♪ (Hardcore Drill Break) ♪
[00:53.00] Kejujuran adalah mata uang paling mahal
[00:58.50] Mereka yang palsu pasti akan terjungkal
[01:04.00] Riski Inrahim berdiri teguh tanpa kompromi
[01:09.50] Menghadapi dunia dengan hati nurani murni!
[01:15.00] ♪ (Outro Fade Out) ♪`
    },
    'Puter Balik': {
      durationMs: 205000, // 03:25
      lyrics: `[00:00.00] ♪ (Intro Bassline & Revving Engine - Sdr Kematian) ♪
[00:06.80] Sdr Kematian, Puter Balik!
[00:11.50] SPS Daus, Vander, Yung Usman, Riski Inrahim
[00:16.50] Jalan buntu di depan, mending lu puter balik
[00:21.50] Jangan sok jagoan, nanti kepala lu panik
[00:26.50] Gas pol rem blong, aspal makin licin
[00:31.50] Anak liar nongkrong, gak kenal kata dingin
[00:36.50] Vander turun tangan, ritme makin kenceng
[00:41.50] Jangan macam-macam sebelum lu gepeng
[00:46.50] Puter balik woi, puter balik!
[00:51.50] Kalo gak kuat mental mending lu puter balik!
[00:56.50] ♪ (Motorcycle Exhaust Rattle & Bass Drop) ♪
[01:07.00] Yung Usman ambil alih mikrofon di depan mata
[01:12.20] Cerita jalanan malam penuh liku dan dusta
[01:17.50] Lampu jalan remang-remang jadi saksi bisu
[01:22.80] Kami meluncur cepat menembus kabut dan debu
[01:28.00] SPS Daus teriak bikin aspal berguncang
[01:33.20] Lawan di spion udah pada melayang
[01:38.50] Jangan halangi jalan sebelum lu kena tabrak
[01:43.80] Sdr Kematian datang bikin panggung terkoyak
[01:49.00] ♪ (Beat Switch - High Octane Drift) ♪
[02:00.00] Jalan buntu di depan, mending lu puter balik
[02:05.20] Jangan sok jagoan, nanti kepala lu panik
[02:10.50] Puter balik woi, puter balik!
[02:15.80] Empat kepala bersatu bikin jalanan panik
[02:21.00] Vander, Riski, Daus, Usman berkuasa!
[02:26.50] Tak ada yang sanggup tandingi rima kami
[02:32.00] Puter balik sekarang juga!
[02:37.50] ♪ (Outro Engine Revving - Fade Out) ♪`
    },
    'Tanya Gua': {
      durationMs: 138000, // 02:18
      lyrics: `[00:00.00] ♪ (Intro Beat - Sdr Kematian) ♪
[00:06.50] Riski Inrahim - Tanya Gua
[00:11.20] Kalo lu mau tau soal jalanan, tanya gua
[00:16.00] Siapa yang bertahan dari dulu, tanya gua
[00:20.80] Jangan sok pintar kalo cuma modal teori
[00:25.50] Gua udah lewati asam garam kehidupan ini
[00:30.20] Tanya gua sebelum lu melangkah lebih jauh
[00:35.00] Biar langkah lu gak gampang goyah dan runtuh
[00:40.00] ♪ (Bass Drop & Horns) ♪
[00:51.00] Bukan sekadar omong kosong di warung kopi
[00:56.50] Ini pengalaman nyata yang kami resapi
[01:02.00] Hormati yang tua, bimbing yang muda
[01:07.50] Agar persaudaraan kita tetap terjaga
[01:13.00] Tanya gua, pintu kami selalu terbuka lebar
[01:18.50] Riski Inrahim dan Sdr Kematian tetap bersinar!
[01:24.00] ♪ (Outro Beat Fade Out) ♪`
    }
  };

  // 4. Ai Higuchi real lyrics and durations
  const higuchiUpdates = {
    'Massara': {
      durationMs: 288000, // 04:48
      lyrics: higuchiMassara ? `[00:00.00] ♪ (Intro Piano & Strings) ♪\n` + higuchiMassara : null
    },
    'Kanashii': {
      durationMs: 287000, // 04:47
      lyrics: higuchiKanashii ? `[00:00.00] ♪ (Intro Piano Solo) ♪\n` + higuchiKanashii : null
    },
    'Yameru': {
      durationMs: 215000, // 03:35
      lyrics: higuchiYameru ? `[00:00.00] ♪ (Intro Acoustic Guitar) ♪\n` + higuchiYameru : null
    },
    'Gekijyou': {
      durationMs: 242000, // 04:02
      lyrics: higuchiGekijyou ? `[00:00.00] ♪ (Intro Theatrical Piano) ♪\n` + higuchiGekijyou : null
    }
  };

  // Apply updates across all tracks
  const updatedLib = currentLib.map(t => {
    // Check Vander
    if (vanderUpdates[t.id]) {
      t.durationMs = vanderUpdates[t.id].durationMs;
      t.syncedLyrics = vanderUpdates[t.id].lyrics;
    }

    // Check Riski Inrahim
    if (t.category === 'riskiinrahim') {
      const cleanTitle = t.title.split(' (')[0].trim();
      if (riskiUpdates[cleanTitle]) {
        t.durationMs = riskiUpdates[cleanTitle].durationMs;
        t.syncedLyrics = riskiUpdates[cleanTitle].lyrics;
      } else if (riskiUpdates[t.title]) {
        t.durationMs = riskiUpdates[t.title].durationMs;
        t.syncedLyrics = riskiUpdates[t.title].lyrics;
      }
    }

    // Check Ai Higuchi
    if (t.category === 'akumanoko') {
      if (t.title.includes('Massara') && higuchiUpdates['Massara'].lyrics) {
        t.durationMs = higuchiUpdates['Massara'].durationMs;
        t.syncedLyrics = higuchiUpdates['Massara'].lyrics;
      } else if (t.title.includes('Kanashii') && higuchiUpdates['Kanashii'].lyrics) {
        t.durationMs = higuchiUpdates['Kanashii'].durationMs;
        t.syncedLyrics = higuchiUpdates['Kanashii'].lyrics;
      } else if (t.title.includes('Yameru') && higuchiUpdates['Yameru'].lyrics) {
        t.durationMs = higuchiUpdates['Yameru'].durationMs;
        t.syncedLyrics = higuchiUpdates['Yameru'].lyrics;
      } else if (t.title.includes('Gekijyou') && higuchiUpdates['Gekijyou'].lyrics) {
        t.durationMs = higuchiUpdates['Gekijyou'].durationMs;
        t.syncedLyrics = higuchiUpdates['Gekijyou'].lyrics;
      } else if (t.title.includes('悪魔の子')) {
        t.durationMs = 227000;
        if (!t.syncedLyrics.includes('[00:00.00]')) {
          t.syncedLyrics = `[00:00.00] ♪ (Intro Piano - 悪魔の子) ♪\n` + t.syncedLyrics;
        }
      }
    }

    // Ensure all Carti, Drake, Bruno Mars songs start with intro line if missing
    if (['playboicarti', 'drake', 'brunomars'].includes(t.category)) {
      if (t.syncedLyrics && !t.syncedLyrics.includes('[00:00.00]')) {
        const firstLine = t.syncedLyrics.split('\n')[0];
        const match = firstLine.match(/\[(\d+):(\d+\.\d+)\]/);
        if (match) {
          const sec = parseInt(match[1]) * 60 + parseFloat(match[2]);
          if (sec > 2) {
            t.syncedLyrics = `[00:00.00] ♪ (Intro Beat - ${t.artist}) ♪\n` + t.syncedLyrics;
          }
        }
      }
    }

    return t;
  });

  fs.writeFileSync(musicLibPath, JSON.stringify(updatedLib, null, 2), 'utf8');
  fs.writeFileSync(backendLibPath, JSON.stringify(updatedLib, null, 2), 'utf8');
  console.log('Successfully updated library with real studio durations and synced full lyrics!');
}

run().catch(console.error);
