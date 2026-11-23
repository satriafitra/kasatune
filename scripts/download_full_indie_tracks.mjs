import { Ytdl } from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';

const vanderDownloads = [
  { id: 'N9JQy6_DraU', file: 'public/audio/vander/king_mokondo.m4a', mp3File: 'public/audio/vander/king_mokondo.mp3' },
  { id: '_8fMiExKZwE', file: 'public/audio/vander/bencana_alam.m4a', mp3File: 'public/audio/vander/bencana_alam.mp3' },
  { id: '2MBrMWEnd-Y', file: 'public/audio/vander/balikan.m4a', mp3File: 'public/audio/vander/balikan.mp3' },
  { id: 'CO13h1nrWP0', file: 'public/audio/vander/bales_keroyok.m4a', mp3File: 'public/audio/vander/bales_keroyok.mp3' },
  { id: 'uPCwy81aWts', file: 'public/audio/vander/puter_balik.m4a', mp3File: 'public/audio/vander/puter_balik.mp3' },
  { id: 'kt48srYsF2Q', file: 'public/audio/vander/kampungan.m4a', mp3File: 'public/audio/vander/kampungan.mp3' },
  { id: 'ZywMnL6Zvh4', file: 'public/audio/vander/agak_laen.m4a', mp3File: 'public/audio/vander/agak_laen.mp3' },
  { id: 'nMhZ9gZX-l8', file: 'public/audio/vander/pantai_selatan.m4a', mp3File: 'public/audio/vander/pantai_selatan.mp3' },
  { id: '4f5aev09mMA', file: 'public/audio/vander/batu_ponari.m4a', mp3File: 'public/audio/vander/batu_ponari.mp3' },
  { id: 'kYdwBxAmfBE', file: 'public/audio/vander/gaya_gua.m4a', mp3File: 'public/audio/vander/gaya_gua.mp3' }
];

const riskiDownloads = [
  { id: '6jrbNDMH_nI', file: 'public/audio/riski/malay.m4a', mp3File: 'public/audio/riski/malay.mp3' },
  { id: 'u7AmNs-HT_0', file: 'public/audio/riski/kebakaran.m4a', mp3File: 'public/audio/riski/kebakaran.mp3' },
  { id: 'YmVmAb-JOto', file: 'public/audio/riski/akhir_dunia.m4a', mp3File: 'public/audio/riski/akhir_dunia.mp3' },
  { id: '2pRBYUQglYQ', file: 'public/audio/riski/semua_perek_mati.m4a', mp3File: 'public/audio/riski/semua_perek_mati.mp3' },
  { id: 'uPCwy81aWts', file: 'public/audio/riski/puter_balik.m4a', mp3File: 'public/audio/riski/puter_balik.mp3' },
  { id: 'bYP-QhvDWAY', file: 'public/audio/riski/dinamo_setan.m4a', mp3File: 'public/audio/riski/dinamo_setan.mp3' },
  { id: 'wSbQ_qgWg0w', file: 'public/audio/riski/di_block_bapak.m4a', mp3File: 'public/audio/riski/di_block_bapak.mp3' },
  { id: 'XmuCaAoHfGo', file: 'public/audio/riski/wayang_alif_vs_syachrizal.m4a', mp3File: 'public/audio/riski/wayang_alif_vs_syachrizal.mp3' },
  { id: 'el0Ns7l5DMY', file: 'public/audio/riski/gasing.m4a', mp3File: 'public/audio/riski/gasing.mp3' },
  { id: 'x8qjAsWZALs', file: 'public/audio/riski/marapthon.m4a', mp3File: 'public/audio/riski/marapthon.mp3' },
  { id: 'bMpDTYYlh5o', file: 'public/audio/riski/paling_panjang.m4a', mp3File: 'public/audio/riski/paling_panjang.mp3' },
  { id: 'QWAK-IsEoP8', file: 'public/audio/riski/tanya_gua.m4a', mp3File: 'public/audio/riski/tanya_gua.mp3' },
  { id: 'CO13h1nrWP0', file: 'public/audio/riski/bales_keroyok.m4a', mp3File: 'public/audio/riski/bales_keroyok.mp3' }
];

async function downloadOne(ytdl, item) {
  const url = `https://www.youtube.com/watch?v=${item.id}`;
  try {
    const stream = await ytdl.download(url, { filter: { hasAudio: true, hasVideo: false } });
    const out = fs.createWriteStream(item.file);
    await new Promise((resolve, reject) => {
      stream.pipe(out);
      out.on('finish', resolve);
      out.on('error', reject);
      stream.on('error', reject);
    });
    // Also copy / overwrite the .mp3 file with this full audio stream so existing links immediately play full song
    fs.copyFileSync(item.file, item.mp3File);
    const sz = fs.statSync(item.file).size;
    console.log(`[DONE] ${path.basename(item.file)} -> ${(sz/1024/1024).toFixed(2)} MB`);
  } catch (e) {
    console.error(`[FAIL] ${item.file}:`, e.message);
  }
}

async function run() {
  const ytdl = new Ytdl();
  console.log('Downloading 10 full Vander tracks...');
  for (const item of vanderDownloads) {
    await downloadOne(ytdl, item);
  }
  console.log('\nDownloading 13 full Riski Inrahim tracks...');
  for (const item of riskiDownloads) {
    await downloadOne(ytdl, item);
  }
  console.log('\nAll local full audio downloads finished!');
}

run();
