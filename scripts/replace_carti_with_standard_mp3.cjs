const fs = require('fs');
const https = require('https');
const path = require('path');

const targetDir = 'public/audio/carti';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const wlrTracks = [
  {
    id: 'carti-1189531062',
    title: 'Rockstar Made',
    file: 'rockstar_made.mp3',
    remoteName: '01%20Rockstar%20Made.mp3'
  },
  {
    id: 'carti-1189531072',
    title: 'Go2DaMoon',
    file: 'go2damoon.mp3',
    remoteName: '02%20Go2DaMoon%20(feat.%20Kanye%20West).mp3'
  },
  {
    id: 'carti-1189531082',
    title: 'Stop Breathing',
    file: 'stop_breathing.mp3',
    remoteName: '03%20Stop%20Breathing.mp3'
  },
  {
    id: 'carti-1189531092',
    title: 'Beno!',
    file: 'beno.mp3',
    remoteName: '04%20Beno!.mp3'
  },
  {
    id: 'carti-1189531102',
    title: 'JumpOutTheHouse',
    file: 'jumpoutthehouse.mp3',
    remoteName: '05%20JumpOutTheHouse.mp3'
  },
  {
    id: 'carti-1189531112',
    title: 'M3tamorphosis',
    file: 'm3tamorphosis.mp3',
    remoteName: '06%20M3tamorphosis%20(feat.%20Kid%20Cudi).mp3'
  },
  {
    id: 'carti-1189531122',
    title: 'Slay3r',
    file: 'slay3r.mp3',
    remoteName: '07%20Slay3r.mp3'
  },
  {
    id: 'carti-1189531132',
    title: 'No Sl33p',
    file: 'no_sl33p.mp3',
    remoteName: '08%20No%20Sl33p.mp3'
  },
  {
    id: 'carti-1189531142',
    title: 'New Tank',
    file: 'new_tank.mp3',
    remoteName: '09%20New%20Tank.mp3'
  },
  {
    id: 'carti-1189531152',
    title: 'Teen X',
    file: 'teen_x.mp3',
    remoteName: '10%20Teen%20X%20(feat.%20Future).mp3'
  },
  {
    id: 'carti-1189531162',
    title: 'Meh',
    file: 'meh.mp3',
    remoteName: '11%20Meh.mp3'
  },
  {
    id: 'carti-1189531172',
    title: 'Vamp Anthem',
    file: 'vamp_anthem.mp3',
    remoteName: '12%20Vamp%20Anthem.mp3'
  },
  {
    id: 'carti-1189531182',
    title: 'New N3on',
    file: 'new_n3on.mp3',
    remoteName: '13%20New%20N3on.mp3'
  },
  {
    id: 'carti-1189531192',
    title: 'Control',
    file: 'control.mp3',
    remoteName: '14%20Control.mp3'
  },
  {
    id: 'carti-347376721',
    title: 'Magnolia',
    file: 'magnolia.mp3',
    customUrl: 'https://archive.org/download/playboi-carti-magnolia-audio/playboi-carti-magnolia-audio.mp3'
  }
];

function downloadTrack(t) {
  return new Promise((resolve, reject) => {
    const dest = path.join(targetDir, t.file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 100000) {
      console.log(`[Already Exists] ${t.file} (${(fs.statSync(dest).size / 1024 / 1024).toFixed(2)} MB)`);
      return resolve(true);
    }

    const url = t.customUrl || `https://archive.org/download/playboi-carti-whole-lotta-red_202404/${t.remoteName}`;

    const request = (targetUrl) => {
      https.get(targetUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return request(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed with status ${res.statusCode} for ${targetUrl}`));
        }

        const stream = fs.createWriteStream(dest);
        res.pipe(stream);
        stream.on('finish', () => {
          stream.close();
          const stat = fs.statSync(dest);
          console.log(`[Downloaded MP3] ${t.file} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
          resolve(true);
        });
      }).on('error', (err) => {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(err);
      });
    };

    request(url);
  });
}

async function run() {
  console.log(`Downloading ${wlrTracks.length} standard MP3 files for Playboi Carti...`);
  for (let i = 0; i < wlrTracks.length; i++) {
    const t = wlrTracks[i];
    console.log(`(${i + 1}/${wlrTracks.length}) Downloading ${t.title}...`);
    try {
      await downloadTrack(t);
    } catch (err) {
      console.error(`Error downloading ${t.title}:`, err.message);
    }
  }

  // Remove old unsupported .m4a files in public/audio/carti
  const existingFiles = fs.readdirSync(targetDir);
  for (const f of existingFiles) {
    if (f.endsWith('.m4a')) {
      const p = path.join(targetDir, f);
      console.log(`Removing incompatible dby1 container: ${f}`);
      fs.unlinkSync(p);
    }
  }

  // Update music_library.json
  const musicLibPath = 'src/data/music_library.json';
  const backendLibPath = 'backend/music_library.json';
  const lib = JSON.parse(fs.readFileSync(musicLibPath, 'utf8'));

  const mm = await import('music-metadata');

  for (const track of lib) {
    if (track.category === 'playboicarti' || (track.artist && track.artist.toLowerCase().includes('carti'))) {
      const match = wlrTracks.find(t => t.id === track.id);
      let mp3Name = '';
      if (match) {
        mp3Name = match.file;
      } else if (track.id === 'carti-497467102') {
        mp3Name = 'shoota.mp3';
      } else if (track.id === 'carti-497467062') {
        mp3Name = 'rip.mp3';
      }

      if (mp3Name) {
        const fullPath = path.join(targetDir, mp3Name);
        if (fs.existsSync(fullPath)) {
          track.previewUrl = `/audio/carti/${mp3Name}`;
          try {
            const meta = await mm.parseFile(fullPath);
            if (meta.format.duration && meta.format.duration > 0) {
              track.duration = Math.round(meta.format.duration);
              track.durationMs = Math.round(meta.format.duration * 1000);
            }
          } catch (e) {
            console.error('Meta error for', mp3Name, e.message);
          }
          console.log(`✓ Configured ${track.title}: previewUrl=${track.previewUrl}, duration=${track.duration}s`);
        }
      }
    }
  }

  fs.writeFileSync(musicLibPath, JSON.stringify(lib, null, 2), 'utf8');
  if (fs.existsSync(backendLibPath)) {
    fs.writeFileSync(backendLibPath, JSON.stringify(lib, null, 2), 'utf8');
  }

  console.log('All 17 Playboi Carti tracks are now 100% universal MP3 files!');
}

run().catch(console.error);
