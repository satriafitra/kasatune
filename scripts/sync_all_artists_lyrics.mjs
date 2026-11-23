import fs from 'fs';

async function fetchLrc(artist, title) {
  try {
    // Try exact get first
    const getUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    const res = await fetch(getUrl, { headers: { 'User-Agent': 'Webtify/1.0' } });
    if (res.ok) {
      const d = await res.json();
      if (d.syncedLyrics && d.syncedLyrics.length > 20) {
        return { synced: d.syncedLyrics, plain: d.plainLyrics, duration: d.duration };
      }
    }
  } catch (e) {}

  try {
    // Try search query fallback
    const q = `${artist} ${title}`;
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`;
    const res = await fetch(searchUrl, { headers: { 'User-Agent': 'Webtify/1.0' } });
    if (res.ok) {
      const items = await res.json();
      const match = items.find(i => i.syncedLyrics && i.syncedLyrics.length > 20);
      if (match) {
        return { synced: match.syncedLyrics, plain: match.plainLyrics, duration: match.duration };
      }
    }
  } catch (e) {}

  return null;
}

const vanderDurations = {
  'KING MOKONDO': 244,
  'Bencana Alam': 90,
  'Balikan (feat. Chaeroel)': 148,
  'Bales Keroyok (feat. Vander)': 135,
  'Puter Balik (feat. SPS Daus, Vander & Yung Usman)': 205,
  'Kampungan': 117,
  'Agak Laen': 85,
  'pantai selatan': 91,
  'batu ponari': 91,
  'gaya gua': 132
};

const riskiDurations = {
  'Malay': 140,
  'Kebakaran': 96,
  'Akhir Dunia': 204,
  'Semua Perek Mati': 119,
  'Puter Balik': 205,
  'Dinamo Setan': 162,
  'DI Block Bapak': 170,
  'Wayang Alif vs Syachrizal': 151,
  'Gasing': 189,
  'Marapthon': 137,
  'Paling Panjang': 248,
  'Tanya Gua': 138,
  'Bales Keroyok': 135
};

const higuchiDurations = {
  '悪魔の子 (Akuma no Ko)': 271,
  'まっさらな大地 (Massara na Daichi)': 289,
  '悲しい歌がある理由 (Kanashii Uta ga Aru Riyuu)': 283,
  'やめるなら今 (Yamerunara Ima)': 286,
  '劇場 (Gekijyou)': 363,
  '悪魔の子 - From THE FIRST TAKE': 332
};

async function main() {
  const libPath = 'src/data/music_library.json';
  const backendLibPath = 'backend/music_library.json';
  const lib = JSON.parse(fs.readFileSync(libPath, 'utf8'));

  console.log('=== Step 1: Updating Vander Durations ===');
  for (const track of lib) {
    if (track.artist === 'vander!' && vanderDurations[track.title]) {
      track.duration = vanderDurations[track.title];
      console.log(`  [VANDER] ${track.title} -> ${track.duration}s`);
    }
  }

  console.log('\n=== Step 2: Updating Riski Inrahim Durations ===');
  for (const track of lib) {
    if (track.artist === 'Riski Inrahim' && riskiDurations[track.title]) {
      track.duration = riskiDurations[track.title];
      console.log(`  [RISKI] ${track.title} -> ${track.duration}s`);
    }
  }

  console.log('\n=== Step 3: Updating Ai Higuchi Durations ===');
  for (const track of lib) {
    if (track.artist.includes('Higuchi') && higuchiDurations[track.title]) {
      track.duration = higuchiDurations[track.title];
      console.log(`  [HIGUCHI] ${track.title} -> ${track.duration}s`);
    }
  }

  console.log('\n=== Step 4: Updating Bruno Mars Lyrics & Durations ===');
  for (const track of lib) {
    if (track.artist === 'Bruno Mars') {
      const lrc = await fetchLrc('Bruno Mars', track.title);
      if (lrc) {
        track.syncedLyrics = lrc.synced;
        if (lrc.plain) track.plainLyrics = lrc.plain;
        track.duration = Math.round(lrc.duration);
        console.log(`  [BRUNO] ${track.title} synced (${track.duration}s)`);
      }
    }
  }

  console.log('\n=== Step 5: Updating Drake Lyrics & Durations ===');
  for (const track of lib) {
    if (track.artist === 'Drake') {
      const lrc = await fetchLrc('Drake', track.title);
      if (lrc) {
        track.syncedLyrics = lrc.synced;
        if (lrc.plain) track.plainLyrics = lrc.plain;
        track.duration = Math.round(lrc.duration);
        console.log(`  [DRAKE] ${track.title} synced (${track.duration}s)`);
      }
    }
  }

  console.log('\n=== Step 6: Updating Playboi Carti Lyrics & Durations ===');
  for (const track of lib) {
    if (track.artist === 'Playboi Carti') {
      const lrc = await fetchLrc('Playboi Carti', track.title);
      if (lrc) {
        track.syncedLyrics = lrc.synced;
        if (lrc.plain) track.plainLyrics = lrc.plain;
        track.duration = Math.round(lrc.duration);
        console.log(`  [CARTI] ${track.title} synced (${track.duration}s)`);
      }
    }
  }

  fs.writeFileSync(libPath, JSON.stringify(lib, null, 2), 'utf8');
  if (fs.existsSync(backendLibPath)) {
    fs.writeFileSync(backendLibPath, JSON.stringify(lib, null, 2), 'utf8');
  }
  console.log('\nAll libraries successfully updated and synchronized!');
}

main().catch(console.error);
