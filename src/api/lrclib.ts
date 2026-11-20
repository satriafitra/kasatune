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
    .replace(/feat\..*/i, '')
    .replace(/ft\..*/i, '')
    .trim();
}

/**
 * Clean artist string (take primary artist before comma)
 */
function cleanArtist(artist: string): string {
  return artist.split(',')[0].trim();
}

/**
 * Fetch lyrics from LRCLIB for a given track and artist
 * Tries direct match endpoint first, falls back to search endpoint
 */
export async function fetchLyrics(
  trackName: string,
  artistName: string,
  durationMs?: number
): Promise<{ syncedLyrics: string | null; plainLyrics: string | null; instrumental: boolean }> {
  const sanitizedTrack = cleanTitle(trackName);
  const sanitizedArtist = cleanArtist(artistName);

  if (!sanitizedTrack || !sanitizedArtist) {
    return { syncedLyrics: null, plainLyrics: null, instrumental: false };
  }

  // 1. Attempt exact GET endpoint
  try {
    const params = new URLSearchParams({
      artist_name: sanitizedArtist,
      track_name: sanitizedTrack,
    });

    if (durationMs && durationMs > 0) {
      params.append('duration', Math.round(durationMs / 1000).toString());
    }

    const getUrl = `https://lrclib.net/api/get?${params.toString()}`;
    const response = await fetch(getUrl, {
      headers: {
        'Lrclib-Client': 'Webtify (https://github.com/webtify)',
      },
    });

    if (response.ok) {
      const data: LrclibResponse = await response.json();
      if (data.syncedLyrics || data.plainLyrics || data.instrumental) {
        return {
          syncedLyrics: data.syncedLyrics,
          plainLyrics: data.plainLyrics,
          instrumental: Boolean(data.instrumental),
        };
      }
    }
  } catch {
    // Exact GET failed, try search fallback
  }

  // 2. Fallback to search endpoint
  try {
    const query = `${sanitizedTrack} ${sanitizedArtist}`.trim();
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'Lrclib-Client': 'Webtify (https://github.com/webtify)',
      },
    });

    if (response.ok) {
      const results: LrclibResponse[] = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        // Prioritize items that have syncedLyrics
        const bestMatch = results.find((r) => Boolean(r.syncedLyrics)) || results[0];
        return {
          syncedLyrics: bestMatch.syncedLyrics || null,
          plainLyrics: bestMatch.plainLyrics || null,
          instrumental: Boolean(bestMatch.instrumental),
        };
      }
    }
  } catch {
    // Both attempts failed
  }

  return { syncedLyrics: null, plainLyrics: null, instrumental: false };
}
