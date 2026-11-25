/**
 * App Component (Kasatune: Discord x Spotify Hybrid Architecture)
 * Unique, compelling layout architecture:
 * - Leftmost Discord Server Rail (Official album icons with squircle morphing & pill markers)
 * - Discord Channel Drawer (Category channels & instant-play tracks)
 * - Grand Vinyl Studio Stage (Spinning collector's vinyl disc, album metadata & discography table)
 * - High-Impact Kinetic Lyrics Theater (Apple Music / Spotify Sing full-height synced lyrics)
 * - Persistent Bottom Dock with Kasatune Warm Sunset Palette (#FFEAD3, #BFE7EA, #E89B5B, #D46743)
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Plus, Heart, Radio, X, Home, Mic2, Library, ListMusic, LogOut } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { HomeFeed, type HomeDiscoveryData } from './components/HomeFeed';
import {
  getSavedSessionUser,
  saveSessionUser,
  restoreAuthSession,
  hasPendingGoogleCallback,
  consumeGoogleOAuthCallback,
  logoutAccount,
  loadAccountDataSnapshot,
  saveAccountDataSnapshot,
  hydrateAccountDataSnapshot,
  safeLocalSet,
  scopedStorageKey,
  type AuthUser,
} from './utils/authStore';
import { DiscordServerRail, type AlbumFilterType } from './components/DiscordServerRail';
import { matchesAlbumFilter } from './components/TrackListSidebar';
import { AlbumShowcase } from './components/AlbumShowcase';
import { DynamicLyrics } from './components/DynamicLyrics';
import { QueuePanel } from './components/QueuePanel';
import { PlayerBar } from './components/PlayerBar';
import { FriendSpotifyCard } from './components/FriendSpotifyCard';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import { useMusicSync } from './hooks/useMusicSync';
import { useAlbumColor } from './hooks/useAlbumColor';
import { useAudioVisualizer } from './hooks/useAudioVisualizer';
import { useFriendSpotify, type FriendTrack } from './hooks/useFriendSpotify';
import { useCustomPlaylist } from './hooks/useCustomPlaylist';
import { EditPlaylistModal } from './components/EditPlaylistModal';
import type { BackendRadioheadTrack } from './api/backend';
import { searchLiveMusic, fetchAlbumTracks, fetchArtistTracks, buildStreamUrl, searchLiveArtists, isValidImageUrl, isSameTrack, fetchHomeDiscovery } from './api/liveSearch';
import { AddAlbumModal, CATALOG_ALBUMS, type PinnedServerItem } from './components/AddAlbumModal';
import {
  isAudioInRamCache,
  prefetchAudioTrack,
  prefetchTrackLyrics,
  subscribeMediaCache,
} from './utils/mediaCache';

function resolvePlayableUrl(track: BackendRadioheadTrack): string {
  const url = (track.previewUrl || '').trim();
  if (
    !url ||
    url.includes('audio-ssl.itunes.apple.com') ||
    url.includes('cdnt-preview.dzcdn.net') ||
    (url.startsWith('/api/stream') && !url.includes('title='))
  ) {
    return buildStreamUrl(track.artist, track.title, track.durationMs);
  }
  return url;
}

const AuthenticatedApp: React.FC<{
  authUser: AuthUser;
  onAccountLogout: () => void;
}> = ({ authUser, onAccountLogout }) => {
  // Strictly account-scoped storage keys (each account starts clean and keeps its own data)
  const kPinned = scopedStorageKey(authUser.email, 'kasatune_pinned_artists_v4');
  const kQueue = scopedStorageKey(authUser.email, 'kasatune_queue_v1');
  const kActiveAlbum = scopedStorageKey(authUser.email, 'kasatune_active_album');
  const kActiveEntity = scopedStorageKey(authUser.email, 'kasatune_active_entity');
  const kFriendConn = scopedStorageKey(authUser.email, 'kasatune_is_friend_connected');
  const kSavedTrack = scopedStorageKey(authUser.email, 'kasatune_saved_track');
  const kSavedTrackId = scopedStorageKey(authUser.email, 'kasatune_saved_track_id');
  const kSavedPlaytime = scopedStorageKey(authUser.email, 'kasatune_saved_playtime');
  const kDiscordId = scopedStorageKey(authUser.email, 'kasatune_discord_user_id');

  const [rightPanelMode, setRightPanelMode] = useState<'lyrics' | 'queue' | null>('lyrics');
  const showLyrics = rightPanelMode === 'lyrics';
  const showQueue = rightPanelMode === 'queue';
  const [searchFilter, setSearchFilter] = useState('');
  const [liveTracks, setLiveTracks] = useState<BackendRadioheadTrack[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [homeDiscovery, setHomeDiscovery] = useState<HomeDiscoveryData | null>(null);
  const [isLoadingHome, setIsLoadingHome] = useState<boolean>(true);
  const [homePlaybackList, setHomePlaybackList] = useState<BackendRadioheadTrack[]>([]);
  const [mobileView, setMobileView] = useState<'player' | 'lyrics' | 'queue' | 'sidebar'>('player');
  const [queueToast, setQueueToast] = useState<string | null>(null);
  const [, setCacheTick] = useState(0);
  const [manualQueue, setManualQueue] = useState<BackendRadioheadTrack[]>(() => {
    try {
      const snap = loadAccountDataSnapshot(authUser.email);
      if (snap && Array.isArray(snap.manualQueue) && snap.manualQueue.length > 0) {
        return snap.manualQueue;
      }
      const saved = localStorage.getItem(kQueue);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      if (snap && Array.isArray(snap.manualQueue)) return snap.manualQueue;
    } catch {}
    return [];
  });
  const [shuffleOrder, setShuffleOrder] = useState<BackendRadioheadTrack[]>([]);
  const [isEditPlaylistModalOpen, setIsEditPlaylistModalOpen] = useState(false);
  const [isAddArtistModalOpen, setIsAddArtistModalOpen] = useState(false);
  const normalizePinnedList = (list: any[]): PinnedServerItem[] =>
    list.map((item) => {
      if (typeof item === 'string') {
        const found = CATALOG_ALBUMS.find((c) => c.id === item);
        return (
          found || {
            id: item,
            name: item,
            artist: item,
            albumTitle: 'Popular Hits',
            imageUrl: '/covers/radiohead.jpg',
            type: 'artist',
          }
        );
      }
      if (item?.id === 'sheilaon7' && !isValidImageUrl(item.imageUrl)) {
        return {
          ...item,
          imageUrl: 'https://cdn-images.dzcdn.net/images/artist/9e6cc50e80a7dcb4dacc7eb15427335b/1000x1000-000000-80-0-0.jpg',
        };
      }
      return item;
    });

  const [pinnedServers, setPinnedServers] = useState<PinnedServerItem[]>(() => {
    try {
      const snap = loadAccountDataSnapshot(authUser.email);
      const savedRaw = localStorage.getItem(kPinned);
      const fromKey = savedRaw ? JSON.parse(savedRaw) : null;

      if (snap && Array.isArray(snap.pinnedServers) && snap.pinnedServers.length > 0) {
        return normalizePinnedList(snap.pinnedServers);
      }
      if (Array.isArray(fromKey) && fromKey.length > 0) {
        return normalizePinnedList(fromKey);
      }
      if (snap && Array.isArray(snap.pinnedServers)) {
        return normalizePinnedList(snap.pinnedServers);
      }
    } catch {}
    return [];
  });

  // Track whether user has mutated account data and whether async vault hydration finished
  const isVaultHydratedRef = useRef<boolean>(false);
  const didUserMutateRef = useRef<boolean>(false);

  const handleTogglePinServer = useCallback((server: PinnedServerItem) => {
    didUserMutateRef.current = true;
    setPinnedServers((prev) => {
      const exists = prev.some((s) => s.id === server.id);
      const next = exists ? prev.filter((s) => s.id !== server.id) : [...prev, server];
      safeLocalSet(kPinned, JSON.stringify(next));
      return next;
    });
  }, [kPinned]);

  const handlePinServerIfNeeded = useCallback((server: PinnedServerItem) => {
    didUserMutateRef.current = true;
    setPinnedServers((prev) => {
      if (prev.some((s) => s.id === server.id)) return prev;
      const next = [...prev, server];
      safeLocalSet(kPinned, JSON.stringify(next));
      return next;
    });
  }, [kPinned]);

  const repairServerImage = useCallback((serverId: string, newImageUrl?: string) => {
    if (!newImageUrl || !isValidImageUrl(newImageUrl)) return;
    setPinnedServers((prev) => {
      let changed = false;
      const next = prev.map((s) => {
        if (s.id === serverId && !isValidImageUrl(s.imageUrl)) {
          changed = true;
          return { ...s, imageUrl: newImageUrl };
        }
        return s;
      });
      if (changed) {
        didUserMutateRef.current = true;
        safeLocalSet(kPinned, JSON.stringify(next));
      }
      return changed ? next : prev;
    });
    setCurrentAlbumEntity((prev) => {
      if (prev && prev.id === serverId && !isValidImageUrl(prev.imageUrl)) {
        const updated = { ...prev, imageUrl: newImageUrl };
        safeLocalSet(kActiveEntity, JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, [kPinned, kActiveEntity]);

  // Keep heavy artist track cache in sessionStorage (capped at 8 artists) so it NEVER fills localStorage's 5MB quota!
  const [onlineAlbumTracks, setOnlineAlbumTracks] = useState<Record<string, BackendRadioheadTrack[]>>(() => {
    try {
      // Purge any legacy bloated localStorage cache so user account data always has plenty of room
      localStorage.removeItem('kasatune_online_tracks_cache_v3');
    } catch {}
    try {
      const saved = sessionStorage.getItem('kasatune_online_tracks_cache_v3');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });
  const [isLoadingOnlineAlbum, setIsLoadingOnlineAlbum] = useState<boolean>(false);

  const updateOnlineAlbumTracks = useCallback((key: string, songs: BackendRadioheadTrack[]) => {
    setOnlineAlbumTracks((prev) => {
      const next = { ...prev, [key]: songs };
      // Cap persisted sessionStorage cache to 8 most recent artists
      const keys = Object.keys(next);
      const trimmed: Record<string, BackendRadioheadTrack[]> = {};
      for (const k of keys.slice(-8)) {
        trimmed[k] = next[k];
      }
      try {
        sessionStorage.setItem('kasatune_online_tracks_cache_v3', JSON.stringify(trimmed));
      } catch {}
      return trimmed;
    });
  }, []);

  // Automatically repair any pinned artist with missing/blank silhouette artwork on mount or pin add
  const repairedIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const missing = pinnedServers.filter((s) => !isValidImageUrl(s.imageUrl) && !repairedIdsRef.current.has(s.id));
    if (missing.length === 0) return;
    missing.forEach(async (srv) => {
      repairedIdsRef.current.add(srv.id);
      const cachedSongs = onlineAlbumTracks[srv.id];
      if (cachedSongs?.[0]?.coverUrl && isValidImageUrl(cachedSongs[0].coverUrl)) {
        repairServerImage(srv.id, cachedSongs[0].coverUrl);
        return;
      }
      try {
        const artists = await searchLiveArtists(srv.artist || srv.name);
        const match = artists.find((a) => isValidImageUrl(a.imageUrl));
        if (match?.imageUrl) {
          repairServerImage(srv.id, match.imageUrl);
          return;
        }
        const tracksRes = await fetchArtistTracks(srv.artist || srv.name);
        if (tracksRes?.[0]?.coverUrl && isValidImageUrl(tracksRes[0].coverUrl)) {
          repairServerImage(srv.id, tracksRes[0].coverUrl);
        }
      } catch {}
    });
  }, [pinnedServers, onlineAlbumTracks, repairServerImage]);

  // Real-time Global Online Music Scraper / Search Engine
  useEffect(() => {
    const query = searchFilter.trim();
    if (!query || query.length < 2) {
      setLiveTracks([]);
      setIsLoadingLive(false);
      return;
    }

    const controller = new AbortController();
    setIsLoadingLive(true);

    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchLiveMusic(query, 12, controller.signal);
        setLiveTracks(results);
      } catch {
        setLiveTracks([]);
      } finally {
        setIsLoadingLive(false);
      }
    }, 350);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchFilter]);

  // Session & Condition Persistence: Default new accounts to clean real-time Home feed ('home')
  const [activeAlbum, setActiveAlbum] = useState<AlbumFilterType>(() => {
    try {
      const saved = localStorage.getItem(kActiveAlbum);
      if (saved && saved !== 'all') return saved as AlbumFilterType;
    } catch {}
    return 'home';
  });

  const [isFriendSyncConnected, setIsFriendSyncConnected] = useState<boolean>(() => {
    try {
      const savedConnected = localStorage.getItem(kFriendConn);
      const savedAlbum = localStorage.getItem(kActiveAlbum);
      if (savedConnected !== null) {
        return savedConnected === 'true';
      }
      return savedAlbum === 'friend';
    } catch {}
    return false;
  });

  // Current active Album / Artist Entity showcased on the main stage
  const [currentAlbumEntity, setCurrentAlbumEntity] = useState<PinnedServerItem | null>(() => {
    try {
      const saved = localStorage.getItem(kActiveEntity);
      if (saved) return JSON.parse(saved);

      const savedAlbum = localStorage.getItem(kActiveAlbum);
      const savedPinned = localStorage.getItem(kPinned);
      if (savedPinned) {
        const list: PinnedServerItem[] = JSON.parse(savedPinned);
        if (Array.isArray(list) && list.length > 0) {
          const matched = list.find((s) => s.id === savedAlbum);
          return matched || list[0];
        }
      }
    } catch {}
    return null;
  });

  // 1. Spotify PKCE Auth
  const {
    isAuthenticated,
    clientId,
    setClientId,
    login,
    logout,
  } = useSpotifyAuth();

  // 2. Discography & Music Sync (scoped per logged-in account)
  const {
    tracks,
    activeTrack,
    lyrics,
    plainLyrics,
    isLoadingSong,
    isBackendOnline,
    isShuffle,
    isRepeat,
    selectTrack,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    refetchTracks,
  } = useMusicSync(authUser.email);

  // 2.1 User Custom Playlist & Liked Songs Hub (scoped per logged-in account)
  const {
    playlist: customPlaylist,
    likedTracks,
    likedTrackIds,
    isLiked,
    toggleLike: rawToggleLike,
    updatePlaylist: rawUpdatePlaylist,
    hydratePlaylist,
  } = useCustomPlaylist(tracks, authUser.email);

  const toggleLike = useCallback(
    (track: BackendRadioheadTrack) => {
      didUserMutateRef.current = true;
      rawToggleLike(track);
    },
    [rawToggleLike]
  );

  const updatePlaylist = useCallback(
    (updates: { name: string; description?: string; coverUrl?: string }) => {
      didUserMutateRef.current = true;
      rawUpdatePlaylist(updates);
    },
    [rawUpdatePlaylist]
  );

  // Hydrate account data from IndexedDB & Server Vault on mount (survives refresh, cache clear & relogin!)
  useEffect(() => {
    let active = true;
    hydrateAccountDataSnapshot(authUser.email)
      .then((vault) => {
        if (!active) return;
        if (vault && !didUserMutateRef.current) {
          if (Array.isArray(vault.pinnedServers) && vault.pinnedServers.length > 0) {
            setPinnedServers((prev) => {
              if (prev.length > 0) return prev;
              const normalized = normalizePinnedList(vault.pinnedServers);
              safeLocalSet(kPinned, JSON.stringify(normalized));
              return normalized;
            });
          }
          if (Array.isArray(vault.manualQueue) && vault.manualQueue.length > 0) {
            setManualQueue((prev) => {
              if (prev.length > 0) return prev;
              safeLocalSet(kQueue, JSON.stringify(vault.manualQueue));
              return vault.manualQueue;
            });
          }
          if (vault.customPlaylist && Array.isArray(vault.customPlaylist.likedTrackIds)) {
            const localLikedCount = customPlaylist.likedTrackIds.length;
            const vaultLikedCount = vault.customPlaylist.likedTrackIds.length;
            if (vaultLikedCount > 0 && localLikedCount === 0) {
              hydratePlaylist(vault.customPlaylist);
            }
          }
        }
      })
      .finally(() => {
        if (active) {
          isVaultHydratedRef.current = true;
        }
      });
    return () => {
      active = false;
    };
  }, [authUser.email]);

  // Persist per-account pinned artists, favorites playlist & queue automatically
  // Guarded so mount never overwrites IndexedDB/server vault before hydration finishes
  useEffect(() => {
    if (!isVaultHydratedRef.current && !didUserMutateRef.current) return;
    safeLocalSet(kPinned, JSON.stringify(pinnedServers));
    safeLocalSet(kQueue, JSON.stringify(manualQueue.slice(0, 100)));
    saveAccountDataSnapshot(authUser.email, {
      pinnedServers,
      manualQueue: manualQueue.slice(0, 100),
      customPlaylist,
      activeAlbum,
      currentAlbumEntity,
      updatedAt: Date.now(),
    });
  }, [authUser.email, pinnedServers, manualQueue, customPlaylist, activeAlbum, currentAlbumEntity, kPinned, kQueue]);

  // Flush account snapshot right before logging out so relogin always restores everything
  const flushAndLogout = useCallback(() => {
    safeLocalSet(kPinned, JSON.stringify(pinnedServers));
    safeLocalSet(kQueue, JSON.stringify(manualQueue.slice(0, 100)));
    saveAccountDataSnapshot(authUser.email, {
      pinnedServers,
      manualQueue: manualQueue.slice(0, 100),
      customPlaylist,
      activeAlbum,
      currentAlbumEntity,
      updatedAt: Date.now(),
    });
    onAccountLogout();
  }, [authUser.email, pinnedServers, manualQueue, customPlaylist, activeAlbum, currentAlbumEntity, kPinned, kQueue, onAccountLogout]);

  // 3. Dynamic Color Extraction from Album Art via ColorThief
  const albumColors = useAlbumColor(activeTrack.coverUrl);

  const audioErrorFallbackIdRef = useRef<string>('');
  const activeTrackRef = useRef(activeTrack);
  useEffect(() => {
    activeTrackRef.current = activeTrack;
  }, [activeTrack]);

  // 4. Web Audio Engine & Rhythmic Beat Analyzer
  const {
    isPlaying,
    currentTime: audioCurrentTimeSec,
    duration: audioDurationSec,
    volume,
    setVolume,
    play,
    pause,
    togglePlay,
    seekToSeconds,
    loadTrack,
    visualizerData,
  } = useAudioVisualizer(
    resolvePlayableUrl(activeTrack),
    activeTrack.bpm,
    activeTrack.durationMs > 0 ? activeTrack.durationMs / 1000 : 266,
    {
      accountEmail: authUser.email,
      onEnded: () => {
        if (activeAlbum === 'friend' || isFriendSyncConnected) {
          return;
        }
        if (isRepeat) {
          seekToSeconds(0);
          togglePlay();
        } else {
          handleNextTrack();
        }
      },
      onAudioError: () => {
        const cur = activeTrackRef.current;
        if (!cur || audioErrorFallbackIdRef.current === cur.id) return;
        audioErrorFallbackIdRef.current = cur.id;
        const fallbackUrl = buildStreamUrl(cur.artist, cur.title, cur.durationMs);
        if (cur.previewUrl !== fallbackUrl) {
          loadTrack(
            fallbackUrl,
            cur.bpm || 120,
            cur.durationMs > 0 ? cur.durationMs / 1000 : 238,
            true
          );
        }
      },
    }
  );

  // 5. Real-Time Friend Spotify Detection & Playtime Sync Hub
  const {
    playbackState: friendPlayback,
    liveProgressMs: friendLiveProgressMs,
    isLoading: isLoadingFriend,
    isConnecting: isConnectingFriend,
    discordUserId,
    setDiscordUserId,
    friendsLiveMap,
    connectSpotify: connectFriendSpotify,
    fetchNowPlaying: refetchFriendSpotify,
    toggleFriendPlayback,
  } = useFriendSpotify();

  // Session & Playtime Persistence: Restore exact track & progress position on refresh
  const hasRestoredSavedTrackRef = useRef(false);
  useEffect(() => {
    if (!hasRestoredSavedTrackRef.current && tracks.length > 0) {
      hasRestoredSavedTrackRef.current = true;
      try {
        const isFriendMode = activeAlbum === 'friend' && isFriendSyncConnected;
        if (isFriendMode) {
          // If the last condition was friend live sync, do not overwrite with saved standalone song!
          // Friend sync engine will restore the friend's exact song and progress.
          return;
        }

        const savedTrackStr = localStorage.getItem(kSavedTrack);
        let savedTrack: BackendRadioheadTrack | null = null;
        if (savedTrackStr) {
          try {
            savedTrack = JSON.parse(savedTrackStr);
          } catch {}
        }

        const savedTrackId = localStorage.getItem(kSavedTrackId);
        const savedTimeStr = localStorage.getItem(kSavedPlaytime);
        const savedTime = savedTimeStr ? parseFloat(savedTimeStr) : 0;

        const onlineTracksForActive = activeAlbum ? onlineAlbumTracks[activeAlbum] : undefined;
        const targetTrack =
          savedTrack ||
          (savedTrackId && (tracks.find((t) => t.id === savedTrackId) || onlineTracksForActive?.find((t) => t.id === savedTrackId))) ||
          (onlineTracksForActive && onlineTracksForActive.length > 0 && onlineTracksForActive[0]) ||
          (activeAlbum && activeAlbum !== 'home' && activeAlbum !== 'friend' && tracks.find((t) => matchesAlbumFilter(t, activeAlbum, likedTrackIds))) ||
          null;

        if (targetTrack) {
          selectTrack(targetTrack);
          loadTrack(
            resolvePlayableUrl(targetTrack),
            targetTrack.bpm,
            targetTrack.durationMs > 0 ? targetTrack.durationMs / 1000 : 238,
            false, // Do not auto-blast audio on refresh
            savedTime // Exact saved playtime restored!
          );
        }
      } catch (e) {
        console.error('Failed to restore saved track/playtime', e);
      }
    }
  }, [tracks, selectTrack, loadTrack, activeAlbum, isFriendSyncConnected]);

  // Track friend sync identity refs to prevent infinite reload loops and seek storms
  const currentFriendTrackKeyRef = useRef<string>('');
  const lastSyncedPreviewUrlRef = useRef<string>('');
  const lastSyncedLyricsRef = useRef<string>('');
  const lastFriendSeekTimeRef = useRef<number>(0);

  // Safe Track Matcher: Prioritizes full studio recordings from library, preventing accidental cross-artist matches
  const resolveTargetTrack = useCallback((friendTrack: FriendTrack, tracksList: BackendRadioheadTrack[]): BackendRadioheadTrack => {
    const cleanA = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    const fTitle = cleanA(friendTrack.title);
    const fArtist = cleanA(friendTrack.artist);

    const matched = tracksList.find((t) => {
      if (friendTrack.id && t.id === friendTrack.id) return true;
      const tTitle = cleanA(t.title);
      const tArtist = cleanA(t.artist);
      if (tTitle.length > 1 && tTitle === fTitle) {
        if (!fArtist || !tArtist || tArtist.includes(fArtist) || fArtist.includes(tArtist)) return true;
      }
      const artistMatch = tArtist && fArtist && (tArtist.includes(fArtist) || fArtist.includes(tArtist));
      if (artistMatch && tTitle.length > 1 && fTitle.length > 1) {
        if (tTitle.includes(fTitle) || fTitle.includes(tTitle)) return true;
      }
      return false;
    });

    if (matched) {
      return {
        ...matched,
        // Always prefer the full studio recording with full intro from library!
        previewUrl: matched.previewUrl || friendTrack.previewUrl || '',
        syncedLyrics: matched.syncedLyrics || friendTrack.syncedLyrics || '',
        durationMs: matched.durationMs || friendTrack.durationMs || 235000,
      };
    }

    return {
      id: friendTrack.id,
      title: friendTrack.title,
      artist: friendTrack.artist,
      album: friendTrack.album,
      year: new Date().getFullYear(),
      coverUrl: friendTrack.coverUrl || '',
      previewUrl: friendTrack.previewUrl || '',
      durationMs: friendTrack.durationMs || 235000,
      bpm: 120,
      mood: 'Spotify Live Presence',
      syncedLyrics: friendTrack.syncedLyrics || '',
      spotifyUrl: friendTrack.spotifyUrl || '',
    };
  }, []);

  // Master Real-Time Friend Spotify Synchronization Engine
  useEffect(() => {
    if (!isFriendSyncConnected || activeAlbum !== 'friend') {
      currentFriendTrackKeyRef.current = '';
      lastSyncedPreviewUrlRef.current = '';
      lastSyncedLyricsRef.current = '';
      return;
    }

    if (!friendPlayback || !friendPlayback.track) return;

    const friendTrack = friendPlayback.track;
    const friendTrackKey = `${friendTrack.id || ''}:${friendTrack.artist}-${friendTrack.title}`.toLowerCase();
    const isNewTrack = currentFriendTrackKeyRef.current !== friendTrackKey;
    const hasNewAudioPreview = Boolean(
      friendTrack.previewUrl && friendTrack.previewUrl !== lastSyncedPreviewUrlRef.current
    );
    const hasNewLyrics = Boolean(
      friendTrack.syncedLyrics && friendTrack.syncedLyrics !== lastSyncedLyricsRef.current
    );

    // 1. Only execute track switch when the song has actually changed or audio preview/lyrics arrived
    if (isNewTrack || hasNewAudioPreview || hasNewLyrics) {
      currentFriendTrackKeyRef.current = friendTrackKey;
      lastSyncedPreviewUrlRef.current = friendTrack.previewUrl || '';
      lastSyncedLyricsRef.current = friendTrack.syncedLyrics || '';

      const target = resolveTargetTrack(friendTrack, tracks);

      if (isNewTrack || hasNewLyrics) {
        selectTrack(target);
      }

      if (isNewTrack || hasNewAudioPreview) {
        const friendSec = Math.max(0, friendLiveProgressMs / 1000);
        // Preserve intro in full if track is in initial intro (< 8s)
        const safeFriendSec = friendSec < 8 ? 0 : friendSec;
        loadTrack(
          resolvePlayableUrl(target),
          target.bpm || 120,
          (target.durationMs || 235000) / 1000,
          friendPlayback.isPlaying,
          safeFriendSec
        );
      }
      return;
    }

    // 2. Play / Pause Sync
    if (friendPlayback.isPlaying && !isPlaying) {
      if (audioDurationSec > 0 && audioCurrentTimeSec >= audioDurationSec - 0.5) {
        // Track finished naturally, do not loop or restart from 0
      } else {
        play();
      }
    } else if (!friendPlayback.isPlaying && isPlaying) {
      pause();
    }

    // 3. Gentle Drift Correction (Throttled, only on studio tracks)
    const friendSec = friendLiveProgressMs / 1000;
    const drift = Math.abs(audioCurrentTimeSec - friendSec);
    const now = Date.now();

    if (!friendPlayback.isPlaying) {
      if (drift > 0.1 && now - lastFriendSeekTimeRef.current > 500) {
        lastFriendSeekTimeRef.current = now;
        seekToSeconds(friendSec);
      }
    } else {
      if (audioDurationSec >= 45 && drift > 1.2 && now - lastFriendSeekTimeRef.current > 3500) {
        lastFriendSeekTimeRef.current = now;
        seekToSeconds(friendSec);
      }
    }
  }, [
    isFriendSyncConnected,
    activeAlbum,
    friendPlayback?.track?.id,
    friendPlayback?.track?.title,
    friendPlayback?.track?.artist,
    friendPlayback?.track?.previewUrl,
    friendPlayback?.isPlaying,
    friendLiveProgressMs,
    audioCurrentTimeSec,
    tracks,
    isPlaying,
    play,
    pause,
    seekToSeconds,
    selectTrack,
    loadTrack,
    resolveTargetTrack,
  ]);

  // Load real-time global Home discovery (Top Songs {currentYear}, GTA VI Viral, & Random Recommendations)
  const loadHomeFeed = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoadingHome(true);
    try {
      const data = await fetchHomeDiscovery(forceRefresh);
      setHomeDiscovery(data);
      // For a fresh account with no saved track yet, prepare the #1 global hit instead of any legacy default
      if (!forceRefresh && !localStorage.getItem(kSavedTrack) && data.topGlobal.length > 0) {
        const topSong = data.topGlobal[0];
        selectTrack(topSong);
        loadTrack(
          resolvePlayableUrl(topSong),
          topSong.bpm,
          topSong.durationMs > 0 ? topSong.durationMs / 1000 : 210,
          false
        );
      }
    } finally {
      setIsLoadingHome(false);
    }
  }, [kSavedTrack, selectTrack, loadTrack]);

  useEffect(() => {
    loadHomeFeed(false);
  }, [loadHomeFeed]);

  // Filter tracks based on active stage (Home, Favorites, Artist, or Local Library)
  const displayTracks = useMemo(() => {
    if (activeAlbum === 'home') {
      if (homePlaybackList.length > 0) return homePlaybackList;
      return homeDiscovery?.topGlobal || [];
    }
    if (activeAlbum === 'favorites') {
      return likedTracks;
    }
    if (onlineAlbumTracks[activeAlbum] && onlineAlbumTracks[activeAlbum].length > 0) {
      return onlineAlbumTracks[activeAlbum];
    }

    return tracks.filter((t) => matchesAlbumFilter(t, activeAlbum, likedTrackIds));
  }, [tracks, activeAlbum, likedTracks, likedTrackIds, onlineAlbumTracks, homePlaybackList, homeDiscovery]);

  // Auto-fetch artist / album popular tracks on refresh or category load
  useEffect(() => {
    if (!activeAlbum || activeAlbum === 'home' || activeAlbum === 'friend' || activeAlbum === 'favorites') return;
    if (onlineAlbumTracks[activeAlbum] && onlineAlbumTracks[activeAlbum].length > 0) return;

    let isSubscribed = true;
    const loadCategoryTracks = async () => {
      let entity = currentAlbumEntity;
      if (!entity) {
        entity = CATALOG_ALBUMS.find((c) => c.id === activeAlbum) || null;
      }
      if (!entity) {
        try {
          const savedPinned = localStorage.getItem(kPinned);
          if (savedPinned) {
            const list: PinnedServerItem[] = JSON.parse(savedPinned);
            entity = list.find((s) => s.id === activeAlbum) || null;
          }
        } catch {}
      }

      const targetArtist =
        entity?.artist ||
        (activeAlbum.startsWith('online-artist-')
          ? decodeURIComponent(activeAlbum.replace('online-artist-', ''))
          : activeAlbum);

      if (entity?.collectionId || targetArtist) {
        setIsLoadingOnlineAlbum(true);
        try {
          let songs: BackendRadioheadTrack[] = [];
          if (entity?.collectionId) {
            songs = await fetchAlbumTracks(entity.collectionId);
          } else if (targetArtist) {
            songs = await fetchArtistTracks(targetArtist);
          }
          if (isSubscribed && songs.length > 0) {
            updateOnlineAlbumTracks(activeAlbum, songs);
            repairServerImage(activeAlbum, songs[0].coverUrl);
          }
        } catch (e) {
          console.error('Failed to auto-load category songs:', e);
        } finally {
          if (isSubscribed) {
            setIsLoadingOnlineAlbum(false);
          }
        }
      }
    };

    loadCategoryTracks();
    return () => {
      isSubscribed = false;
    };
  }, [activeAlbum, currentAlbumEntity, onlineAlbumTracks]);

  // Keep document tab title cleanly set to Kasatune
  useEffect(() => {
    if (activeTrack && activeTrack.title) {
      document.title = `${activeTrack.title} • ${activeTrack.artist} | Kasatune`;
    } else {
      document.title = 'Kasatune';
    }
  }, [activeTrack]);

  // Switch Discord Server category & automatically load the primary track
  const handleSelectAlbum = useCallback(
    async (album: AlbumFilterType | string, serverItem?: PinnedServerItem) => {
      setActiveAlbum(album as AlbumFilterType);
      safeLocalSet(kActiveAlbum, album);

      // Resolve and showcase the Artist / Album Entity
      let resolvedEntity: PinnedServerItem | null = serverItem || null;
      if (!resolvedEntity) {
        resolvedEntity = CATALOG_ALBUMS.find((c) => c.id === album) || null;
      }
      if (!resolvedEntity) {
        if (album === 'richbrian') {
          resolvedEntity = {
            id: 'richbrian',
            name: 'Rich Brian',
            artist: 'Rich Brian',
            albumTitle: 'Popular Hits',
            year: 2024,
            imageUrl: 'https://cdn-images.dzcdn.net/images/artist/432a97f2d8da2aa987b7cc721936ea7e/1000x1000-000000-80-0-0.jpg',
            type: 'artist',
          };
        } else if (album === 'sheilaon7') {
          resolvedEntity = {
            id: 'sheilaon7',
            name: 'Sheila On 7',
            artist: 'Sheila On 7',
            albumTitle: 'Diskografi Lengkap',
            year: 1999,
            imageUrl: 'https://cdn-images.dzcdn.net/images/artist/9e6cc50e80a7dcb4dacc7eb15427335b/1000x1000-000000-80-0-0.jpg',
            type: 'artist',
          };
        } else if (album === 'radiohead') {
          resolvedEntity = {
            id: 'radiohead',
            name: 'Radiohead',
            artist: 'Radiohead',
            albumTitle: '9 Studio Albums Collection',
            year: 1993,
            imageUrl: '/covers/radiohead.jpg',
            type: 'artist',
          };
        } else if (album === 'playboicarti') {
          resolvedEntity = {
            id: 'playboicarti',
            name: 'Playboi Carti',
            artist: 'Playboi Carti',
            albumTitle: 'Whole Lotta Red & Die Lit',
            year: 2020,
            imageUrl: '/covers/playboicarti.jpg',
            type: 'artist',
          };
        } else if (album === 'vander' || album === 'vender') {
          resolvedEntity = {
            id: 'vander',
            name: 'vander! / vender!',
            artist: 'vander! (vandereism)',
            albumTitle: 'KING MOKONDO & Bencana Alam',
            year: 2025,
            imageUrl: '/covers/vander.jpg',
            type: 'artist',
          };
        }
      }
      setCurrentAlbumEntity(resolvedEntity);
      try {
        if (resolvedEntity) {
          safeLocalSet(kActiveEntity, JSON.stringify(resolvedEntity));
        } else {
          localStorage.removeItem(kActiveEntity);
        }
      } catch {}

      if (album === 'home') {
        setCurrentAlbumEntity(null);
        try {
          localStorage.removeItem(kActiveEntity);
        } catch {}
        return;
      }

      if (album === 'favorites') {
        if (likedTracks.length > 0) {
          const firstLiked = likedTracks[0];
          selectTrack(firstLiked);
          try {
            localStorage.setItem(kSavedTrackId, firstLiked.id);
            localStorage.setItem(kSavedTrack, JSON.stringify(firstLiked));
          } catch {}
          loadTrack(
            resolvePlayableUrl(firstLiked),
            firstLiked.bpm,
            firstLiked.durationMs > 0 ? firstLiked.durationMs / 1000 : 238,
            true
          );
        }
        return;
      } else if (album === 'friend') {
        setIsFriendSyncConnected(true);
        try {
          localStorage.setItem(kFriendConn, 'true');
        } catch {}

        if (friendPlayback?.track) {
          const target = resolveTargetTrack(friendPlayback.track, tracks);
          const currentFriendSec = Math.max(
            0,
            (friendLiveProgressMs > 0 ? friendLiveProgressMs : friendPlayback.progressMs || 0) / 1000
          );
          selectTrack(target);
          loadTrack(
            resolvePlayableUrl(target),
            target.bpm || 120,
            target.durationMs > 0 ? target.durationMs / 1000 : 235,
            true, // Immediately play on connect!
            currentFriendSec
          );
          if (currentFriendSec > 0) {
            seekToSeconds(currentFriendSec);
          }
          play();
        }
      } else if (album.startsWith('online-') || serverItem?.collectionId || serverItem?.type === 'artist') {
        // Dynamic Global Live Online Album / Artist
        let fetchedSongs: BackendRadioheadTrack[] = onlineAlbumTracks[album] || [];
        if (fetchedSongs.length === 0) {
          setIsLoadingOnlineAlbum(true);
          try {
            if (serverItem?.collectionId) {
              fetchedSongs = await fetchAlbumTracks(serverItem.collectionId);
            } else if (serverItem?.artist) {
              fetchedSongs = await fetchArtistTracks(serverItem.artist);
            }
          } catch (e) {
            console.error('Error fetching online album tracks:', e);
          } finally {
            setIsLoadingOnlineAlbum(false);
          }

          if (fetchedSongs.length > 0) {
            updateOnlineAlbumTracks(album, fetchedSongs);
            repairServerImage(album, fetchedSongs[0].coverUrl);
          }
        }

        if (fetchedSongs.length > 0) {
          const first = fetchedSongs[0];
          selectTrack(first);
          try {
            localStorage.setItem(kSavedTrackId, first.id);
            localStorage.setItem(kSavedTrack, JSON.stringify(first));
          } catch {}
          loadTrack(
            resolvePlayableUrl(first),
            first.bpm,
            first.durationMs > 0 ? first.durationMs / 1000 : 238,
            true
          );
        }
      } else {
        const matchedTrack =
          tracks.find((t) => matchesAlbumFilter(t, album, likedTrackIds)) ||
          tracks.find((t) => t.id === 'rh-creep') ||
          tracks[0];
        if (matchedTrack) {
          selectTrack(matchedTrack);
          try {
            localStorage.setItem(kSavedTrackId, matchedTrack.id);
            localStorage.setItem(kSavedTrack, JSON.stringify(matchedTrack));
          } catch {}
          loadTrack(
            resolvePlayableUrl(matchedTrack),
            matchedTrack.bpm,
            matchedTrack.durationMs > 0 ? matchedTrack.durationMs / 1000 : 238,
            true // Auto-play when selecting personal albums!
          );
        }
      }
    },
    [tracks, selectTrack, loadTrack, friendPlayback, friendLiveProgressMs, seekToSeconds, play, resolveTargetTrack, likedTracks, likedTrackIds, onlineAlbumTracks]
  );

  // Toggle Live Sync connection state and start immediate playback at friend's current playtime
  const handleToggleFriendSync = useCallback(() => {
    setIsFriendSyncConnected((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(kFriendConn, String(next));
      } catch {}

      if (next) {
        setActiveAlbum('friend');
        try {
          localStorage.setItem(kActiveAlbum, 'friend');
        } catch {}

        if (friendPlayback?.track) {
          const target = resolveTargetTrack(friendPlayback.track, tracks);
          const currentFriendSec = Math.max(
            0,
            (friendLiveProgressMs > 0 ? friendLiveProgressMs : friendPlayback.progressMs || 0) / 1000
          );
          selectTrack(target);
          loadTrack(
            resolvePlayableUrl(target),
            target.bpm || 120,
            target.durationMs > 0 ? target.durationMs / 1000 : 235,
            true, // Immediately play on connect!
            currentFriendSec
          );
          if (currentFriendSec > 0) {
            seekToSeconds(currentFriendSec);
          }
          play();
        }
      } else {
        let targetAlbum = 'favorites';
        try {
          const savedAlbum = localStorage.getItem(kActiveAlbum);
          if (savedAlbum && savedAlbum !== 'friend') {
            targetAlbum = savedAlbum;
          } else {
            const savedPinned = localStorage.getItem(kPinned);
            if (savedPinned) {
              const list = JSON.parse(savedPinned);
              if (Array.isArray(list) && list.length > 0) {
                targetAlbum = list[0].id;
              }
            }
          }
        } catch {}
        setActiveAlbum(targetAlbum as AlbumFilterType);
        try {
          localStorage.setItem(kActiveAlbum, targetAlbum);
        } catch {}
      }

      return next;
    });
  }, [friendPlayback, friendLiveProgressMs, tracks, selectTrack, loadTrack, seekToSeconds, play, resolveTargetTrack]);

  // Direct connect to friend's live music session
  const handleConnectFriendSpotify = useCallback(() => {
    setIsFriendSyncConnected(true);
    setActiveAlbum('friend');
    try {
      localStorage.setItem(kFriendConn, 'true');
      localStorage.setItem(kActiveAlbum, 'friend');
    } catch {}

    if (friendPlayback?.track) {
      const target = resolveTargetTrack(friendPlayback.track, tracks);
      const currentFriendSec = Math.max(
        0,
        (friendLiveProgressMs > 0 ? friendLiveProgressMs : friendPlayback.progressMs || 0) / 1000
      );
      selectTrack(target);
      loadTrack(
        resolvePlayableUrl(target),
        target.bpm || 120,
        target.durationMs > 0 ? target.durationMs / 1000 : 235,
        true,
        currentFriendSec
      );
      if (currentFriendSec > 0) {
        seekToSeconds(currentFriendSec);
      }
      play();
    }
  }, [friendPlayback, friendLiveProgressMs, tracks, selectTrack, loadTrack, seekToSeconds, play, resolveTargetTrack]);

  // Set active friend Discord User ID and immediately sync if in friend mode
  const handleSetDiscordUserId = useCallback((id: string) => {
    // Reset track identity refs immediately so new friend's track is recognized and loaded fresh
    currentFriendTrackKeyRef.current = '';
    lastSyncedLyricsRef.current = '';
    lastSyncedPreviewUrlRef.current = '';
    lastFriendSeekTimeRef.current = 0;

    setDiscordUserId(id);
    try {
      localStorage.setItem(kDiscordId, id);
    } catch {}
    setIsFriendSyncConnected(true);
    setActiveAlbum('friend');
    try {
      localStorage.setItem(kFriendConn, 'true');
      localStorage.setItem(kActiveAlbum, 'friend');
    } catch {}
  }, [setDiscordUserId]);

  // Switch to Autonomous / Personal Music Mode (Saved Artist / Liked Songs / etc.)
  const handleSwitchToMyMusic = useCallback(() => {
    setIsFriendSyncConnected(false);
    try {
      localStorage.setItem(kFriendConn, 'false');
    } catch {}

    let targetAlbum = 'favorites';
    let targetEntity: PinnedServerItem | null = null;
    try {
      const savedAlbum = localStorage.getItem(kActiveAlbum);
      const savedEntityStr = localStorage.getItem(kActiveEntity);
      if (savedEntityStr) {
        targetEntity = JSON.parse(savedEntityStr);
      }
      if (savedAlbum && savedAlbum !== 'friend') {
        targetAlbum = savedAlbum;
      } else {
        const savedPinned = localStorage.getItem(kPinned);
        if (savedPinned) {
          const list = JSON.parse(savedPinned);
          if (Array.isArray(list) && list.length > 0) {
            targetAlbum = list[0].id;
            targetEntity = list[0];
          }
        }
      }
    } catch {}

    setActiveAlbum(targetAlbum as AlbumFilterType);
    if (targetEntity) {
      setCurrentAlbumEntity(targetEntity);
    }
    try {
      localStorage.setItem(kActiveAlbum, targetAlbum);
    } catch {}

    // Restore saved track or first available track
    const savedTrackStr = localStorage.getItem(kSavedTrack);
    let targetTrack: BackendRadioheadTrack | null = null;
    if (savedTrackStr) {
      try {
        targetTrack = JSON.parse(savedTrackStr);
      } catch {}
    }
    if (!targetTrack) {
      targetTrack = tracks.find((t) => matchesAlbumFilter(t, targetAlbum as AlbumFilterType, likedTrackIds)) || tracks[0];
    }

    if (targetTrack) {
      selectTrack(targetTrack);
      loadTrack(
        resolvePlayableUrl(targetTrack),
        targetTrack.bpm,
        targetTrack.durationMs > 0 ? targetTrack.durationMs / 1000 : 238,
        true
      );
    }
  }, [tracks, selectTrack, loadTrack, likedTrackIds]);

  // Listen Along with Friend: Matches song & syncs playtime position in real time!
  const handleListenAlong = useCallback(
    (trackTitle: string, progressMs: number) => {
      const normalizedTarget = trackTitle.toLowerCase().trim();
      const matchedTrack =
        tracks.find(
          (t) =>
            t.title.toLowerCase().includes(normalizedTarget) ||
            normalizedTarget.includes(t.title.toLowerCase())
        ) || tracks[0];

      if (matchedTrack) {
        selectTrack(matchedTrack);
        try {
          localStorage.setItem(kSavedTrackId, matchedTrack.id);
        } catch {}
        loadTrack(
          resolvePlayableUrl(matchedTrack),
          matchedTrack.bpm,
          matchedTrack.durationMs > 0 ? matchedTrack.durationMs / 1000 : 238,
          true
        );
        const seekSec = Math.max(0, progressMs / 1000);
        seekToSeconds(seekSec);
      }
    },
    [tracks, selectTrack, loadTrack, seekToSeconds]
  );

  // Synchronous Track Change Handler: Guarantees audio & lyrics stay 100% in sync and AUTOPLAYS
  const handleSelectTrack = useCallback((track: BackendRadioheadTrack) => {
    // If friend is not playing and user explicitly chose a track, switch to autonomous mode
    if (activeAlbum === 'friend' && friendPlayback && !friendPlayback.isPlaying) {
      setIsFriendSyncConnected(false);
    }

    try {
      localStorage.setItem(kSavedTrackId, track.id);
      localStorage.setItem(kSavedTrack, JSON.stringify(track));
      localStorage.setItem(kActiveAlbum, activeAlbum);
    } catch {}

    // On mobile, auto-navigate to player stage upon selecting a track
    setMobileView('player');

    if (isSameTrack(track, activeTrack)) {
      togglePlay();
    } else {
      selectTrack(track);
      loadTrack(
        resolvePlayableUrl(track),
        track.bpm,
        track.durationMs > 0 ? track.durationMs / 1000 : 238,
        true // Immediately start playing on click!
      );
    }
  }, [activeAlbum, friendPlayback, activeTrack, isPlaying, togglePlay, selectTrack, loadTrack]);

  // Persist manual queue & subscribe to RAM audio cache updates
  const updateManualQueue = useCallback(
    (updater: (prev: BackendRadioheadTrack[]) => BackendRadioheadTrack[]) => {
      didUserMutateRef.current = true;
      setManualQueue((prev) => {
        const next = updater(prev);
        safeLocalSet(kQueue, JSON.stringify(next.slice(0, 100)));
        return next;
      });
    },
    [kQueue]
  );

  useEffect(() => {
    return subscribeMediaCache(() => setCacheTick((n) => n + 1));
  }, []);

  const showQueueFeedback = useCallback((msg: string) => {
    setQueueToast(msg);
  }, []);

  useEffect(() => {
    if (!queueToast) return;
    const t = setTimeout(() => setQueueToast(null), 1800);
    return () => clearTimeout(t);
  }, [queueToast]);

  const handleAddToQueue = useCallback(
    (track: BackendRadioheadTrack) => {
      updateManualQueue((prev) => [...prev, track]);
      showQueueFeedback(`Ditambahkan ke antrian: ${track.title}`);
      // Pre-warm audio + lyrics immediately in background
      prefetchAudioTrack(resolvePlayableUrl(track)).catch(() => {});
      if (!track.syncedLyrics) {
        prefetchTrackLyrics(track.title, track.artist, track.durationMs).catch(() => {});
      }
    },
    [updateManualQueue, showQueueFeedback]
  );

  const handleRemoveQueuedTrack = useCallback(
    (index: number) => {
      updateManualQueue((prev) => prev.filter((_, i) => i !== index));
    },
    [updateManualQueue]
  );

  const handleMoveQueuedTrack = useCallback(
    (fromIndex: number, toIndex: number) => {
      updateManualQueue((prev) => {
        if (toIndex < 0 || toIndex >= prev.length || fromIndex === toIndex) return prev;
        const copy = [...prev];
        const [moved] = copy.splice(fromIndex, 1);
        copy.splice(toIndex, 0, moved);
        return copy;
      });
    },
    [updateManualQueue]
  );

  const handleClearQueue = useCallback(() => {
    updateManualQueue(() => []);
  }, [updateManualQueue]);

  // Deterministic Fisher-Yates shuffle order so random switching is instant & prefetched!
  useEffect(() => {
    const source = displayTracks.length > 0 ? displayTracks : tracks;
    if (!isShuffle || source.length <= 1) {
      setShuffleOrder([]);
      return;
    }
    const pool = source.filter((t) => !isSameTrack(t, activeTrack));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setShuffleOrder(pool);
  }, [isShuffle, activeAlbum, displayTracks.length]);

  const upcomingAutoTracks = useMemo(() => {
    const source = displayTracks.length > 0 ? displayTracks : tracks;
    if (source.length === 0) return [];
    if (isShuffle && shuffleOrder.length > 0) {
      return shuffleOrder.filter((t) => !isSameTrack(t, activeTrack));
    }
    const currentIdx = source.findIndex((t) => isSameTrack(t, activeTrack));
    if (currentIdx === -1) return source;
    return [...source.slice(currentIdx + 1), ...source.slice(0, currentIdx)];
  }, [displayTracks, tracks, isShuffle, shuffleOrder, activeTrack]);

  // Background Prefetcher: warms audio + lyrics for next 3 upcoming tracks (Queue first, then Shuffle/Next)
  useEffect(() => {
    const targets: BackendRadioheadTrack[] = [];
    const seen = new Set<string>();
    const addCandidate = (t?: BackendRadioheadTrack) => {
      if (!t || isSameTrack(t, activeTrack)) return;
      const key = `${t.artist.toLowerCase()}::${t.title.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      targets.push(t);
    };

    manualQueue.slice(0, 3).forEach(addCandidate);
    upcomingAutoTracks.slice(0, 3).forEach(addCandidate);
    const toPrefetch = targets.slice(0, 3);
    if (toPrefetch.length === 0) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      (async () => {
        for (const item of toPrefetch) {
          if (controller.signal.aborted) break;
          if (!item.syncedLyrics) {
            prefetchTrackLyrics(item.title, item.artist, item.durationMs).catch(() => {});
          }
          await prefetchAudioTrack(resolvePlayableUrl(item), controller.signal);
        }
      })();
    }, 850);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [activeTrack.id, manualQueue, upcomingAutoTracks]);

  const handlePlayQueuedTrack = useCallback(
    (index: number) => {
      const target = manualQueue[index];
      if (!target) return;
      updateManualQueue((prev) => prev.slice(index + 1));
      selectTrack(target);
      loadTrack(
        resolvePlayableUrl(target),
        target.bpm,
        target.durationMs > 0 ? target.durationMs / 1000 : 238,
        true
      );
    },
    [manualQueue, updateManualQueue, selectTrack, loadTrack]
  );

  const isTrackCached = useCallback((t: BackendRadioheadTrack) => {
    return isAudioInRamCache(resolvePlayableUrl(t));
  }, []);

  const handleNextTrack = useCallback(() => {
    // 1. Always drain manual Queue first
    if (manualQueue.length > 0) {
      const nextQueued = manualQueue[0];
      updateManualQueue((prev) => prev.slice(1));
      selectTrack(nextQueued);
      loadTrack(
        resolvePlayableUrl(nextQueued),
        nextQueued.bpm,
        nextQueued.durationMs > 0 ? nextQueued.durationMs / 1000 : 238,
        true
      );
      return;
    }

    // 2. Shuffle mode: pull from pre-computed (and pre-cached!) shuffleOrder
    const source = displayTracks.length > 0 ? displayTracks : tracks;
    if (source.length === 0) return;

    if (isShuffle) {
      let pool = shuffleOrder.filter((t) => !isSameTrack(t, activeTrack));
      if (pool.length === 0) {
        pool = source.filter((t) => !isSameTrack(t, activeTrack));
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
      }
      const nextTrk = pool[0] || source[0];
      setShuffleOrder(pool.slice(1));
      selectTrack(nextTrk);
      loadTrack(
        resolvePlayableUrl(nextTrk),
        nextTrk.bpm,
        nextTrk.durationMs > 0 ? nextTrk.durationMs / 1000 : 238,
        true
      );
      return;
    }

    // 3. Sequential next track
    const currentIdx = source.findIndex((t) => isSameTrack(t, activeTrack));
    const nextIndex = ((currentIdx >= 0 ? currentIdx : -1) + 1) % source.length;
    const nextTrk = source[nextIndex];
    selectTrack(nextTrk);
    loadTrack(
      resolvePlayableUrl(nextTrk),
      nextTrk.bpm,
      nextTrk.durationMs > 0 ? nextTrk.durationMs / 1000 : 238,
      true
    );
  }, [manualQueue, updateManualQueue, displayTracks, tracks, activeTrack, isShuffle, shuffleOrder, selectTrack, loadTrack]);

  const handlePrevTrack = useCallback(() => {
    const queue = displayTracks.length > 0 ? displayTracks : tracks;
    if (queue.length === 0) return;
    // If track has been playing for more than 3 seconds, rewind to beginning
    if (audioCurrentTimeSec > 3) {
      seekToSeconds(0);
      return;
    }

    const currentIdx = queue.findIndex((t) => isSameTrack(t, activeTrack));
    const prevIndex = ((currentIdx >= 0 ? currentIdx : 0) - 1 + queue.length) % queue.length;
    const prevTrk = queue[prevIndex];
    selectTrack(prevTrk);
    loadTrack(
      resolvePlayableUrl(prevTrk),
      prevTrk.bpm,
      prevTrk.durationMs > 0 ? prevTrk.durationMs / 1000 : 238,
      true // Immediately play on prev
    );
  }, [displayTracks, tracks, activeTrack.id, audioCurrentTimeSec, seekToSeconds, selectTrack, loadTrack]);

  // Keyboard Shortcuts: Space (Play/Pause), ArrowRight (Next), ArrowLeft (Prev)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextTrack();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevTrack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleNextTrack, handlePrevTrack]);

  const handleSeekFromLyrics = (timeMs: number) => {
    seekToSeconds(timeMs / 1000);
  };

  const isFriendMode = isFriendSyncConnected && activeAlbum === 'friend';
  const displayCurrentTimeMs = isFriendMode
    ? (isPlaying && audioCurrentTimeSec > 0 && Math.abs(audioCurrentTimeSec * 1000 - friendLiveProgressMs) < 2500
        ? audioCurrentTimeSec * 1000
        : friendLiveProgressMs)
    : audioCurrentTimeSec * 1000;
  const displayDurationMs = (isFriendMode && friendPlayback?.track?.durationMs)
    ? friendPlayback.track.durationMs
    : (activeTrack.durationMs > 0 ? activeTrack.durationMs : (audioDurationSec > 0 ? audioDurationSec * 1000 : 238000));

  return (
    <div className="h-[100dvh] w-full bg-[#0B0B0C] text-[#EEDFC7] flex flex-col overflow-hidden font-sans select-none">
      {/* 1. Clean Top Header */}
      <Navbar
        isBackendOnline={isBackendOnline}
        onRefreshBackend={refetchTracks}
        clientId={clientId}
        onSetClientId={setClientId}
        isAuthenticated={isAuthenticated}
        onLogin={login}
        onLogout={logout}
        isLoading={isLoadingSong}
        searchQuery={searchFilter}
        onSearchChange={setSearchFilter}
        friendTrackTitle={
          friendPlayback?.track?.title ||
          (friendPlayback?.friendName ? `${friendPlayback.friendName} (Standby)` : undefined)
        }
        isFriendConnected={isFriendSyncConnected}
        onConnectFriendSpotify={handleConnectFriendSpotify}
        mobileView={mobileView}
        onSelectMobileView={setMobileView}
        tracks={tracks}
        liveTracks={liveTracks}
        isLoadingLive={isLoadingLive}
        onSelectTrack={handleSelectTrack}
        activeTrackId={activeTrack.id}
        isPlaying={isPlaying}
        isLikedTrack={isLiked}
        onToggleLikeTrack={toggleLike}
        onAddToQueue={handleAddToQueue}
        authUser={authUser}
        onAccountLogout={() => {
          pause();
          flushAndLogout();
        }}
        onGoHome={() => {
          handleSelectAlbum('home');
          setMobileView('player');
        }}
      />

      {/* 2. Clean 3-Card Dark Matte Workspace */}
      <main className="flex-1 flex overflow-hidden min-h-0 bg-[#0B0B0C] md:px-3 md:py-2.5 md:gap-3 relative">
        {/* Col 1: Left Library Sidebar (Desktop) */}
        <div className="hidden md:block h-full flex-shrink-0">
          <DiscordServerRail
            activeAlbum={activeAlbum}
            onSelectAlbum={(alb, srv) => {
              handleSelectAlbum(alb, srv);
            }}
            onRefreshBackend={refetchTracks}
            isBackendOnline={isBackendOnline}
            customPlaylist={customPlaylist}
            likedCount={likedTrackIds.length}
            isFriendConnected={isFriendSyncConnected}
            pinnedServers={pinnedServers}
            onTogglePin={handleTogglePinServer}
            onSelectAndPin={(srv) => {
              handlePinServerIfNeeded(srv);
              handleSelectAlbum(srv.id as AlbumFilterType, srv);
              setMobileView('player');
            }}
            isAddModalOpenExternal={isAddArtistModalOpen}
            onSetAddModalOpenExternal={setIsAddArtistModalOpen}
          />
        </div>

        {/* Mobile Collections View (Clean Matte Koleksi) */}
        {mobileView === 'sidebar' && (
          <div className="flex-1 md:hidden h-full overflow-y-auto overflow-x-hidden bg-[#0B0B0C] px-3.5 py-3.5 space-y-5 custom-scrollbar">
            {/* Logged-in Account Strip */}
            <div className="p-2.5 rounded-xl bg-[#121213] border border-white/[0.07] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#53341A] flex items-center justify-center flex-shrink-0">
                  {authUser.avatarUrl ? (
                    <img
                      src={authUser.avatarUrl}
                      alt={authUser.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-[#EEDFC7] uppercase">
                      {authUser.name.slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#EEDFC7] truncate">{authUser.name}</p>
                  <p className="text-[11px] text-[#9A9288] truncate">{authUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  pause();
                  flushAndLogout();
                }}
                className="h-8 px-2.5 rounded-lg border border-white/[0.09] text-xs font-medium text-[#EEDFC7] flex items-center gap-1.5 flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-[#CE7F20]" />
                <span>Keluar</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#EEDFC7] tracking-tight">Koleksi</h2>
                <p className="text-xs text-[#9A9288]">Artis tersimpan &amp; playlist kamu</p>
              </div>
              <button
                onClick={() => setIsAddArtistModalOpen(true)}
                className="h-9 px-3.5 rounded-lg bg-[#CE7F20] text-[#0B0B0C] text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Tambah Artis</span>
              </button>
            </div>

            {/* Quick Shortcut Cards: Favorit & Live Sync */}
            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => {
                  handleSelectAlbum('favorites');
                  setMobileView('player');
                }}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer ${
                  activeAlbum === 'favorites'
                    ? 'bg-[#53341A]/40 border-[#CE7F20]/50'
                    : 'bg-[#121213] border-white/[0.07]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#19191B] flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-[#CE7F20] fill-[#CE7F20]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#EEDFC7] truncate">
                    {!customPlaylist.name || customPlaylist.name === 'Lagu Favorit Saya'
                      ? 'Favorit'
                      : customPlaylist.name}
                  </p>
                  <p className="text-[11px] text-[#9A9288]">{likedTrackIds.length} lagu</p>
                </div>
              </div>

              <div
                onClick={() => {
                  handleSelectAlbum('friend');
                  setMobileView('player');
                }}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer ${
                  activeAlbum === 'friend'
                    ? 'bg-[#53341A]/40 border-[#607938]'
                    : 'bg-[#121213] border-white/[0.07]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#19191B] flex items-center justify-center flex-shrink-0">
                  <Radio className="w-4 h-4 text-[#607938]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#EEDFC7] truncate">Live Sync</p>
                  <p className="text-[11px] text-[#9A9288] truncate">
                    {isFriendSyncConnected ? 'Terhubung' : 'Mode Mandiri'}
                  </p>
                </div>
              </div>
            </div>

            {/* Pinned Artists Section */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#68625B] px-0.5">
                Artis Tersimpan ({pinnedServers.length})
              </p>

              {pinnedServers.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#121213] border border-white/[0.07] text-center space-y-2.5">
                  <p className="text-xs text-[#9A9288]">Belum ada artis yang disematkan.</p>
                  <button
                    onClick={() => setIsAddArtistModalOpen(true)}
                    className="h-8 px-4 rounded-lg bg-[#CE7F20] text-xs font-semibold text-[#0B0B0C]"
                  >
                    Cari Artis Sekarang
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {pinnedServers.map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() => {
                        handleSelectAlbum(srv.id, srv);
                        setMobileView('player');
                      }}
                      className={`px-3 py-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer ${
                        activeAlbum === srv.id
                          ? 'bg-[#53341A]/40 border-[#CE7F20]/45'
                          : 'bg-[#121213] border-white/[0.07]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#19191B] border border-white/[0.07] flex-shrink-0 relative flex items-center justify-center">
                          <span className="text-xs font-semibold text-[#9A9288] uppercase select-none">
                            {srv.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3) || '♪'}
                          </span>
                          {isValidImageUrl(srv.imageUrl) && (
                            <img
                              src={srv.imageUrl}
                              alt={srv.name}
                              className="w-full h-full object-cover absolute inset-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${activeAlbum === srv.id ? 'text-[#CE7F20]' : 'text-[#EEDFC7]'}`}>
                            {srv.name}
                          </p>
                          <p className="text-xs text-[#9A9288]">Artis</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePinServer(srv);
                        }}
                        className="p-2 rounded-lg text-[#68625B] flex-shrink-0"
                        aria-label="Hapus artis"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Center & Right Stage: Home / Main Showcase + Collapsible Lyrics / Queue */}
        <div className={`flex-1 h-full min-w-0 p-2 sm:p-2.5 md:p-0 gap-3 overflow-hidden ${mobileView === 'sidebar' ? 'hidden md:flex' : 'flex'}`}>
          <div className={`flex-1 h-full min-w-0 ${mobileView === 'lyrics' || mobileView === 'queue' ? 'hidden lg:block' : 'block'}`}>
            {activeAlbum === 'home' ? (
              <HomeFeed
                userName={authUser.name}
                data={homeDiscovery}
                isLoading={isLoadingHome}
                activeTrack={activeTrack}
                isPlaying={isPlaying}
                onSelectTrack={(trk, list) => {
                  setHomePlaybackList(list);
                  handleSelectTrack(trk);
                }}
                onTogglePlay={togglePlay}
                onRefresh={() => loadHomeFeed(true)}
                isLikedTrack={isLiked}
                onToggleLikeTrack={toggleLike}
                onAddToQueue={handleAddToQueue}
              />
            ) : (
              <AlbumShowcase
                track={activeTrack}
                tracks={displayTracks}
                activeTrackId={activeTrack.id}
                colors={albumColors}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                onSelectTrack={handleSelectTrack}
                friendStandbyInfo={{
                  friendName: friendPlayback?.friendName || 'Teman',
                  avatarUrl: friendPlayback?.avatarUrl,
                  isStandby: Boolean(
                    isFriendSyncConnected &&
                    activeAlbum === 'friend' &&
                    friendPlayback &&
                    !friendPlayback.isPlaying &&
                    !friendPlayback.track
                  ),
                }}
                friendHeaderSlot={
                  <FriendSpotifyCard
                    playbackState={friendPlayback}
                    liveProgressMs={friendLiveProgressMs}
                    isLoading={isLoadingFriend}
                    isConnecting={isConnectingFriend}
                    isConnected={isFriendSyncConnected}
                    discordUserId={discordUserId}
                    friendsLiveMap={friendsLiveMap}
                    onSetDiscordUserId={handleSetDiscordUserId}
                    onConnectSpotify={handleConnectFriendSpotify}
                    onRefresh={refetchFriendSpotify}
                    onToggleConnect={handleToggleFriendSync}
                    onSwitchToMyMusic={handleSwitchToMyMusic}
                  />
                }
                activeAlbum={activeAlbum}
                albumEntity={currentAlbumEntity}
                customPlaylist={customPlaylist}
                onOpenEditModal={() => setIsEditPlaylistModalOpen(true)}
                isLikedTrack={isLiked}
                onToggleLikeTrack={toggleLike}
                onAddToQueue={handleAddToQueue}
                onToggleShuffle={toggleShuffle}
                isShuffle={isShuffle}
              />
            )}
          </div>

          {/* Right Lyrics Panel */}
          {(showLyrics || mobileView === 'lyrics') && (
            <div className={`h-full flex-shrink-0 ${
              mobileView === 'lyrics'
                ? 'w-full block lg:w-[330px] xl:w-[375px]'
                : 'hidden lg:block lg:w-[330px] xl:w-[375px]'
            }`}>
              <DynamicLyrics
                lyrics={lyrics}
                plainLyrics={plainLyrics}
                currentProgressMs={displayCurrentTimeMs}
                colors={albumColors}
                isLoading={isLoadingSong}
                onSeek={handleSeekFromLyrics}
                trackTitle={activeTrack.title}
              />
            </div>
          )}

          {/* Right Queue (Antrian) Panel */}
          {(showQueue || mobileView === 'queue') && (
            <div className={`h-full flex-shrink-0 ${
              mobileView === 'queue'
                ? 'w-full block lg:w-[330px] xl:w-[375px]'
                : 'hidden lg:block lg:w-[330px] xl:w-[375px]'
            }`}>
              <QueuePanel
                activeTrack={activeTrack}
                isPlaying={isPlaying}
                manualQueue={manualQueue}
                upcomingTracks={upcomingAutoTracks}
                isShuffle={isShuffle}
                isTrackCached={isTrackCached}
                onPlayQueuedTrack={handlePlayQueuedTrack}
                onRemoveQueuedTrack={handleRemoveQueuedTrack}
                onMoveQueuedTrack={handleMoveQueuedTrack}
                onClearQueue={handleClearQueue}
                onSelectUpcomingTrack={handleSelectTrack}
              />
            </div>
          )}
        </div>
      </main>

      {/* Subtle Matte Queue Toast */}
      {queueToast && (
        <div className="fixed bottom-32 md:bottom-24 left-1/2 -translate-x-1/2 z-[60] px-3.5 py-2 rounded-lg bg-[#19191B] border border-[#CE7F20]/50 text-xs text-[#EEDFC7] max-w-[90vw] truncate pointer-events-none">
          {queueToast}
        </div>
      )}

      {/* 3. Studio Playback Console */}
      <PlayerBar
        trackTitle={activeTrack.title}
        artistName={activeTrack.artist}
        albumName={activeTrack.album}
        albumImageUrl={activeTrack.coverUrl}
        currentTimeSec={displayCurrentTimeMs / 1000}
        durationSec={displayDurationMs / 1000}
        bpm={activeTrack.bpm}
        mood={activeTrack.mood}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onNextTrack={handleNextTrack}
        onPrevTrack={handlePrevTrack}
        isShuffle={isShuffle}
        onToggleShuffle={toggleShuffle}
        isRepeat={isRepeat}
        onToggleRepeat={toggleRepeat}
        volume={volume}
        onVolumeChange={setVolume}
        onSeek={seekToSeconds}
        colors={albumColors}
        beatPulse={visualizerData.beatPulse}
        showLyrics={showLyrics}
        onToggleLyrics={() => {
          setRightPanelMode((prev) => (prev === 'lyrics' ? null : 'lyrics'));
          if (window.innerWidth < 1024) {
            setMobileView((prev) => (prev === 'lyrics' ? 'player' : 'lyrics'));
          }
        }}
        showQueue={showQueue}
        queueCount={manualQueue.length}
        onToggleQueue={() => {
          setRightPanelMode((prev) => (prev === 'queue' ? null : 'queue'));
          if (window.innerWidth < 1024) {
            setMobileView((prev) => (prev === 'queue' ? 'player' : 'queue'));
          }
        }}
        onOpenPlayer={() => setMobileView('player')}
        isLiked={isLiked(activeTrack.id)}
        onToggleLike={() => toggleLike(activeTrack)}
      />

      {/* 3.5 Dedicated Mobile Bottom Navigation Bar (4 Clean Tabs: Beranda, Lirik, Antrian, Koleksi) */}
      <nav className="md:hidden w-full bg-[#0B0B0C] border-t border-white/[0.07] px-2 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] grid grid-cols-4 gap-1 flex-shrink-0 z-40">
        <button
          onClick={() => {
            if (mobileView === 'player' && activeAlbum !== 'home') {
              handleSelectAlbum('home');
            } else {
              setMobileView('player');
            }
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg ${
            mobileView === 'player' ? 'text-[#EEDFC7]' : 'text-[#68625B]'
          }`}
        >
          <Home className={`w-5 h-5 ${mobileView === 'player' ? 'text-[#CE7F20]' : ''}`} />
          <span className="text-[10px] font-medium">Beranda</span>
        </button>

        <button
          onClick={() => setMobileView('lyrics')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg ${
            mobileView === 'lyrics' ? 'text-[#EEDFC7]' : 'text-[#68625B]'
          }`}
        >
          <Mic2 className={`w-5 h-5 ${mobileView === 'lyrics' ? 'text-[#CE7F20]' : ''}`} />
          <span className="text-[10px] font-medium">Lirik</span>
        </button>

        <button
          onClick={() => setMobileView('queue')}
          className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg ${
            mobileView === 'queue' ? 'text-[#EEDFC7]' : 'text-[#68625B]'
          }`}
        >
          <div className="relative">
            <ListMusic className={`w-5 h-5 ${mobileView === 'queue' ? 'text-[#CE7F20]' : ''}`} />
            {manualQueue.length > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-[14px] h-[14px] px-1 rounded-full bg-[#CE7F20] text-[#0B0B0C] text-[9px] font-bold flex items-center justify-center leading-none">
                {manualQueue.length > 9 ? '9+' : manualQueue.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Antrian</span>
        </button>

        <button
          onClick={() => setMobileView('sidebar')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg ${
            mobileView === 'sidebar' ? 'text-[#EEDFC7]' : 'text-[#68625B]'
          }`}
        >
          <Library className={`w-5 h-5 ${mobileView === 'sidebar' ? 'text-[#CE7F20]' : ''}`} />
          <span className="text-[10px] font-medium">Koleksi</span>
        </button>
      </nav>

      {/* 4. Root-level Add Artist Modal (Works identically on both Mobile & Desktop) */}
      <AddAlbumModal
        isOpen={isAddArtistModalOpen}
        onClose={() => setIsAddArtistModalOpen(false)}
        pinnedServers={pinnedServers}
        onTogglePin={handleTogglePinServer}
        onSelectAndPin={(srv) => {
          handlePinServerIfNeeded(srv);
          handleSelectAlbum(srv.id as AlbumFilterType, srv);
          setMobileView('player');
          setIsAddArtistModalOpen(false);
        }}
      />

      {/* 5. Edit Custom Playlist Modal */}
      <EditPlaylistModal
        isOpen={isEditPlaylistModalOpen}
        onClose={() => setIsEditPlaylistModalOpen(false)}
        initialName={customPlaylist.name}
        initialDescription={customPlaylist.description}
        initialCoverUrl={customPlaylist.coverUrl}
        onSave={(data) => {
          updatePlaylist(data);
          setIsEditPlaylistModalOpen(false);
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getSavedSessionUser());
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(() => {
    return hasPendingGoogleCallback() || !getSavedSessionUser();
  });

  useEffect(() => {
    let active = true;
    (async () => {
      // 1. Process Google OAuth redirect callback via module-level singleton (safe under React StrictMode!)
      if (hasPendingGoogleCallback()) {
        const result = await consumeGoogleOAuthCallback();
        if (!active) return;
        if (result?.user) {
          setAuthUser(result.user);
          setAuthError(null);
        } else if (result?.error) {
          setAuthError(result.error);
        }
        setIsCheckingSession(false);
        return;
      }

      // 2. Restore existing session from local storage or HttpOnly server cookie
      try {
        const user = await restoreAuthSession();
        if (active && user) {
          setAuthUser(user);
        }
      } finally {
        if (active) setIsCheckingSession(false);
      }
    })();

    const onHashChange = async () => {
      if (!hasPendingGoogleCallback()) return;
      setIsCheckingSession(true);
      const result = await consumeGoogleOAuthCallback();
      if (!active) return;
      if (result?.user) {
        setAuthUser(result.user);
        setAuthError(null);
      } else if (result?.error) {
        setAuthError(result.error);
      }
      setIsCheckingSession(false);
    };

    window.addEventListener('hashchange', onHashChange);

    return () => {
      active = false;
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  useEffect(() => {
    if (authUser) {
      saveSessionUser(authUser);
    }
  }, [authUser]);

  const handleAccountLogout = useCallback(async () => {
    await logoutAccount();
    setAuthUser(null);
  }, []);

  if (isCheckingSession) {
    return (
      <div className="h-[100dvh] w-full bg-[#0B0B0C] text-[#9A9288] flex items-center justify-center text-xs">
        Memuat sesi...
      </div>
    );
  }

  if (!authUser) {
    return (
      <AuthScreen
        initialError={authError}
        onAuthenticated={(u) => {
          saveSessionUser(u);
          setAuthError(null);
          setAuthUser(u);
        }}
      />
    );
  }

  return (
    <AuthenticatedApp
      key={authUser.email}
      authUser={authUser}
      onAccountLogout={handleAccountLogout}
    />
  );
};
