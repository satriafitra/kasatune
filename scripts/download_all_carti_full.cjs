const fs = require('fs');
const https = require('https');
const path = require('path');

const targetDir = 'public/audio/carti';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const cartiTracksToDownload = [
  {
    id: 'carti-1189531062',
    title: 'Rockstar Made',
    file: 'rockstar_made.m4a',
    url: 'https://archive.org/download/06.-m-3tamorphosis/01.%20Rockstar%20Made.m4a'
  },
  {
    id: 'carti-1189531072',
    title: 'Go2DaMoon',
    file: 'go2damoon.m4a',
    url: 'https://archive.org/download/06.-m-3tamorphosis/02.%20Go2DaMoon.m4a'
  },
  {
    id: 'carti-1189531082',
    title: 'Stop Breathing',
    file: 'stop_breathing.m4a',
    url: 'https://archive.org/download/06.-m-3tamorphosis/03.%20Stop%20Breathing.m4a'
  },
  {
    id: 'carti-1189531092',
    title: 'Beno!',
    file: 'beno.m4a',
    url: 'https://archive.org/download/06.-m-3tamorphosis/04.%20Beno!.m4a'
  },
  {
    id: 'carti-1189531102',
    title: 'JumpOutTheHouse',
    file: 'jumpoutthehouse.m4a',
    url: 'https://archive.org/download/06.-m-3tamorphosis/05.%20JumpOutTheHouse.m4a'
  },
  {
    id: 'carti-1189531112',
    title: 'M3tamorphosis',
    file: 'm3tamorphosis.m4a',
    url: 'https://archive.org/download/06.-m-3tamorphosis/06.%20M3tamorphosis.m4a'
  },
  {
    id: 'carti-1189531122',
    title: 'Slay3r',
    file: 'slay3r.m4a',
    url: 'https://archive.org/download/06.-m-3tamorphosis/07.%20Slay3r.m4a'
  },
  {
    id: 'carti-1189531132',
    title: 'No Sl33p',
    file: 'no_sl33p.m4a',
    url: 'https://archive.org/download/06.-m-3tamorphosis/08.%20No%20Sl33p.m4a'
  },
  {
    id: 'carti-1189531142',
    title: 'New Tank',
    file: 'new_tank.m4a',
    url: 'https://archive.org/download/06.-m-3tamorphosis/09.%20New%20Tank.m4a'
  },
  {
    id: 'carti-1189531152',
    title: 'Teen X',
    file: 'teen_x.m4a',
    url: 'https://archive.org/download/06.-m-3tamorphosis/10.%20Teen%20X.m4a'
  },
  {
    id: 'carti-1189531162',
    title: 'Meh',
    file: 'meh.m4a',
    url: 'https://archive.org/download/06.-m-3tamorphosis/11.%20Meh.m4a'
  },
  {
    id: 'carti-1189531172',
    title: 'Vamp Anthem',
    file: 'vamp_anthem.m4a',
    url: 'https://archive.org/download/06.-m-3tamorphosis/12.%20Vamp%20Anthem.m4a'
  },
  {
    id: 'carti-1189531182',
    title: 'New N3on',
    file: 'new_n3on.m4a',
    url: 'https://archive.org/download/06.-m-3tamorphosis/13.%20New%20N3on.m4a'
  },
  {
    id: 'carti-1189531192',
    title: 'Control',
    file: 'control.m4a',
    url: 'https://archive.org/download/06.-m-3tamorphosis/14.%20Control.m4a'
  },
  {
    id: 'carti-347376721',
    title: 'Magnolia',
    file: 'magnolia.m4a',
    url: 'https://archive.org/download/14-kelly-k_202603/02%20Magnolia.m4a'
  },
  {
    id: 'carti-497467102',
    title: 'Shoota',
    file: 'shoota.mp3',
    url: 'https://archive.org/download/dielit/Shoota.mp3'
  },
  {
    id: 'carti-497467062',
    title: 'R.I.P.',
    file: 'rip.mp3',
    url: 'https://archive.org/download/dielit/R.I.P..mp3'
  }
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 100000) {
      console.log(`[Already Exists] ${path.basename(destPath)} (${(fs.statSync(destPath).size / 1024 / 1024).toFixed(2)} MB)`);
      return resolve(true);
    }

    const request = (targetUrl) => {
      https.get(targetUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return request(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download ${targetUrl}, status code: ${res.statusCode}`));
        }

        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          const stat = fs.statSync(destPath);
          console.log(`[Downloaded] ${path.basename(destPath)} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
          resolve(true);
        });
      }).on('error', (err) => {
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      });
    };

    request(url);
  });
}

async function run() {
  console.log(`Starting download for ${cartiTracksToDownload.length} Playboi Carti tracks...`);
  for (let i = 0; i < cartiTracksToDownload.length; i++) {
    const track = cartiTracksToDownload[i];
    const dest = path.join(targetDir, track.file);
    try {
      console.log(`(${i + 1}/${cartiTracksToDownload.length}) Downloading ${track.title}...`);
      await downloadFile(track.url, dest);
    } catch (err) {
      console.error(`Error downloading ${track.title}:`, err.message);
    }
  }

  console.log('All downloads completed! Updating music_library.json...');
  const musicLibPath = 'src/data/music_library.json';
  const backendLibPath = 'backend/music_library.json';

  const lib = JSON.parse(fs.readFileSync(musicLibPath, 'utf8'));

  for (const track of lib) {
    const match = cartiTracksToDownload.find(t => t.id === track.id);
    if (match) {
      const localFile = path.join(targetDir, match.file);
      if (fs.existsSync(localFile) && fs.statSync(localFile).size > 100000) {
        track.previewUrl = `/audio/carti/${match.file}`;
        track.category = 'playboicarti';
        console.log(`Updated ${track.title} previewUrl -> ${track.previewUrl}`);
      }
    }
  }

  fs.writeFileSync(musicLibPath, JSON.stringify(lib, null, 2), 'utf8');
  if (fs.existsSync(backendLibPath)) {
    fs.writeFileSync(backendLibPath, JSON.stringify(lib, null, 2), 'utf8');
  }

  console.log('Successfully updated both music_library.json files with local Playboi Carti audio paths!');
}

run().catch(console.error);
