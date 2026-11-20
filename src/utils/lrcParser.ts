/**
 * LRC (Lyrics) File Parser and Time Utilities
 */

export interface LyricLine {
  id: string;
  timeMs: number;
  text: string;
}

/**
 * Parses an LRC formatted string into an array of LyricLine objects
 */
export function parseLrc(lrcContent: string | null | undefined): LyricLine[] {
  if (!lrcContent || typeof lrcContent !== 'string') {
    return [];
  }

  const lines = lrcContent.split('\n');
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const matches = [...trimmed.matchAll(timeRegex)];
    if (matches.length === 0) return;

    const text = trimmed.replace(timeRegex, '').trim();

    matches.forEach((match, matchIndex) => {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fractionStr = match[3] || '0';
      const fraction = fractionStr.length === 2 ? parseInt(fractionStr, 10) * 10 : parseInt(fractionStr, 10);

      const timeMs = minutes * 60 * 1000 + seconds * 1000 + fraction;

      result.push({
        id: `lyric-${lineIndex}-${matchIndex}-${timeMs}`,
        timeMs,
        text: text || '♪',
      });
    });
  });

  return result.sort((a, b) => a.timeMs - b.timeMs);
}

/**
 * Finds the index of the currently active lyric line given track's progress in milliseconds.
 * Returns -1 if current progress is at the intro before the first vocal timestamp.
 * Returns the exact index matching Thom Yorke's vocal onset.
 */
export function findActiveLyricIndex(lyrics: LyricLine[], currentProgressMs: number): number {
  if (!lyrics || lyrics.length === 0) return -1;

  // If before first timestamp, it is still the instrumental intro: return -1
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
