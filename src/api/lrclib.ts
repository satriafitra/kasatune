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
 * Fetch lyrics from LRCLIB for a given track and artist
 * Uses smart parallel query with fuzzy fallback to maximize hit-rate and speed
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
      if (Array.isArray(results) && results.length > 0) {
        // Prioritize items that have high-quality syncedLyrics
        const syncedHit = results.find((r) => Boolean(r.syncedLyrics && r.syncedLyrics.length > 20));
        if (syncedHit) {
          return {
            syncedLyrics: syncedHit.syncedLyrics,
            plainLyrics: syncedHit.plainLyrics || null,
            instrumental: Boolean(syncedHit.instrumental),
          };
        }

        const plainHit = results.find((r) => Boolean(r.plainLyrics));
        if (plainHit) {
          return {
            syncedLyrics: null,
            plainLyrics: plainHit.plainLyrics,
            instrumental: Boolean(plainHit.instrumental),
          };
        }
      }
    }
  } catch {
    // Search attempt failed, fallback to title-only
  }

  // Fallback: title-only search
  try {
    const titleOnlyUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(sanitizedTrack)}`;
    const response = await fetch(titleOnlyUrl, {
      headers: {
        'Lrclib-Client': 'Webtify-Kasatune (https://github.com/satriafitra/kasatune)',
      },
    });

    if (response.ok) {
      const results: LrclibResponse[] = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        const syncedHit = results.find((r) => Boolean(r.syncedLyrics && r.syncedLyrics.length > 20));
        if (syncedHit) {
          return {
            syncedLyrics: syncedHit.syncedLyrics,
            plainLyrics: syncedHit.plainLyrics || null,
            instrumental: Boolean(syncedHit.instrumental),
          };
        }
      }
    }
  } catch {
    // Both attempts failed
  }

  return { syncedLyrics: null, plainLyrics: null, instrumental: false };
}
