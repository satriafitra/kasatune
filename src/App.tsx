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
import { Plus, Heart, Radio, X, Disc3, Mic2, Library } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { DiscordServerRail, type AlbumFilterType } from './components/DiscordServerRail';
import { matchesAlbumFilter } from './components/TrackListSidebar';
import { AlbumShowcase } from './components/AlbumShowcase';
import { DynamicLyrics } from './components/DynamicLyrics';
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
import { searchLiveMusic, fetchAlbumTracks, fetchArtistTracks, buildStreamUrl, searchLiveArtists, isValidImageUrl, isSameTrack } from './api/liveSearch';
import { AddAlbumModal, CATALOG_ALBUMS, type PinnedServerItem } from './components/AddAlbumModal';

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

export const App: React.FC = () => {
  const [showLyrics, setShowLyrics] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [liveTracks, setLiveTracks] = useState<BackendRadioheadTrack[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<'player' | 'lyrics' | 'sidebar'>('player');
  const [isEditPlaylistModalOpen, setIsEditPlaylistModalOpen] = useState(false);
  const [isAddArtistModalOpen, setIsAddArtistModalOpen] = useState(false);
  const [pinnedServers, setPinnedServers] = useState<PinnedServerItem[]>(() => {
    try {
      const saved = localStorage.getItem('kasatune_pinned_artists_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => {
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
            // Repair broken Genius/empty-silhouette artist image URLs from earlier sessions
            if (item?.id === 'sheilaon7' && !isValidImageUrl(item.imageUrl)) {
              return {
                ...item,
                imageUrl: 'https://cdn-images.dzcdn.net/images/artist/9e6cc50e80a7dcb4dacc7eb15427335b/1000x1000-000000-80-0-0.jpg',
              };
            }
            return item;
          });
        }
      }
    } catch {}
    return [];
  });

  const handleTogglePinServer = useCallback((server: PinnedServerItem) => {
    setPinnedServers((prev) => {
      const exists = prev.some((s) => s.id === server.id);
      const next = exists ? prev.filter((s) => s.id !== server.id) : [...prev, server];
      try {
        localStorage.setItem('kasatune_pinned_artists_v4', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

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
        try {
          localStorage.setItem('kasatune_pinned_artists_v4', JSON.stringify(next));
        } catch {}
      }
      return changed ? next : prev;
    });
    setCurrentAlbumEntity((prev) => {
      if (prev && prev.id === serverId && !isValidImageUrl(prev.imageUrl)) {
        const updated = { ...prev, imageUrl: newImageUrl };
        try {
          localStorage.setItem('kasatune_active_entity', JSON.stringify(updated));
        } catch {}
        return updated;
      }
      return prev;
    });
  }, []);

  const [onlineAlbumTracks, setOnlineAlbumTracks] = useState<Record<string, BackendRadioheadTrack[]>>(() => {
    try {
      const saved = localStorage.getItem('kasatune_online_tracks_cache_v3');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });
  const [isLoadingOnlineAlbum, setIsLoadingOnlineAlbum] = useState<boolean>(false);

  const updateOnlineAlbumTracks = useCallback((key: string, songs: BackendRadioheadTrack[]) => {
    setOnlineAlbumTracks((prev) => {
      const next = { ...prev, [key]: songs };
      try {
        localStorage.setItem('kasatune_online_tracks_cache_v3', JSON.stringify(next));
      } catch {}
      return next;
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

  // Session & Condition Persistence: Restore the exact last condition on refresh
  const [activeAlbum, setActiveAlbum] = useState<AlbumFilterType>(() => {
    try {
      const saved = localStorage.getItem('kasatune_active_album');
      if (saved && saved !== 'all') return saved as AlbumFilterType;

      const savedPinned = localStorage.getItem('kasatune_pinned_artists_v4');
      if (savedPinned) {
        const list = JSON.parse(savedPinned);
        if (Array.isArray(list) && list.length > 0 && list[0].id) {
          return list[0].id as AlbumFilterType;
        }
      }
    } catch {}
    return 'favorites';
  });

  const [isFriendSyncConnected, setIsFriendSyncConnected] = useState<boolean>(() => {
    try {
      const savedConnected = localStorage.getItem('kasatune_is_friend_connected');
      const savedAlbum = localStorage.getItem('kasatune_active_album');
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
      const saved = localStorage.getItem('kasatune_active_entity');
      if (saved) return JSON.parse(saved);

      const savedAlbum = localStorage.getItem('kasatune_active_album');
      const savedPinned = localStorage.getItem('kasatune_pinned_artists_v4');
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

  // 2. Radiohead Discography & Music Sync
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
  } = useMusicSync();

  // 2.1 User Custom Playlist & Liked Songs Hub
  const {
    playlist: customPlaylist,
    likedTracks,
    likedTrackIds,
    isLiked,
    toggleLike,
    updatePlaylist,
  } = useCustomPlaylist(tracks);

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

        const savedTrackStr = localStorage.getItem('kasatune_saved_track');
        let savedTrack: BackendRadioheadTrack | null = null;
        if (savedTrackStr) {
          try {
            savedTrack = JSON.parse(savedTrackStr);
          } catch {}
        }

        const savedTrackId = localStorage.getItem('kasatune_saved_track_id');
        const savedTimeStr = localStorage.getItem('kasatune_saved_playtime');
        const savedTime = savedTimeStr ? parseFloat(savedTimeStr) : 0;

        const onlineTracksForActive = activeAlbum ? onlineAlbumTracks[activeAlbum] : undefined;
        const targetTrack =
          savedTrack ||
          (savedTrackId && (tracks.find((t) => t.id === savedTrackId) || onlineTracksForActive?.find((t) => t.id === savedTrackId))) ||
          (onlineTracksForActive && onlineTracksForActive.length > 0 && onlineTracksForActive[0]) ||
          (activeAlbum && activeAlbum !== 'friend' && tracks.find((t) => matchesAlbumFilter(t, activeAlbum, likedTrackIds))) ||
          tracks.find((t) => t.category === 'vander') ||
          tracks[0];

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

  // Filter tracks based on active Discord Server or Custom Playlist
  const displayTracks = useMemo(() => {
    if (activeAlbum === 'favorites') {
      return likedTracks;
    }
    if (onlineAlbumTracks[activeAlbum] && onlineAlbumTracks[activeAlbum].length > 0) {
      return onlineAlbumTracks[activeAlbum];
    }

    return tracks.filter((t) => matchesAlbumFilter(t, activeAlbum, likedTrackIds));
  }, [tracks, activeAlbum, likedTracks, likedTrackIds, onlineAlbumTracks]);

  // Auto-fetch artist / album popular tracks on refresh or category load
  useEffect(() => {
    if (!activeAlbum || activeAlbum === 'friend' || activeAlbum === 'favorites') return;
    if (onlineAlbumTracks[activeAlbum] && onlineAlbumTracks[activeAlbum].length > 0) return;

    let isSubscribed = true;
    const loadCategoryTracks = async () => {
      let entity = currentAlbumEntity;
      if (!entity) {
        entity = CATALOG_ALBUMS.find((c) => c.id === activeAlbum) || null;
      }
      if (!entity) {
        try {
          const savedPinned = localStorage.getItem('kasatune_pinned_artists_v4');
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
      try {
        localStorage.setItem('kasatune_active_album', album);
      } catch {}

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
          localStorage.setItem('kasatune_active_entity', JSON.stringify(resolvedEntity));
        } else {
          localStorage.removeItem('kasatune_active_entity');
        }
      } catch {}

      if (album === 'favorites') {
        if (likedTracks.length > 0) {
          const firstLiked = likedTracks[0];
          selectTrack(firstLiked);
          try {
            localStorage.setItem('kasatune_saved_track_id', firstLiked.id);
            localStorage.setItem('kasatune_saved_track', JSON.stringify(firstLiked));
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
          localStorage.setItem('kasatune_is_friend_connected', 'true');
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
            localStorage.setItem('kasatune_saved_track_id', first.id);
            localStorage.setItem('kasatune_saved_track', JSON.stringify(first));
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
          tracks.find((t) => t.category === 'vander');
        if (matchedTrack) {
          selectTrack(matchedTrack);
          try {
            localStorage.setItem('kasatune_saved_track_id', matchedTrack.id);
            localStorage.setItem('kasatune_saved_track', JSON.stringify(matchedTrack));
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
        localStorage.setItem('kasatune_is_friend_connected', String(next));
      } catch {}

      if (next) {
        setActiveAlbum('friend');
        try {
          localStorage.setItem('kasatune_active_album', 'friend');
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
          const savedAlbum = localStorage.getItem('kasatune_active_album');
          if (savedAlbum && savedAlbum !== 'friend') {
            targetAlbum = savedAlbum;
          } else {
            const savedPinned = localStorage.getItem('kasatune_pinned_artists_v4');
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
          localStorage.setItem('kasatune_active_album', targetAlbum);
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
      localStorage.setItem('kasatune_is_friend_connected', 'true');
      localStorage.setItem('kasatune_active_album', 'friend');
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
      localStorage.setItem('kasatune_discord_user_id', id);
    } catch {}
    setIsFriendSyncConnected(true);
    setActiveAlbum('friend');
    try {
      localStorage.setItem('kasatune_is_friend_connected', 'true');
      localStorage.setItem('kasatune_active_album', 'friend');
    } catch {}
  }, [setDiscordUserId]);

  // Switch to Autonomous / Personal Music Mode (Saved Artist / Liked Songs / etc.)
  const handleSwitchToMyMusic = useCallback(() => {
    setIsFriendSyncConnected(false);
    try {
      localStorage.setItem('kasatune_is_friend_connected', 'false');
    } catch {}

    let targetAlbum = 'favorites';
    let targetEntity: PinnedServerItem | null = null;
    try {
      const savedAlbum = localStorage.getItem('kasatune_active_album');
      const savedEntityStr = localStorage.getItem('kasatune_active_entity');
      if (savedEntityStr) {
        targetEntity = JSON.parse(savedEntityStr);
      }
      if (savedAlbum && savedAlbum !== 'friend') {
        targetAlbum = savedAlbum;
      } else {
        const savedPinned = localStorage.getItem('kasatune_pinned_artists_v4');
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
      localStorage.setItem('kasatune_active_album', targetAlbum);
    } catch {}

    // Restore saved track or first available track
    const savedTrackStr = localStorage.getItem('kasatune_saved_track');
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
          localStorage.setItem('kasatune_saved_track_id', matchedTrack.id);
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
      localStorage.setItem('kasatune_saved_track_id', track.id);
      localStorage.setItem('kasatune_saved_track', JSON.stringify(track));
      localStorage.setItem('kasatune_active_album', activeAlbum);
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

  const handleNextTrack = useCallback(() => {
    const queue = displayTracks.length > 0 ? displayTracks : tracks;
    if (queue.length === 0) return;
    const currentIdx = queue.findIndex((t) => isSameTrack(t, activeTrack));
    const nextIndex = isShuffle
      ? Math.floor(Math.random() * queue.length)
      : ((currentIdx >= 0 ? currentIdx : -1) + 1) % queue.length;

    const nextTrk = queue[nextIndex];
    selectTrack(nextTrk);
    loadTrack(
      resolvePlayableUrl(nextTrk),
      nextTrk.bpm,
      nextTrk.durationMs > 0 ? nextTrk.durationMs / 1000 : 238,
      true // Immediately play on next
    );
  }, [displayTracks, tracks, activeTrack, isShuffle, selectTrack, loadTrack]);

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
    <div className="h-[100dvh] w-full bg-[#0A0908] text-[#FAF6F2] flex flex-col overflow-hidden font-sans select-none">
      {/* 1. Kasatune Studio Top Header with Live Search */}
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
      />

      {/* 2. 3-Card Bento Studio Workspace (Left Library Card + Main Stage + Lyrics Card) */}
      <main className="flex-1 flex overflow-hidden min-h-0 bg-[#0A0908] md:px-3 md:py-2.5 md:gap-3 relative">
        {/* Col 1: Editorial Left Library Card (Desktop) */}
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
              setPinnedServers((prev) => {
                if (!prev.some((s) => s.id === srv.id)) {
                  const next = [...prev, srv];
                  try {
                    localStorage.setItem('kasatune_pinned_artists_v4', JSON.stringify(next));
                  } catch {}
                  return next;
                }
                return prev;
              });
              handleSelectAlbum(srv.id as AlbumFilterType, srv);
              setMobileView('player');
            }}
            isAddModalOpenExternal={isAddArtistModalOpen}
            onSetAddModalOpenExternal={setIsAddArtistModalOpen}
          />
        </div>

        {/* Mobile Collections View (Dedicated clean mobile Koleksi tab) */}
        {mobileView === 'sidebar' && (
          <div className="flex-1 md:hidden h-full overflow-y-auto overflow-x-hidden bg-[#0A0908] px-3.5 py-3.5 space-y-5 custom-scrollbar">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#FAF6F2] tracking-tight">Koleksi</h2>
                <p className="text-xs text-[#8A817A]">Artis tersimpan &amp; playlist kamu</p>
              </div>
              <button
                onClick={() => setIsAddArtistModalOpen(true)}
                className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#FF6B2B] to-[#FF8A3D] text-[#0A0908] text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform flex-shrink-0 shadow-[0_4px_14px_rgba(255,107,43,0.3)]"
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
                className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer active:scale-[0.98] transition-all ${
                  activeAlbum === 'favorites'
                    ? 'bg-[#FF6B2B]/15 border-[#FF6B2B]/40'
                    : 'bg-[#151210] border-white/[0.07]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#FF6B2B]/15 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-[#FF6B2B] fill-[#FF6B2B]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#FAF6F2] truncate">
                    {!customPlaylist.name || customPlaylist.name === 'Lagu Favorit Saya'
                      ? 'Favorit'
                      : customPlaylist.name}
                  </p>
                  <p className="text-[11px] text-[#8A817A]">{likedTrackIds.length} lagu</p>
                </div>
              </div>

              <div
                onClick={() => {
                  handleSelectAlbum('friend');
                  setMobileView('player');
                }}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer active:scale-[0.98] transition-all ${
                  activeAlbum === 'friend'
                    ? 'bg-[#FF6B2B]/15 border-[#FF6B2B]/40'
                    : 'bg-[#151210] border-white/[0.07]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#FFA14A]/15 flex items-center justify-center flex-shrink-0">
                  <Radio className="w-4 h-4 text-[#FFA14A]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#FAF6F2] truncate">Live Sync</p>
                  <p className="text-[11px] text-[#8A817A] truncate">
                    {isFriendSyncConnected ? 'Terhubung' : 'Mode Mandiri'}
                  </p>
                </div>
              </div>
            </div>

            {/* Pinned Artists Section */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#756E68] px-0.5">
                Artis Tersimpan ({pinnedServers.length})
              </p>

              {pinnedServers.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#151210] border border-dashed border-white/[0.08] text-center space-y-2.5">
                  <p className="text-xs text-[#8A817A]">Belum ada artis yang disematkan.</p>
                  <button
                    onClick={() => setIsAddArtistModalOpen(true)}
                    className="h-8 px-4 rounded-xl bg-[#FF6B2B]/15 border border-[#FF6B2B]/35 text-xs font-semibold text-[#FF8A4C] active:bg-[#FF6B2B]/25"
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
                      className={`px-3 py-2.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all ${
                        activeAlbum === srv.id
                          ? 'bg-[#FF6B2B]/15 border-[#FF6B2B]/40'
                          : 'bg-[#151210] border-white/[0.07]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#1D1A17] border border-white/[0.06] flex-shrink-0 relative flex items-center justify-center">
                          <span className="text-xs font-bold text-[#A8A099] uppercase select-none">
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
                          <p className={`text-sm font-semibold truncate ${activeAlbum === srv.id ? 'text-[#FFA14A]' : 'text-[#FAF6F2]'}`}>
                            {srv.name}
                          </p>
                          <p className="text-xs text-[#8A817A]">Artis</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePinServer(srv);
                        }}
                        className="p-2 rounded-xl text-[#756E68] active:text-[#FF6B2B] active:bg-white/5 flex-shrink-0"
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

        {/* Center & Right Stage: Main Showcase + Collapsible Lyrics */}
        <div className={`flex-1 h-full min-w-0 p-2 sm:p-2.5 md:p-0 gap-3 overflow-hidden ${mobileView === 'sidebar' ? 'hidden md:flex' : 'flex'}`}>
          <div className={`flex-1 h-full min-w-0 ${mobileView === 'lyrics' ? 'hidden lg:block' : 'block'}`}>
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
              onToggleShuffle={toggleShuffle}
              isShuffle={isShuffle}
            />
          </div>

          {/* Right Lyrics Panel (Collapsible) */}
          {(showLyrics || mobileView === 'lyrics') && (
            <div className={`h-full flex-shrink-0 animate-in fade-in duration-200 ${
              mobileView === 'lyrics'
                ? 'w-full block lg:w-[340px] xl:w-[390px]'
                : 'hidden lg:block lg:w-[340px] xl:w-[390px]'
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
        </div>
      </main>

      {/* 3. Official Spotify Playback Dock */}
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
          setShowLyrics((prev) => !prev);
          if (window.innerWidth < 1024) {
            setMobileView((prev) => (prev === 'lyrics' ? 'player' : 'lyrics'));
          }
        }}
        onOpenPlayer={() => setMobileView('player')}
        isLiked={isLiked(activeTrack.id)}
        onToggleLike={() => toggleLike(activeTrack)}
      />

      {/* 3.5 Dedicated Mobile Bottom Navigation Bar (Warm Obsidian + Orange Active Pill) */}
      <nav className="md:hidden w-full bg-[#0A0908]/95 backdrop-blur-xl border-t border-white/[0.07] px-3 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] grid grid-cols-3 gap-1.5 flex-shrink-0 z-40">
        <button
          onClick={() => setMobileView('player')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all ${
            mobileView === 'player'
              ? 'bg-[#FF6B2B]/15 text-[#FF8A4C]'
              : 'text-[#8A817A]'
          }`}
        >
          <Disc3 className={`w-5 h-5 ${mobileView === 'player' ? 'text-[#FF6B2B]' : ''}`} />
          <span className="text-[10px] font-semibold">Lagu</span>
        </button>

        <button
          onClick={() => setMobileView('lyrics')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all ${
            mobileView === 'lyrics'
              ? 'bg-[#FF6B2B]/15 text-[#FF8A4C]'
              : 'text-[#8A817A]'
          }`}
        >
          <Mic2 className={`w-5 h-5 ${mobileView === 'lyrics' ? 'text-[#FF6B2B]' : ''}`} />
          <span className="text-[10px] font-semibold">Lirik</span>
        </button>

        <button
          onClick={() => setMobileView('sidebar')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all ${
            mobileView === 'sidebar'
              ? 'bg-[#FF6B2B]/15 text-[#FF8A4C]'
              : 'text-[#8A817A]'
          }`}
        >
          <Library className={`w-5 h-5 ${mobileView === 'sidebar' ? 'text-[#FF6B2B]' : ''}`} />
          <span className="text-[10px] font-semibold">Koleksi</span>
        </button>
      </nav>

      {/* 4. Root-level Add Artist Modal (Works identically on both Mobile & Desktop) */}
      <AddAlbumModal
        isOpen={isAddArtistModalOpen}
        onClose={() => setIsAddArtistModalOpen(false)}
        pinnedServers={pinnedServers}
        onTogglePin={handleTogglePinServer}
        onSelectAndPin={(srv) => {
          setPinnedServers((prev) => {
            if (!prev.some((s) => s.id === srv.id)) {
              const next = [...prev, srv];
              try {
                localStorage.setItem('kasatune_pinned_artists_v4', JSON.stringify(next));
              } catch {}
              return next;
            }
            return prev;
          });
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
