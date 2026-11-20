/**
 * Webtify Go Backend Client (http://localhost:8080)
 * Connects to the local Go server for Radiohead discography, live scraping, and sync.
 */

export interface BackendRadioheadTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  coverUrl: string;
  previewUrl: string;
  durationMs: number;
  bpm: number;
  mood: string;
  syncedLyrics?: string;
  plainLyrics?: string;
  dominantColors?: string[];
  spotifyUrl?: string;
}

export interface BackendApiResponse<T> {
  success: boolean;
  message: string;
  count?: number;
  data: T;
}

const BACKEND_BASE_URL = 'http://localhost:8080';

/**
 * Check if the Go backend server is reachable and healthy
 */
export async function checkBackendHealth(): Promise<{ isOnline: boolean; trackCount: number; message: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${BACKEND_BASE_URL}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json: BackendApiResponse<{ artist: string; trackCount: number }> = await res.json();
      return {
        isOnline: true,
        trackCount: json.data?.trackCount || 0,
        message: json.message || 'Go Backend Online',
      };
    }
  } catch {
    // Backend offline or unreachable
  }

  return {
    isOnline: false,
    trackCount: 0,
    message: 'Backend offline, using client cache',
  };
}

/**
 * Fetch the full Radiohead discography from Go backend
 */
export async function fetchRadioheadTracksFromBackend(): Promise<BackendRadioheadTrack[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${BACKEND_BASE_URL}/api/radiohead/tracks`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json: BackendApiResponse<BackendRadioheadTrack[]> = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch {
    // Network fault
  }

  return null;
}

/**
 * Trigger live on-demand scraper on the Go backend
 */
export async function triggerBackendScrape(): Promise<BackendRadioheadTrack[] | null> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/radiohead/scrape`);
    if (res.ok) {
      const json: BackendApiResponse<BackendRadioheadTrack[]> = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch {
    // Scrape failed
  }
  return null;
}
