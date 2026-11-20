/**
 * Spotify Web API Client (100% Client-Side with OAuth 2.0 PKCE)
 */

import { generateCodeChallenge, generateRandomString } from '../utils/pkce';

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumName: string;
  albumImageUrl: string;
  durationMs: number;
  progressMs: number;
  isPlaying: boolean;
  uri?: string;
  externalUrl?: string;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_CURRENT_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
const SPOTIFY_PLAYBACK_STATE_ENDPOINT = 'https://api.spotify.com/v1/me/player';

export const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
].join(' ');

/**
 * Initiates the PKCE authorization flow by redirecting the browser to Spotify
 */
export async function redirectToSpotifyAuthorize(clientId: string, redirectUri: string): Promise<void> {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store code_verifier in localStorage to verify after redirect
  localStorage.setItem('spotify_code_verifier', codeVerifier);
  localStorage.setItem('spotify_client_id', clientId);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: redirectUri,
  });

  window.location.href = `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchanges the authorization code received from the callback for access and refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  redirectUri: string
): Promise<SpotifyTokenResponse> {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  if (!codeVerifier) {
    throw new Error('Code verifier not found in localStorage. Please initiate login again.');
  }

  const payload = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to exchange authorization code: ${response.status} ${errorBody}`);
  }

  const data: SpotifyTokenResponse = await response.json();
  // Clear the used verifier
  localStorage.removeItem('spotify_code_verifier');
  return data;
}

/**
 * Refreshes an expired access token using the refresh token
 */
export async function refreshSpotifyAccessToken(
  refreshToken: string,
  clientId: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const payload = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to refresh Spotify token: ${response.status} ${errorBody}`);
  }

  return response.json();
}

/**
 * Fetches the user's currently playing track from Spotify
 * Returns null if playback is inactive (HTTP 204)
 */
export async function fetchCurrentlyPlayingTrack(accessToken: string): Promise<SpotifyTrack | null> {
  try {
    const response = await fetch(SPOTIFY_CURRENT_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 204 || response.status === 202) {
      // No song currently playing
      return null;
    }

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
      // Try fallback to /me/player
      return fetchPlaybackState(accessToken);
    }

    const data = await response.json();

    if (!data || !data.item) {
      return null;
    }

    const item = data.item;
    const albumImage =
      item.album?.images?.[0]?.url ||
      item.album?.images?.[1]?.url ||
      '';

    const artists = (item.artists || [])
      .map((a: { name: string }) => a.name)
      .join(', ');

    return {
      id: item.id || `custom-${Date.now()}`,
      name: item.name || 'Unknown Track',
      artist: artists || 'Unknown Artist',
      albumName: item.album?.name || 'Unknown Album',
      albumImageUrl: albumImage,
      durationMs: item.duration_ms || 0,
      progressMs: data.progress_ms || 0,
      isPlaying: Boolean(data.is_playing),
      uri: item.uri,
      externalUrl: item.external_urls?.spotify,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      throw err;
    }
    return null;
  }
}

/**
 * Fallback to /me/player endpoint
 */
async function fetchPlaybackState(accessToken: string): Promise<SpotifyTrack | null> {
  try {
    const response = await fetch(SPOTIFY_PLAYBACK_STATE_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 204 || !response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || !data.item) return null;

    const item = data.item;
    const albumImage = item.album?.images?.[0]?.url || '';
    const artists = (item.artists || []).map((a: { name: string }) => a.name).join(', ');

    return {
      id: item.id || `track-${Date.now()}`,
      name: item.name || 'Unknown Track',
      artist: artists || 'Unknown Artist',
      albumName: item.album?.name || 'Unknown Album',
      albumImageUrl: albumImage,
      durationMs: item.duration_ms || 0,
      progressMs: data.progress_ms || 0,
      isPlaying: Boolean(data.is_playing),
      uri: item.uri,
      externalUrl: item.external_urls?.spotify,
    };
  } catch {
    return null;
  }
}
