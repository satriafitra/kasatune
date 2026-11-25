/**
 * LRCLIB API Client for Synced and Plain Lyrics
 * LRCLIB provides public, free, CORS-enabled synced lyrics (.lrc format)
 */

export interface LrclibResponse {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

/**
 * Clean track title by removing extra tags e.g. "(feat. ...)", "- Remastered", etc.
 */
function cleanTitle(title: string): string {
  return title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/- .*?Remaster.*/i, '')
    .replace(/- .*?Live.*/i, '')
    .replace(/- Single/i, '')
    .replace(/- EP/i, '')
    .replace(/feat\..*/i, '')
    .replace(/ft\..*/i, '')
    .split(' - ')[0]
    .trim();
}

/**
 * Clean artist string (handle aliases e.g. Hearts2Hearts, Lady Gaga, primary artist before comma)
 */
function cleanArtist(artist: string): string {
  if (artist.includes('Hearts2Hearts')) return 'Hearts2Hearts';
  if (artist.includes('Lady Gaga')) return 'Lady Gaga';
  return artist.split('&')[0].split(',')[0].replace(/\(.*?\)/g, '').trim();
}

/**
 * Pick the best matching lyric entry by checking artist match, track title match,
 * excluding instrumental/karaoke results, and prioritizing exact duration closeness.
 */
function pickBestLyricMatch(
  results: LrclibResponse[],
  sanitizedTrack: string,
  sanitizedArtist: string,
  durationMs?: number
): LrclibResponse | null {
  if (!Array.isArray(results) || results.length === 0) return null;

  const targetTitle = sanitizedTrack.toLowerCase();
  const targetArtist = sanitizedArtist.toLowerCase();
  const targetSec = durationMs && durationMs > 1000 ? durationMs / 1000 : 0;

  const scoreItem = (r: LrclibResponse): number => {
    if (r.instrumental) return -1000;
    const rTitle = (r.trackName || r.name || '').toLowerCase();
    const rArtist = (r.artistName || '').toLowerCase();
    if (rTitle.includes('karaoke') || rTitle.includes('instrumental') || rArtist.includes('karaoke')) {
      return -800;
    }

    let score = 0;
    if (r.syncedLyrics && r.syncedLyrics.length > 20) score += 200;
    else if (r.plainLyrics && r.plainLyrics.length > 20) score += 60;
    else return -500;

    // Artist match
    if (targetArtist && (rArtist.includes(targetArtist) || targetArtist.includes(rArtist))) {
      score += 180;
    } else if (targetArtist) {
      score -= 120;
    }

    // Track title match
    if (targetTitle && (rTitle === targetTitle || rTitle.includes(targetTitle) || targetTitle.includes(rTitle))) {
      score += 150;
    }

    // Duration proximity for 1:1 lyric synchronization
    if (targetSec > 20 && r.duration > 20) {
      const diff = Math.abs(r.duration - targetSec);
      if (diff <= 5) score += 120;
      else if (diff <= 15) score += 60;
      else if (diff > 45) score -= 80;
    }

    return score;
  };

  const sorted = [...results].sort((a, b) => scoreItem(b) - scoreItem(a));
  const best = sorted[0];
  return best && scoreItem(best) > -100 ? best : null;
}

/**
 * Fetch lyrics from LRCLIB for a given track and artist
 * Uses smart parallel query with fuzzy fallback and duration/artist scoring
 */
export async function fetchLyrics(
  trackName: string,
  artistName: string,
  durationMs?: number
): Promise<{ syncedLyrics: string | null; plainLyrics: string | null; instrumental: boolean }> {
  const sanitizedTrack = cleanTitle(trackName);
  const sanitizedArtist = cleanArtist(artistName);

  if (!sanitizedTrack && !sanitizedArtist) {
    return { syncedLyrics: null, plainLyrics: null, instrumental: false };
  }

  const query = `${sanitizedTrack} ${sanitizedArtist}`.trim();
  const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'Lrclib-Client': 'Webtify-Kasatune (https://github.com/satriafitra/kasatune)',
      },
    });

    if (response.ok) {
      const results: LrclibResponse[] = await response.json();
      const best = pickBestLyricMatch(results, sanitizedTrack, sanitizedArtist, durationMs);
      if (best) {
        return {
          syncedLyrics: best.syncedLyrics || null,
          plainLyrics: best.plainLyrics || null,
          instrumental: Boolean(best.instrumental),
        };
      }
    }
  } catch {
    // Search attempt failed, fallback to title-only
  }

  // Fallback: title-only search with artist verification
  try {
    const titleOnlyUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(sanitizedTrack)}`;
    const response = await fetch(titleOnlyUrl, {
      headers: {
        'Lrclib-Client': 'Webtify-Kasatune (https://github.com/satriafitra/kasatune)',
      },
    });

    if (response.ok) {
      const results: LrclibResponse[] = await response.json();
      const best = pickBestLyricMatch(results, sanitizedTrack, sanitizedArtist, durationMs);
      if (best) {
        return {
          syncedLyrics: best.syncedLyrics || null,
          plainLyrics: best.plainLyrics || null,
          instrumental: Boolean(best.instrumental),
        };
      }
    }
  } catch {
    // Both attempts failed
  }

  return { syncedLyrics: null, plainLyrics: null, instrumental: false };
}
