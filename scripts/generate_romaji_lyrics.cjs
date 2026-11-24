const fs = require('fs');
const Kuroshiro = require('kuroshiro');
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');
const romanize = require('romanize-korean');

const hasHangul = s => /[\uac00-\ud7af\u1100-\u11ff]/.test(s || '');
const hasKana = s => /[\u3040-\u30ff]/.test(s || '');
const hasKanji = s => /[\u4e00-\u9faf]/.test(s || '');
const isLatinOnly = s => /^[a-zA-Z0-9\s.,!?'"~`@#$%^&*()_+\-=[\]{}|;:<>/\\♪…–—]+$/.test((s || '').trim());

function cleanRomaji(text) {
  return (text || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([?!,.])/g, '$1')
    .trim();
}

async function main() {
  console.log('=== Initializing Kuroshiro with Kuromoji Analyzer ===');
  const kuroshiro = new Kuroshiro.default();
  await kuroshiro.init(new KuromojiAnalyzer());
  console.log('Kuroshiro initialized successfully!\n');

  const libPath = 'src/data/music_library.json';
  const backendLibPath = 'backend/music_library.json';

  const lib = JSON.parse(fs.readFileSync(libPath, 'utf8'));

  let processedCount = 0;

  for (let i = 0; i < lib.length; i++) {
    const track = lib[i];
    const fullText = (track.syncedLyrics || '') + ' ' + (track.plainLyrics || '');

    const isKorean = hasHangul(fullText);
    const isJapanese = hasKana(fullText) || (hasKanji(fullText) && (track.artist.includes('Higuchi') || track.artist.includes('JKT48') || track.artist.includes('ヒグチアイ')));

    if (!isKorean && !isJapanese) {
      continue;
    }

    processedCount++;
    console.log(`[${processedCount}] Processing ${isKorean ? 'KR' : 'JP'}: ${track.artist} - ${track.title}`);

    // 1. Process syncedLyrics
    if (track.syncedLyrics) {
      const rawLines = track.syncedLyrics.split('\n');
      const timeRegex = /^(\[\d{2}:\d{2}(?:\.\d{2,3})?\])(.*)$/;

      const parsed = [];
      for (const line of rawLines) {
        const match = line.trim().match(timeRegex);
        if (match) {
          parsed.push({ timeTag: match[1], text: match[2].trim() });
        }
      }

      const outputLines = [];
      for (let j = 0; j < parsed.length; j++) {
        const curr = parsed[j];
        const next = parsed[j + 1];

        // Check if next line is already a Romanized pair with same timestamp
        const hasNextPair = next && next.timeTag === curr.timeTag && isLatinOnly(next.text);

        outputLines.push(`${curr.timeTag} ${curr.text}`);

        if (hasNextPair) {
          // Already has romanization line
          outputLines.push(`${next.timeTag} ${next.text}`);
          j++; // skip next
          continue;
        }

        // Generate Romanization if line contains Korean or Japanese
        if (isKorean && hasHangul(curr.text)) {
          const romaji = cleanRomaji(romanize(curr.text));
          if (romaji && romaji !== curr.text) {
            outputLines.push(`${curr.timeTag} ${romaji}`);
          }
        } else if (isJapanese && (hasKana(curr.text) || hasKanji(curr.text))) {
          const rawRomaji = await kuroshiro.convert(curr.text, { to: 'romaji', mode: 'spaced', romajiSystem: 'hepburn' });
          const romaji = cleanRomaji(rawRomaji);
          if (romaji && romaji !== curr.text) {
            outputLines.push(`${curr.timeTag} ${romaji}`);
          }
        }
      }

      track.syncedLyrics = outputLines.join('\n');
    }

    // 2. Process plainLyrics
    if (track.plainLyrics) {
      const rawLines = track.plainLyrics.split('\n');
      const outputPlain = [];

      for (let j = 0; j < rawLines.length; j++) {
        const line = rawLines[j].trim();
        if (!line) {
          outputPlain.push('');
          continue;
        }

        outputPlain.push(line);

        const next = rawLines[j + 1]?.trim();
        const hasNextPair = next && isLatinOnly(next);

        if (hasNextPair) {
          outputPlain.push(next);
          j++;
          continue;
        }

        if (isKorean && hasHangul(line)) {
          const romaji = cleanRomaji(romanize(line));
          if (romaji && romaji !== line) {
            outputPlain.push(romaji);
          }
        } else if (isJapanese && (hasKana(line) || hasKanji(line))) {
          const rawRomaji = await kuroshiro.convert(line, { to: 'romaji', mode: 'spaced', romajiSystem: 'hepburn' });
          const romaji = cleanRomaji(rawRomaji);
          if (romaji && romaji !== line) {
            outputPlain.push(romaji);
          }
        }
      }

      track.plainLyrics = outputPlain.join('\n');
    }
  }

  console.log(`\nWriting updated libraries (${processedCount} tracks updated)...`);
  fs.writeFileSync(libPath, JSON.stringify(lib, null, 2), 'utf8');
  fs.writeFileSync(backendLibPath, JSON.stringify(lib, null, 2), 'utf8');
  console.log('Successfully saved to both src/data/music_library.json and backend/music_library.json!');
}

main().catch(console.error);
