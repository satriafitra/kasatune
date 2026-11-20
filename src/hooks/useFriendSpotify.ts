/**
 * Custom Hook: useFriendSpotify
 * Real-time detection and playtime synchronization with friend's Spotify account
 * Powered by Go Backend Hub & Spotify Web API (Client ID: 272c12f48c18494fb5ac490cd10a8b2b)
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = 'http://localhost:8080';
const DEFAULT_CLIENT_ID = '272c12f48c18494fb5ac490cd10a8b2b';

export interface FriendTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  durationMs: number;
  spotifyUrl: string;
  previewUrl?: string;
}

export interface FriendPlaybackState {
  isConnected: boolean;
  isPlaying: boolean;
  progressMs: number;
  timestamp: number;
  deviceName: string;
  deviceType: string;
  track: FriendTrack | null;
  simulated: boolean;
  friendName: string;
  clientId: string;
}

export function useFriendSpotify() {
  const [playbackState, setPlaybackState] = useState<FriendPlaybackState | null>(null);
  const [liveProgressMs, setLiveProgressMs] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const lastFetchTimeRef = useRef<number>(Date.now());
  const baseProgressRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  // 1. Fetch friend's real-time now-playing state from Go Backend
  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/spotify/friend/now-playing`);
      if (!res.ok) {
        throw new Error(`Failed to fetch friend playback: ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        const data: FriendPlaybackState = json.data;
        setPlaybackState(data);
        baseProgressRef.current = data.progressMs || 0;
        lastFetchTimeRef.current = Date.now();
        isPlayingRef.current = Boolean(data.isPlaying);
        setLiveProgressMs(data.progressMs || 0);
        setError(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. High-precision interpolated client-side playtime clock (ticks smoothly every 200ms)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlayingRef.current && playbackState?.track) {
        const elapsedSinceLastFetch = Date.now() - lastFetchTimeRef.current;
        const currentMs = Math.min(
          playbackState.track.durationMs,
          baseProgressRef.current + elapsedSinceLastFetch
        );
        setLiveProgressMs(currentMs);
      }
    }, 200);

    return () => clearInterval(timer);
  }, [playbackState?.track]);

  // 3. Regular polling every 2.5 seconds to keep track and state synchronized
  useEffect(() => {
    fetchNowPlaying();
    const pollInterval = setInterval(fetchNowPlaying, 2500);
    return () => clearInterval(pollInterval);
  }, [fetchNowPlaying]);

  // 4. Catch OAuth authorization code callback (?code=...) on boot
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      setIsConnecting(true);
      const redirectUri = window.location.origin + window.location.pathname;

      // Clean browser URL immediately
      window.history.replaceState({}, document.title, window.location.pathname);

      fetch(`${API_BASE}/api/spotify/auth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            fetchNowPlaying();
          } else {
            setError(data.message || 'Spotify login failed');
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to exchange authorization code');
        })
        .finally(() => {
          setIsConnecting(false);
        });
    }
  }, [fetchNowPlaying]);

  // 5. Connect Friend Spotify (Redirects to Spotify OAuth)
  const connectSpotify = useCallback(() => {
    const clientId = playbackState?.clientId || DEFAULT_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    const scopes = encodeURIComponent(
      'user-read-currently-playing user-read-playback-state user-read-recently-played'
    );
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&show_dialog=true`;

    window.location.href = authUrl;
  }, [playbackState?.clientId]);

  return {
    playbackState,
    liveProgressMs,
    isLoading,
    isConnecting,
    error,
    fetchNowPlaying,
    connectSpotify,
  };
}
