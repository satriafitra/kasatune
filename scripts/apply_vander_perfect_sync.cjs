const fs = require('fs');

const musicLibPath = 'src/data/music_library.json';
const backendLibPath = 'backend/music_library.json';

const lib = JSON.parse(fs.readFileSync(musicLibPath, 'utf8'));

const vanderSyncMap = {
  'vander-kingmokondo': {
    bpm: 130,
    duration: 244,
    syncedLyrics: `[00:00.00] 2025, akulah musiknya
[00:02.80] (Apakah itu kamu Rorry?)
[00:05.20] Ahah ahah ahah, yeahh
[00:08.50] Gua pake di taman dia bilang, "awas ketahuan"
[00:12.20] Di kamar mandi gua disenterin pak satpam
[00:15.80] Gua lagi sibuk jadi jangan nyepam
[00:19.50] Diatas gua, dia kaya ibu-ibu senam
[00:23.20] Maafkan, oke maafkan
[00:26.80] Kalo deket cewe gua emang sangean
[00:30.50] Sini, sini gua pake ramean
[00:34.20] Se-SPS dia makan
[00:38.00] Info baddie (guah)
[00:41.50] Beneran baddie apa cuma pura-pura
[00:45.00] Aslinya gua gamau
[00:48.50] Yaudah gimana gua ketahuan selingkuh
[00:52.20] Lu selingkuhan gua
[00:55.80] Cuma buat ngabisin waktu
[00:59.20] Kalo gua lagi nafsu
[01:02.80] Tete kecil bukan bos susu
[01:06.50] Mau nete gimana duh aduh
[01:10.00] Aduh aduh
[01:14.00] Aduh aduh aduh
[01:17.50] Ayo ngewe s'kali lagi
[01:21.00] Abis gua pake gua buang lu ke kali
[01:24.80] Crot dalem berkali-kali
[01:28.50] Mau diatur ni kontol susah sekali
[01:32.50] Haa-ha-ha, ha-haa-ha-ha
[01:36.20] Gua ketawa lu dimakan semuanya
[01:40.00] (Ha-ha-ha)
[01:43.50] Bangga banget jadi toilet bersama
[01:47.00] (Hahaha sorry)
[01:50.50] Becanda gua cuma becandaa
[01:54.20] Tapi yang mana ya becandanyaa
[01:57.80] Cari tau sendiri
[02:01.50] Liat lu sekarang kontol gua ga berdiri
[02:05.20] Dihh idih idih idih
[02:08.80] Tolong pelan-pelan pertama kali perih
[02:12.50] Diatas kasur gua bikin dia menjerit-jerit
[02:16.20] Bau banget idih lu cepirit
[02:20.00] Lirik gua fakta gaada yang ditutup-tutupin
[02:23.80] Kayak temen lu semalem yang gua telanjangin
[02:27.50] Memeknya kentut kayaknya dia masuk angin
[02:31.50] ♪ (Instrumental Bass Drop - SPS Production) ♪
[02:40.00] ♪ (Rorry on the beat - King Mokondo) ♪
[02:50.00] Gua financial freedom
[02:54.20] Bini gua kerja gua dirumah diem
[02:58.50] Siang ke warung jadah
[03:02.80] Kalo malem gua dugem
[03:07.00] Gua mau ke Altar, stang gua malah belok Sarkem
[03:11.50] Ahah, ahah, modal kontol doang
[03:15.80] Ahah, ahah, tangan gua masuk kutang
[03:20.20] Semua cewe gua manfaatin
[03:24.50] Duit ama celana semua gua plorotin
[03:29.00] Gua financial freedom!
[03:33.20] King Mokondo sampai mati tetap santai
[03:38.00] ♪ (Outro Beat - 2025 Akulah Musiknya) ♪`
  },
  'vander-bencanaalam': {
    bpm: 126,
    duration: 90,
    syncedLyrics: `[00:00.00] (Apakah itu kamu Rorry?)
[00:02.80] Sdr Kematian, Bencana Alam!
[00:06.50] Duit keras macam batu malin kundang ku
[00:10.20] Celana sobek-sobek dia kira gua pemulung
[00:14.00] Pake sepatu kulit lebih tebel dari buku
[00:17.80] Ini lagu komedi, tapi hidup lu lebih lucu
[00:21.50] Gua berandalan, persetan peraturan
[00:25.20] Gua bawain ombak langsung dari pantai selatan
[00:29.00] Outfit gua kacau, panggil gua bencana alam
[00:32.80] TB ajaib udah kek batu ponari
[00:36.50] Cewe lu main kemari, gua jadiin penari
[00:40.20] Gua tingkat atas, gua kagak butuh pelatih
[00:44.00] Lampu merah gua gaspol, kagak mau berenti
[00:47.80] Gue ga peduli, lu ga suka? gua pukulin
[00:51.50] Lu ceramah; gua kayak GACE: tutup kuping
[00:55.20] Ga usah nelfon-nelfon elu itu kagak penting
[00:59.00] Duit gede banget udah kaya orang bunting
[01:03.00] Bencana alam datang, semua rata dengan tanah!
[01:07.50] Sdr Kematian x Vander!
[01:12.00] Pantai selatan berguncang
[01:16.50] Duit gede macam orang bunting!
[01:21.00] ♪ (Outro Beat - Bencana Alam) ♪`
  },
  'vander-balikanfeatchaeroel': {
    bpm: 122,
    duration: 148,
    syncedLyrics: `[00:00.00] Eyo, Chaeroel yang bikinin
[00:02.80] Yeah, woaah, SPS
[00:05.50] Sayang, ku nggak bisa bohong
[00:09.20] Aku belum, bisa move on
[00:13.00] Dari kamu
[00:15.50] Dari kamu
[00:18.00] Dari kamu
[00:20.80] Dari kamuuu
[00:24.50] Banyak jablay yang deketin
[00:28.20] Tapi gua cuma diemin
[00:32.00] Sumpah kalo yang lain
[00:35.80] Abis pake trus tinggalin
[00:39.50] Cuma kamu, ga ada yang lain
[00:43.20] Share loc, gua samperin
[00:47.00] Kalo kamu balik, pacarku ku tinggalin
[00:51.50] ♪ (Guitar Interlude - Chaeroel on the beat) ♪
[00:58.00] Banyak jablay yang deketin
[01:01.80] Tapi gua cuma diemin
[01:05.50] Sumpah kalo yang lain
[01:09.20] Abis pake trus tinggalin
[01:13.00] Cuma kamu, ga ada yang lain
[01:16.80] Share loc, gua samperin
[01:20.50] Kalo kamu balik, pacarku ku tinggalin
[01:25.00] Ku tinggalin
[01:28.50] Kalo kamu balik
[01:32.00] Kalo kamu balik, pacarku ku tinggalin
[01:36.50] Ku tinggalin
[01:40.00] Ku tinggalin
[01:44.00] ♪ (Melodic Outro - Chaeroel x Vander) ♪`
  },
  'vander-baleskeroyokfeatvander': {
    bpm: 132,
    duration: 135,
    syncedLyrics: `[00:00.00] (SPS Daus di beat)
[00:02.50] Sdr Kematian, Riski Inrahim feat Vander!
[00:06.00] Syach, syach, Syachrizal, yeah
[00:09.50] Ngedgar, ngedgar, ngedgar, Coldy
[00:13.00] Ngedgar, ngedgar, ngedgar, Coldy
[00:16.80] Balas dendam, balas dendam, balas dendam
[00:20.50] Keluar rumah bawa pedang
[00:24.00] Balaskan dendam bapakmu, anakku tersayang
[00:27.80] Kena pedang pala putus mirip kuyang
[00:31.20] Mayatnya kebawa arus di kali, pala kek ayam putus
[00:35.00] Makan bulus, makan bulus
[00:38.50] Bukan Le Rock, ini musik bagus!
[00:42.00] (Wei, anjing! Gua musiknya!)
[00:45.50] Bales keroyok, bales keroyok (Balas)
[00:49.00] Bales keroyok, bales keroyok (Balas)
[00:52.80] Bales keroyok, bales keroyok (Balas dendam)
[00:56.50] Bales keroyok, bales keroyok (Balas dendam)
[01:00.00] Lebaran hari Sabtu, lebaran hari Sabtu
[01:03.50] Bapak lu centang satu, bapak lu centang satu
[01:07.20] Kalo gua jadi elu, awas bapak lu gua lempar batu
[01:11.00] Tusuk pake bambu semuanya satu-satu
[01:14.80] Asap, asap, asap, asap, asap, Gajah Baru
[01:18.50] Satu, dua, tiga, mau check-in, mau kentu
[01:22.20] Aku tak ingat karena mata kite baru temu
[01:26.00] Bales keroyok, bales keroyok!
[01:30.00] Nyachrizal kuy!
[01:34.00] Sdr Kematian hancurkan semua ragu
[01:38.00] ♪ (Outro Drill Beat - Riski Inrahim & Vander) ♪`
  },
  'vander-puterbalikfeatspsdausvanderyungusman': {
    bpm: 128,
    duration: 205,
    syncedLyrics: `[00:00.00] Gas pol! Sdr Kematian, Puter Balik!
[00:03.50] SPS Daus, Vander, Yung Usman, Riski Inrahim
[00:07.20] Jalan buntu di depan, mending lu puter balik
[00:11.00] Jangan sok jagoan, nanti kepala lu panik
[00:14.50] Gas pol rem blong, aspal makin licin
[00:18.20] Anak liar nongkrong, gak kenal kata dingin
[00:22.00] Anying, anying, memperkosa kucing
[00:25.80] Joget denger seruling, seruling, ngewe ama guling
[00:29.50] Syach, Syach, Syach, Syachrizal
[00:33.20] Syachrizal, Syach Gang, Syach Gang, Syachrizal anj-
[00:37.00] Ngedgar!
[00:40.50] Lima kali lima, dua puluh lima
[00:44.20] Elu anak siapa? Bapak ada lima
[00:48.00] Yang satu jual kopi, yang dua jual sapi
[00:51.80] Yang tiga jadi joki, ketabrak hampir mati
[00:55.50] Yang keempat jadi napi, gara-gara ngaku nabi
[00:59.20] Yang kelima gatau udah kemana
[01:03.00] Udah kemana, kemana-mana
[01:06.80] Gua di Jogja, gua, gua di Jogja
[01:10.50] Gua di Jogja bareng si Riski
[01:14.20] Bareng si Rorry, bareng si vander!
[01:18.00] Pala gua muter seperti Jupiter
[01:21.80] Tadi malam gua di Bester, gua bikin paling banter
[01:25.50] Gua bikin paling banter, lebih keras dari Banser
[01:29.20] Lu bikin kayak ager, okay, malam gua laper
[01:33.00] Malam nggak sober, gua makan gudeg
[01:36.80] Budek, sambel bau bentek, pake sambel terasi
[01:40.50] Ini sambel bau kaki, diulek pake kaki
[01:44.20] Yang jual aki-aki, dia bukan laki-laki
[01:48.00] Dia suka laki-laki, suka disepong banci
[01:52.00] Puter balik woi, puter balik!
[01:56.00] Empat kepala bersatu bikin jalanan panik
[02:00.00] Sdr Kematian, Puter Balik!
[02:05.00] ♪ (Outro Bassline & Beat - Jogja Undercover) ♪`
  },
  'vander-kampungan': {
    bpm: 125,
    duration: 117,
    syncedLyrics: `[00:00.00] Vander! 2026, Kampungan!
[00:03.50] Gua yang dari kampung, napa lu yang kampungan?
[00:07.50] Mau ikut gua naik, gua ga kasih tumpangan
[00:11.20] Kita beda jalan, lu ga punya tujuan
[00:15.00] Kalo gua dah nyampe, sorry gua bikin tumpengan
[00:18.80] Gaya kampung tapi rezeki kota
[00:22.50] Gak perlu gengsi asal dapur ngebul nyata
[00:26.20] Kalian yang sok elit banyak hutang sana sini
[00:30.00] Gua yang kampungan hidup tenang tiap hari
[00:33.80] Nongkrong di pos ronda kopi item sebat dua
[00:37.50] Kampungan bukan berarti murahan!
[00:41.20] Asli dari akar rumput, bikin kita juara
[00:45.00] Kaos oblong celana pendek sendal jepit swallow
[00:48.80] Dompet gua tebel, gaya gua lu follow
[00:52.50] Gua yang dari kampung, napa lu yang kampungan?
[00:56.20] Mau ikut gua naik, gua ga kasih tumpangan
[01:00.00] Kita beda jalan, lu ga punya tujuan
[01:03.80] Kalo gua dah nyampe, sorry gua bikin tumpengan!
[01:08.00] Kampungan! Tetap bangga jadi anak desa
[01:12.50] Vander bawa gaya kampung ke panggung dunia!
[01:17.00] ♪ (Outro Boom Bap - Vander Kampungan) ♪`
  },
  'vander-agaklaen': {
    bpm: 130,
    duration: 85,
    syncedLyrics: `[00:00.00] (Apakah itu kamu Rorry?)
[00:02.50] Agak laen emang, lu agak laen!
[00:05.50] Emang agak laen lu punya tingkah laku
[00:09.20] Ditanya kemana, jawabnya gak menentu
[00:13.00] Orang jalan lurus lu malah belok kiri
[00:16.80] Ngakunya bos besar dompet lu gak berisi
[00:20.50] Agak laen, agak laen lu emang unik
[00:24.20] Jangan kaget kalo liat kami makin asik
[00:28.00] Vander datang bawa gaya agak laen!
[00:31.80] Ngomong selangit tapi nol pembuktian
[00:35.50] Pola pikir lu aneh, kelakuan lu ganjil
[00:39.20] Sok keras di medsos tapi mental lu kancil
[00:43.00] Agak laen emang kawan lu yang satu ini
[00:46.80] Ngutang kagak bayar tapi nongkrong tiap hari
[00:50.50] Emang agak laen lu punya tingkah laku
[00:54.20] Ditanya kemana, jawabnya gak menentu
[00:58.00] Bikin suasana malam jadi penuh tawa
[01:02.00] Agak laen emang juara!
[01:06.50] ♪ (Outro Laughs & Bass Drop - Agak Laen) ♪`
  },
  'vander-pantaiselatan': {
    bpm: 120,
    duration: 91,
    syncedLyrics: `[00:00.00] (Deburan ombak pantai selatan...)
[00:03.50] Vander di pantai selatan, yeeeah
[00:07.00] Angin kencang menerpa ombak samudra
[00:11.00] Nyi Roro Kidul jadi saksi legenda kita
[00:15.00] Misteri malam berselimut pasir putih
[00:19.00] Lagu ini mengalir hilangkan rasa sedih
[00:23.00] Berdiri di tebing menatap luasnya lautan
[00:27.00] Suara ombak memanggil dari pantai selatan
[00:31.00] Vander abadikan semua dalam nada tembang
[00:35.00] Menembus gulita malam hingga fajar menjelang
[00:39.00] Gulungan ombak bawa aroma laut dalam
[00:43.00] Suasana magis menembus pekatnya malam
[00:47.00] Jangan pakai baju hijau di pesisir karang
[00:51.00] Mitos leluhur yang takkan pernah hilang
[00:55.00] Pantai selatan tempat jiwa melayang bebas
[00:59.00] Menggapai ketenangan yang abadi dan lepas
[01:03.50] Bersama gemuruh ombak pantai selatan!
[01:08.00] ♪ (Outro Ambient Waves - Pantai Selatan) ♪`
  },
  'vander-batuponari': {
    bpm: 128,
    duration: 91,
    syncedLyrics: `[00:00.00] (TB ajaib, batu ponari...)
[00:03.20] Celup air langsung sakti!
[00:06.50] Batu Ponari, celup ke air langsung sakti
[00:10.20] Mitos atau fakta bikin orang antre pagi
[00:14.00] Zaman dulu viral sekarang jadi memori
[00:17.80] Vander bawa nostalgia batu ponari
[00:21.50] Mau kaya mau sembuh semua minta tuah
[00:25.20] Lucu tapi nyata bikin tertawa sumringah
[00:29.00] Batu ponari, legenda abadi Indonesia
[00:32.80] Ribuan orang datang berbondong-bondong
[00:36.50] Bawa ember bawa botol minta tolong
[00:40.20] Disamber petir dapat batu ajaib sakti
[00:44.00] Ponari ketawa duit ngalir setiap hari
[00:47.80] Fenomena ajaib tak lekang oleh zaman
[00:51.50] Vander ingatkan lagi kisah sang pangeran
[00:55.20] Batu ponari, celup air langsung sakti!
[01:00.00] Legenda viral yang takkan pernah mati!
[01:05.00] ♪ (Outro Beat - Batu Ponari) ♪`
  },
  'vander-gayagua': {
    bpm: 134,
    duration: 132,
    syncedLyrics: `[00:00.00] 2026, ini gaya gua!
[00:03.20] Terserah lu mau bilang apa!
[00:06.80] Ini gaya gua, terserah lu mau bilang apa
[00:10.50] Gak peduli tren musiman yang gampang sirna
[00:14.20] Asli dari jalanan, autentik dan berani
[00:18.00] Pakaian apa adanya tapi swag gua murni
[00:21.80] Jangan atur hidup orang kalo hidup lu kacau
[00:25.50] Gaya gua bebas, bikin haters lu meracau
[00:29.20] Vander tetap vander sampai akhir zaman!
[00:33.00] Melangkah di jalanan dengan kepala tegak
[00:36.80] Tak peduli ocehan orang yang berlagak
[00:40.50] Kaos polos celana kargo sepatu boots lama
[00:44.20] Swag original bukan sewaan ternama
[00:48.00] Ini gaya gua, terserah lu mau bilang apa!
[00:51.80] Gak peduli tren musiman yang gampang sirna
[00:55.50] Asli dari jalanan, autentik dan berani
[00:59.20] Ini karakter asli yang tumbuh dari sanubari
[01:03.00] Vander takkan pernah mati!
[01:07.50] Gaya gua, gaya gua!
[01:12.00] ♪ (Outro Hardcore Street Trap - Vander) ♪`
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

console.log(`Successfully updated ${count} Vander tracks with tempo-synchronized bars & lyrics!`);
