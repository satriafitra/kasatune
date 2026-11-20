/**
 * Custom Hook: useFriendSpotify
 * Real-time detection and playtime synchronization with friend's Spotify account
 * Dual Engine:
 * 1. Discord Presence (Lanyard API + WebSocket) - 100% Real-Time & Free (No Spotify Premium required!)
 * 2. Go Backend Hub & Spotify Web API (Client ID: 272c12f48c18494fb5ac490cd10a8b2b)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import friendTracksData from '../data/friend_tracks.json';

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
  syncedLyrics?: string;
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
  playlistName: string;
  clientId: string;
}

function getSpotifyRedirectUri() {
  const port = window.location.port || '5174';
  if (port === '5173') {
    return 'http://127.0.0.1:5173';
  }
  return 'http://127.0.0.1:5174';
}

// Dynamic preview audio finder from iTunes Search API (CORS friendly, instant)
const audioPreviewCache = new Map<string, string>();
async function getPreviewAudio(artist: string, title: string): Promise<string> {
  const key = `${artist}-${title}`.toLowerCase();
  if (audioPreviewCache.has(key)) return audioPreviewCache.get(key)!;

  try {
    const q = encodeURIComponent(`${artist} ${title}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0 && data.results[0].previewUrl) {
        audioPreviewCache.set(key, data.results[0].previewUrl);
        return data.results[0].previewUrl;
      }
    }
  } catch {
    // Ignore fetch failure
  }
  return '';
}

// Dynamic synced lyrics finder from LRCLIB
const lyricsCache = new Map<string, string>();
async function getSyncedLyrics(artist: string, title: string): Promise<string> {
  const key = `${artist}-${title}`.toLowerCase();
  if (lyricsCache.has(key)) return lyricsCache.get(key)!;

  try {
    const qArtist = encodeURIComponent(artist);
    const qTitle = encodeURIComponent(title);
    const res = await fetch(`https://lrclib.net/api/get?artist_name=${qArtist}&track_name=${qTitle}`);
    if (res.ok) {
      const data = await res.json();
      if (data.syncedLyrics) {
        lyricsCache.set(key, data.syncedLyrics);
        return data.syncedLyrics;
      }
    }
  } catch {
    // Ignore fetch failure
  }
  return '';
}

export function useFriendSpotify() {
  const [playbackState, setPlaybackState] = useState<FriendPlaybackState | null>(null);
  const [liveProgressMs, setLiveProgressMs] = useState<number>(43000);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Friend Discord ID for Lanyard Real-Time Broadcast
  const [discordUserId, setDiscordUserIdState] = useState<string>(() => {
    return localStorage.getItem('kasatune_discord_user_id') || '759609270974414848';
  });

  const setDiscordUserId = useCallback((id: string) => {
    const cleaned = id.trim();
    setDiscordUserIdState(cleaned);
    if (cleaned) {
      localStorage.setItem('kasatune_discord_user_id', cleaned);
    } else {
      localStorage.removeItem('kasatune_discord_user_id');
    }
  }, []);

  const lastFetchTimeRef = useRef<number>(Date.now());
  const baseProgressRef = useRef<number>(43000);
  const isPlayingRef = useRef<boolean>(true);
  const isUsingLanyardRef = useRef<boolean>(false);

  // 1. Fetch friend's real-time now-playing state from Go Backend Hub
  const fetchNowPlaying = useCallback(async () => {
    if (isUsingLanyardRef.current) return; // Prioritize live Discord presence if active

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

  // 2. Lanyard Real-Time Discord Activity Engine (WebSocket + REST Polling)
  useEffect(() => {
    if (!discordUserId) {
      isUsingLanyardRef.current = false;
      return;
    }

    let ws: WebSocket | null = null;
    let heartbeatTimer: any = null;
    let pollInterval: any = null;
    let isSubscribed = true;

    // Process incoming Lanyard Spotify payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processLanyardPayload = async (d: any) => {
      if (!isSubscribed) return;

      // Extract from raw Discord activity (most reliable & instant) or d.spotify
      const act = d?.activities?.find((a: any) => a.name === 'Spotify' || a.id?.startsWith('spotify'));
      const sp = d?.spotify;

      if (act || (d && d.listening_to_spotify && sp)) {
        isUsingLanyardRef.current = true;
        const songTitle = act ? act.details : sp.song;
        const songArtist = act ? act.state : sp.artist;
        const songAlbum = act ? (act.assets?.large_text || act.details) : sp.album;
        const trackId = act ? (act.sync_id || 'live-track') : sp.track_id;

        let coverUrl = sp?.album_art_url || '';
        if (!coverUrl && act?.assets?.large_image) {
          const raw = act.assets.large_image.replace('spotify:', '');
          coverUrl = `https://i.scdn.co/image/${raw}`;
        }

        const timestamps = act?.timestamps || sp?.timestamps;
        const startMs = timestamps?.start || Date.now();
        const endMs = timestamps?.end || startMs + 200000;
        const durationMs = endMs - startMs;
        const currentProgressMs = Math.max(0, Math.min(durationMs, Date.now() - startMs));

        const localMatch = (friendTracksData as any[]).find(
          (t) =>
            t.id === trackId ||
            (songTitle && t.title.toLowerCase().includes(songTitle.toLowerCase())) ||
            (songTitle && songTitle.toLowerCase().includes(t.title.toLowerCase()))
        );

        let previewUrl = localMatch?.previewUrl || '';
        let syncedLyrics = localMatch?.syncedLyrics || '';

        if (!previewUrl || !syncedLyrics) {
          const [foundAudio, foundLyrics] = await Promise.all([
            !previewUrl ? getPreviewAudio(songArtist, songTitle) : Promise.resolve(''),
            !syncedLyrics ? getSyncedLyrics(songArtist, songTitle) : Promise.resolve(''),
          ]);
          if (foundAudio) previewUrl = foundAudio;
          if (foundLyrics) syncedLyrics = foundLyrics;
        }

        if (!isSubscribed) return;

        const friendTrack: FriendTrack = {
          id: trackId,
          title: songTitle,
          artist: songArtist,
          album: songAlbum,
          coverUrl: coverUrl,
          durationMs: durationMs,
          spotifyUrl: `https://open.spotify.com/track/${trackId}`,
          previewUrl: previewUrl,
          syncedLyrics: syncedLyrics,
        };

        const state: FriendPlaybackState = {
          isConnected: true,
          isPlaying: true,
          progressMs: currentProgressMs,
          timestamp: Date.now(),
          deviceName: 'Spotify on Desktop (Discord Live)',
          deviceType: 'Computer',
          friendName: d.discord_user?.global_name || d.discord_user?.username || 'deriana_',
          playlistName: 'Discord Live Session',
          clientId: DEFAULT_CLIENT_ID,
          simulated: false,
          track: friendTrack,
        };

        setPlaybackState(state);
        baseProgressRef.current = currentProgressMs;
        lastFetchTimeRef.current = Date.now();
        isPlayingRef.current = true;
        setLiveProgressMs(currentProgressMs);
        setError(null);
        setIsLoading(false);
      } else {
        // Paused or not listening on Spotify
        setPlaybackState((prev) => (prev ? { ...prev, isPlaying: false } : null));
        isPlayingRef.current = false;
      }
    };

    // REST Polling as fallback
    const pollLanyard = async () => {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${discordUserId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            await processLanyardPayload(json.data);
          }
        }
      } catch {
        // Ignore poll error
      }
    };

    pollLanyard();
    pollInterval = setInterval(pollLanyard, 1200);

    // WebSocket Connection
    try {
      ws = new WebSocket('wss://api.lanyard.rest/socket');

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.op === 1) {
            // Hello -> Send Initialize Subscribe
            ws?.send(
              JSON.stringify({
                op: 2,
                d: { subscribe_to_id: discordUserId },
              })
            );

            // Heartbeat
            if (msg.d?.heartbeat_interval) {
              heartbeatTimer = setInterval(() => {
                if (ws?.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ op: 3 }));
                }
              }, msg.d.heartbeat_interval);
            }
          } else if (msg.op === 0 && msg.d) {
            processLanyardPayload(msg.d);
          }
        } catch {
          // Skip
        }
      };

      ws.onerror = () => {
        // WebSocket error -> polling continues
      };
    } catch {
      // WS unsupported
    }

    return () => {
      isSubscribed = false;
      if (pollInterval) clearInterval(pollInterval);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (ws) ws.close();
    };
  }, [discordUserId]);

  // 3. High-precision SSE from Go Backend if not using Discord Lanyard
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE}/api/spotify/friend/events`);

      eventSource.onmessage = (event) => {
        if (isUsingLanyardRef.current) return;
        try {
          const data: FriendPlaybackState = JSON.parse(event.data);
          if (data && data.track) {
            setPlaybackState(data);
            baseProgressRef.current = data.progressMs || 0;
            lastFetchTimeRef.current = Date.now();
            isPlayingRef.current = Boolean(data.isPlaying);
            setLiveProgressMs(data.progressMs || 0);
          }
        } catch {
          // JSON parse skip
        }
      };

      eventSource.onerror = () => {
        if (eventSource) eventSource.close();
      };
    } catch {
      // EventSource unsupported
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // 4. High-precision interpolated client-side playtime clock (advances ONLY if playing)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlayingRef.current && playbackState?.track) {
        const elapsedSinceLastFetch = Date.now() - lastFetchTimeRef.current;
        const currentMs = Math.min(
          playbackState.track.durationMs,
          baseProgressRef.current + elapsedSinceLastFetch
        );
        setLiveProgressMs(currentMs);
      } else {
        setLiveProgressMs(baseProgressRef.current);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [playbackState?.track]);

  // 5. Regular Fast Polling every 1000ms
  useEffect(() => {
    fetchNowPlaying();
    const poll = setInterval(fetchNowPlaying, 1000);
    return () => clearInterval(poll);
  }, [fetchNowPlaying]);

  // 6. Catch OAuth authorization code callback (?code=...) on boot
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      setIsConnecting(true);
      const redirectUri = getSpotifyRedirectUri();

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

  // 7. Real-Time Friend Remote Actions
  const toggleFriendPlayback = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/spotify/friend/toggle`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setPlaybackState(json.data);
        isPlayingRef.current = Boolean(json.data.isPlaying);
        baseProgressRef.current = json.data.progressMs || 0;
        lastFetchTimeRef.current = Date.now();
        setLiveProgressMs(json.data.progressMs || 0);
      }
    } catch {
      // Toggle failure
    }
  }, []);

  const pauseFriendPlayback = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/spotify/friend/pause`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setPlaybackState(json.data);
        isPlayingRef.current = false;
        baseProgressRef.current = json.data.progressMs || 0;
        lastFetchTimeRef.current = Date.now();
        setLiveProgressMs(json.data.progressMs || 0);
      }
    } catch {
      // Pause failure
    }
  }, []);

  const playFriendPlayback = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/spotify/friend/play`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setPlaybackState(json.data);
        isPlayingRef.current = true;
        baseProgressRef.current = json.data.progressMs || 0;
        lastFetchTimeRef.current = Date.now();
        setLiveProgressMs(json.data.progressMs || 0);
      }
    } catch {
      // Play failure
    }
  }, []);

  const seekFriendPlayback = useCallback(async (positionMs: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/spotify/friend/seek?position_ms=${positionMs}`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success && json.data) {
        setPlaybackState(json.data);
        baseProgressRef.current = json.data.progressMs || 0;
        lastFetchTimeRef.current = Date.now();
        setLiveProgressMs(json.data.progressMs || 0);
      }
    } catch {
      // Seek failure
    }
  }, []);

  // Connect Friend Spotify (Redirects to Spotify OAuth)
  const connectSpotify = useCallback(() => {
    const clientId = playbackState?.clientId || DEFAULT_CLIENT_ID;
    const redirectUri = encodeURIComponent(getSpotifyRedirectUri());
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
    discordUserId,
    setDiscordUserId,
    fetchNowPlaying,
    connectSpotify,
    toggleFriendPlayback,
    pauseFriendPlayback,
    playFriendPlayback,
    seekFriendPlayback,
  };
}
