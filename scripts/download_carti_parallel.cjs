const fs = require('fs');
const https = require('https');
const path = require('path');

const targetDir = 'public/audio/carti';

const allTracks = [
  { id: 'carti-1189531062', file: 'rockstar_made.mp3', url: 'https://archive.org/download/playboi-carti-whole-lotta-red_202404/01%20Rockstar%20Made.mp3' },
  { id: 'carti-1189531072', file: 'go2damoon.mp3', url: 'https://archive.org/download/playboi-carti-whole-lotta-red_202404/02%20Go2DaMoon%20(feat.%20Kanye%20West).mp3' },
  { id: 'carti-1189531082', file: 'stop_breathing.mp3', url: 'https://archive.org/download/playboi-carti-whole-lotta-red_202404/03%20Stop%20Breathing.mp3' },
  { id: 'carti-1189531092', file: 'beno.mp3', url: 'https://archive.org/download/playboi-carti-whole-lotta-red_202404/04%20Beno!.mp3' },
  { id: 'carti-1189531102', file: 'jumpoutthehouse.mp3', url: 'https://archive.org/download/playboi-carti-whole-lotta-red_202404/05%20JumpOutTheHouse.mp3' },
  { id: 'carti-1189531112', file: 'm3tamorphosis.mp3', url: 'https://archive.org/download/playboi-carti-whole-lotta-red_202404/06%20M3tamorphosis%20(feat.%20Kid%20Cudi).mp3' },
  { id: 'carti-1189531122', file: 'slay3r.mp3', url: 'https://archive.org/download/playboi-carti-whole-lotta-red_202404/07%20Slay3r.mp3' },
  { id: 'carti-1189531132', file: 'no_sl33p.mp3', url: 'https://archive.org/download/playboi-carti-whole-lotta-red_202404/08%20No%20Sl33p.mp3' },
  { id: 'carti-1189531142', file: 'new_tank.mp3', url: 'https://archive.org/download/playboi-carti-whole-lotta-red_202404/09%20New%20Tank.mp3' },
  { id: 'carti-1189531152', file: 'teen_x.mp3', url: 'https://archive.org/download/playboi-carti-whole-lotta-red_202404/10%20Teen%20X%20(feat.%20Future).mp3' },
  { id: 'carti-1189531162', file: 'meh.mp3', url: 'https://archive.org/download/playboi-carti-whole-lotta-red_202404/11%20Meh.mp3' },
  { id: 'carti-1189531172', file: 'vamp_anthem.mp3', url: 'https://archive.org/download/playboi-carti-whole-lotta-red_202404/12%20Vamp%20Anthem.mp3' },
  { id: 'carti-1189531182', file: 'new_n3on.mp3', url: 'https://archive.org/download/playboi-carti-whole-lotta-red_202404/13%20New%20N3on.mp3' },
  { id: 'carti-1189531192', file: 'control.mp3', url: 'https://archive.org/download/playboi-carti-whole-lotta-red_202404/14%20Control.mp3' },
  { id: 'carti-347376721', file: 'magnolia.mp3', url: 'https://archive.org/download/playboi-carti-magnolia-audio/playboi-carti-magnolia-audio.mp3' },
  { id: 'carti-497467102', file: 'shoota.mp3', url: 'https://archive.org/download/dielit/Shoota.mp3' },
  { id: 'carti-497467062', file: 'rip.mp3', url: 'https://archive.org/download/dielit/R.I.P..mp3' }
];

function downloadOne(t) {
  return new Promise((resolve, reject) => {
    const dest = path.join(targetDir, t.file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000000) {
      console.log(`[Already Exists] ${t.file} (${(fs.statSync(dest).size / 1024 / 1024).toFixed(2)} MB)`);
      return resolve(true);
    }

    const tmpDest = dest + '.tmp';
    const req = (targetUrl) => {
      https.get(targetUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return req(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Status ${res.statusCode} for ${targetUrl}`));
        }

        const s = fs.createWriteStream(tmpDest);
        res.pipe(s);
        s.on('finish', () => {
          s.close();
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          fs.renameSync(tmpDest, dest);
          console.log(`✓ [Downloaded] ${t.file} (${(fs.statSync(dest).size / 1024 / 1024).toFixed(2)} MB)`);
          resolve(true);
        });
      }).on('error', (err) => {
        if (fs.existsSync(tmpDest)) fs.unlinkSync(tmpDest);
        reject(err);
      });
    };
    req(t.url);
  });
}

// Download in parallel batches of 5
async function run() {
  console.log('Downloading missing tracks in parallel batches of 5...');
  const queue = [...allTracks];
  const workers = Array(5).fill(0).map(async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      try {
        await downloadOne(item);
      } catch (e) {
        console.error('Error for', item.file, e.message);
      }
    }
  });

  await Promise.all(workers);

  // Remove old .m4a files
  for (const f of fs.readdirSync(targetDir)) {
    if (f.endsWith('.m4a') || f.endsWith('.tmp')) {
      fs.unlinkSync(path.join(targetDir, f));
      console.log('Cleaned up:', f);
    }
  }

  // Update library
  const mm = await import('music-metadata');
  const libPath = 'src/data/music_library.json';
  const backendLibPath = 'backend/music_library.json';
  const lib = JSON.parse(fs.readFileSync(libPath, 'utf8'));

  for (const t of lib) {
    const match = allTracks.find(x => x.id === t.id);
    if (match) {
      const full = path.join(targetDir, match.file);
      if (fs.existsSync(full)) {
        t.previewUrl = `/audio/carti/${match.file}`;
        t.category = 'playboicarti';
        try {
          const meta = await mm.parseFile(full);
          if (meta.format.duration) {
            t.duration = Math.round(meta.format.duration);
            t.durationMs = Math.round(meta.format.duration * 1000);
          }
        } catch {}
      }
    }
  }

  fs.writeFileSync(libPath, JSON.stringify(lib, null, 2), 'utf8');
  if (fs.existsSync(backendLibPath)) {
    fs.writeFileSync(backendLibPath, JSON.stringify(lib, null, 2), 'utf8');
  }

  console.log('ALL PLAYBOI CARTI TRACKS CONVERTED AND SYNCED TO MP3 SUCCESSFULLY!');
}

run().catch(console.error);
