/**
 * LRC (Lyrics) File Parser and Time Utilities
 */

export interface LyricLine {
  id: string;
  timeMs: number;
  text: string;
  subText?: string;
}

/**
 * Parses an LRC formatted string into an array of LyricLine objects.
 * Automatically pairs dual-line lyrics (e.g. Japanese Kanji/Korean Hangul original + Romaji directly underneath).
 */
export function parseLrc(lrcContent: string | null | undefined): LyricLine[] {
  if (!lrcContent || typeof lrcContent !== 'string') {
    return [];
  }

  const lines = lrcContent.split('\n');
  const rawList: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  let lastTimeMs = -1;

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const matches = [...trimmed.matchAll(timeRegex)];
    if (matches.length === 0) {
      // Untimed line: if we just processed a timed line and it has no subText,
      // attach this untimed line as subText to the last item
      if (rawList.length > 0 && lastTimeMs !== -1 && !rawList[rawList.length - 1].subText && trimmed !== '♪') {
        rawList[rawList.length - 1].subText = trimmed;
      }
      return;
    }

    const text = trimmed.replace(timeRegex, '').trim();

    matches.forEach((match, matchIndex) => {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fractionStr = match[3] || '0';
      const fraction = fractionStr.length === 2 ? parseInt(fractionStr, 10) * 10 : parseInt(fractionStr, 10);

      const timeMs = minutes * 60 * 1000 + seconds * 1000 + fraction;
      lastTimeMs = timeMs;

      // Filter out credit header tags and metadata lines commonly found in raw LRC files
      if (
        timeMs === 0 &&
        (!text || /^(作词|作曲|编曲|制作人|词：|曲：|Written by|Produced by|Lyrics by|Composer|Producer|Arranger|Lời:|Nhạc:|Phối khí:)/i.test(text))
      ) {
        return;
      }

      let mainText = text || '♪';
      let subText: string | undefined = undefined;
      if (mainText.includes('\n')) {
        const parts = mainText.split('\n');
        mainText = parts[0].trim();
        subText = parts.slice(1).join('\n').trim();
      }

      rawList.push({
        id: `lyric-${lineIndex}-${matchIndex}-${timeMs}`,
        timeMs,
        text: mainText,
        subText,
      });
    });
  });

  // Sort chronologically
  rawList.sort((a, b) => a.timeMs - b.timeMs);

  // Merge items sharing identical (or <= 40ms) timestamp into single line with subText (Romaji/translation)
  const result: LyricLine[] = [];
  for (const item of rawList) {
    const prev = result[result.length - 1];
    if (prev && Math.abs(item.timeMs - prev.timeMs) <= 40 && !prev.subText && item.text !== '♪') {
      prev.subText = item.text;
    } else {
      result.push(item);
    }
  }

  return result;
}

/**
 * Finds the index of the currently active lyric line given track's progress in milliseconds.
 * Returns -1 if current progress is at the intro before the first vocal timestamp.
 * Returns the exact index matching Thom Yorke's vocal onset.
 */
export function findActiveLyricIndex(lyrics: LyricLine[], currentProgressMs: number): number {
  if (!lyrics || lyrics.length === 0) return -1;

  // If first vocal starts almost immediately (<= 2.5s, no long instrumental intro), highlight line 0 from 0:00
  if (lyrics[0].timeMs <= 2500 && currentProgressMs >= 0) {
    if (lyrics.length > 1 && currentProgressMs >= lyrics[1].timeMs) {
      // fall through to loop below
    } else {
      return 0;
    }
  }

  // If before first timestamp with genuine instrumental intro, return -1
  if (currentProgressMs < lyrics[0].timeMs) {
    return -1;
  }

  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentProgressMs >= lyrics[i].timeMs) {
      activeIndex = i;
    } else {
      break;
    }
  }

  return activeIndex;
}

/**
 * Format milliseconds into mm:ss display string
 */
export function formatTime(ms: number): string {
  if (isNaN(ms) || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
