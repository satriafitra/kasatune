/**
 * Deezer Public API Client (via Client-side CORS Proxies with resilient fallbacks)
 * Used to fetch 30-second MP3 preview audio and song BPM for synchronization
 */

export interface DeezerTrackInfo {
  previewUrl: string | null;
  bpm: number;
  mood: string;
  deezerId?: number;
  title?: string;
  artist?: string;
}

// Proxies to bypass browser CORS restrictions client-side
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

/**
 * Perform a fetch request through candidate CORS proxies with automatic fallback
 */
async function fetchWithCorsProxy<T>(targetUrl: string, timeoutMs: number = 6000): Promise<T | null> {
  for (const getProxyUrl of CORS_PROXIES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const proxyUrl = getProxyUrl(targetUrl);
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timer);

      if (response.ok) {
        const text = await response.text();
        if (text) {
          try {
            return JSON.parse(text) as T;
          } catch {
            // Not JSON, continue to next proxy
          }
        }
      }
    } catch {
      // Proxy failed or timed out, attempt next proxy candidate
      continue;
    }
  }

  return null;
}

/**
 * Determine mood category from track BPM
 */
export function getMoodFromBpm(bpm: number): string {
  if (bpm <= 0) return 'Melodic Groove';
  if (bpm < 78) return 'Chill & Atmospheric';
  if (bpm < 98) return 'Mellow & Soul';
  if (bpm < 122) return 'Groovy & Upbeat';
  if (bpm < 145) return 'Energetic Dance';
  return 'Hyper & High-Octane';
}

/**
 * Clean search terms (removes (Remastered...), [feat...], etc.) for accurate search
 */
function cleanSearchQuery(text: string): string {
  return text
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/- .*?Remaster.*/i, '')
    .replace(/feat\..*/i, '')
    .replace(/ft\..*/i, '')
    .trim();
}

/**
 * Searches Deezer for a track by title and artist to obtain preview MP3 URL and BPM
 */
export async function searchDeezerTrack(trackName: string, artistName: string): Promise<DeezerTrackInfo> {
  const cleanedTrack = cleanSearchQuery(trackName);
  const cleanedArtist = cleanSearchQuery(artistName);

  const query = `${cleanedTrack} ${cleanedArtist}`.trim();
  const searchUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5`;

  try {
    interface DeezerSearchResponse {
      data?: Array<{
        id: number;
        title: string;
        preview: string;
        artist: { name: string };
      }>;
    }

    const searchResult = await fetchWithCorsProxy<DeezerSearchResponse>(searchUrl, 5000);

    if (!searchResult || !searchResult.data || searchResult.data.length === 0) {
      return {
        previewUrl: null,
        bpm: 120, // Sensible fallback BPM
        mood: 'Atmospheric Pulse',
      };
    }

    const matched = searchResult.data[0];
    const previewUrl = matched.preview || null;
    let bpm = 0;

    // Fetch track detail to get precise BPM
    try {
      const trackDetailUrl = `https://api.deezer.com/track/${matched.id}`;
      interface DeezerDetailResponse {
        bpm?: number;
      }
      const trackDetail = await fetchWithCorsProxy<DeezerDetailResponse>(trackDetailUrl, 4000);
      if (trackDetail && typeof trackDetail.bpm === 'number' && trackDetail.bpm > 0) {
        bpm = Math.round(trackDetail.bpm);
      }
    } catch {
      // Fallback BPM
    }

    // If BPM is unavailable from Deezer, choose realistic tempo based on track id hash
    if (bpm <= 0) {
      bpm = 110 + (Math.abs(matched.id) % 32);
    }

    return {
      previewUrl,
      bpm,
      mood: getMoodFromBpm(bpm),
      deezerId: matched.id,
      title: matched.title,
      artist: matched.artist?.name,
    };
  } catch {
    return {
      previewUrl: null,
      bpm: 120,
      mood: 'Atmospheric Pulse',
    };
  }
}
