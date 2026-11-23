const { execSync } = require('child_process');
const fs = require('fs');

const musicLibPath = 'src/data/music_library.json';
const backendLibPath = 'backend/music_library.json';

// Get original lyrics and metadata from commit 2a7fc77
const prevJson = execSync('git show 2a7fc77:src/data/music_library.json', { maxBuffer: 10*1024*1024 }).toString();
const prevLib = JSON.parse(prevJson);
const prevVander = prevLib.filter(t => t.artist === 'vander!');

const currentLib = JSON.parse(fs.readFileSync(musicLibPath, 'utf8'));

let restored = 0;
for (const track of currentLib) {
  if (track.artist === 'vander!') {
    const original = prevVander.find(t => t.id === track.id);
    if (original) {
      track.syncedLyrics = original.syncedLyrics;
      track.plainLyrics = original.plainLyrics || original.syncedLyrics.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]\s*/g, '');
      track.duration = original.duration;
      track.durationMs = original.durationMs || (original.duration * 1000);
      track.bpm = original.bpm;
      restored++;
      console.log(`[RESTORED] ${track.title} (${track.duration}s, BPM: ${track.bpm})`);
    }
  }
}

fs.writeFileSync(musicLibPath, JSON.stringify(currentLib, null, 2), 'utf8');
if (fs.existsSync(backendLibPath)) {
  fs.writeFileSync(backendLibPath, JSON.stringify(currentLib, null, 2), 'utf8');
}

console.log(`\nSuccessfully restored all ${restored} original vander! lyrics and metadata!`);
