/**
 * App Component (Kasatune: Discord x Spotify Hybrid Architecture)
 * Unique, compelling layout architecture:
 * - Leftmost Discord Server Rail (Official album icons with squircle morphing & pill markers)
 * - Discord Channel Drawer (Category channels & instant-play tracks)
 * - Grand Vinyl Studio Stage (Spinning collector's vinyl disc, album metadata & discography table)
 * - High-Impact Kinetic Lyrics Theater (Apple Music / Spotify Sing full-height synced lyrics)
 * - Persistent Bottom Dock with Kasatune Warm Sunset Palette (#FFEAD3, #BFE7EA, #E89B5B, #D46743)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DiscordServerRail, type AlbumFilterType } from './components/DiscordServerRail';
import { TrackListSidebar, matchesAlbumFilter } from './components/TrackListSidebar';
import { AlbumShowcase } from './components/AlbumShowcase';
import { DynamicLyrics } from './components/DynamicLyrics';
import { PlayerBar } from './components/PlayerBar';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import { useMusicSync } from './hooks/useMusicSync';
import { useAlbumColor } from './hooks/useAlbumColor';
import { useAudioVisualizer } from './hooks/useAudioVisualizer';
import { useFriendSpotify } from './hooks/useFriendSpotify';
import type { BackendRadioheadTrack } from './api/backend';

export const App: React.FC = () => {
  const [showLyrics, setShowLyrics] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [mobileView, setMobileView] = useState<'player' | 'lyrics' | 'sidebar'>('sidebar');

  // Session & Condition Persistence: Restore the exact last condition on refresh
  const [activeAlbum, setActiveAlbum] = useState<AlbumFilterType>(() => {
    try {
      const saved = localStorage.getItem('kasatune_active_album');
      if (saved) return saved as AlbumFilterType;
    } catch {}
    return 'all';
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

  // 3. Dynamic Color Extraction from Album Art via ColorThief
  const albumColors = useAlbumColor(activeTrack.coverUrl);

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
    activeTrack.previewUrl,
    activeTrack.bpm,
    activeTrack.durationMs > 0 ? activeTrack.durationMs / 1000 : 266,
    {
      onEnded: () => {
        if (isRepeat) {
          seekToSeconds(0);
          togglePlay();
        } else {
          handleNextTrack();
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
        const isFriendMode = activeAlbum === 'friend';
        if (isFriendMode) {
          // If the last condition was friend live sync, restore friend's current track and progress
          if (friendPlayback?.track) {
            const friendSec = (friendLiveProgressMs > 0 ? friendLiveProgressMs : friendPlayback.progressMs || 0) / 1000;
            selectTrack(friendPlayback.track as any);
            loadTrack(
              friendPlayback.track.previewUrl || '',
              120,
              (friendPlayback.track.durationMs || 235000) / 1000,
              false,
              friendSec
            );
            if (friendSec > 0) {
              seekToSeconds(friendSec);
            }
          }
          return;
        }

        const savedTrackId = localStorage.getItem('kasatune_saved_track_id');
        const savedTimeStr = localStorage.getItem('kasatune_saved_playtime');
        const savedTime = savedTimeStr ? parseFloat(savedTimeStr) : 0;

        const targetTrack =
          (savedTrackId && tracks.find((t) => t.id === savedTrackId)) ||
          tracks.find((t) => t.id === 'rh-creep') ||
          tracks[0];

        if (targetTrack) {
          selectTrack(targetTrack);
          loadTrack(
            targetTrack.previewUrl,
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
  }, [tracks, selectTrack, loadTrack, activeAlbum, friendPlayback, friendLiveProgressMs, seekToSeconds]);

  // Track friend sync identity refs to prevent infinite reload loops and seek storms
  const currentFriendTrackKeyRef = useRef<string>('');
  const lastSyncedPreviewUrlRef = useRef<string>('');
  const lastFriendSeekTimeRef = useRef<number>(0);

  // Master Real-Time Friend Spotify Synchronization Engine
  useEffect(() => {
    if (!isFriendSyncConnected || activeAlbum !== 'friend') {
      currentFriendTrackKeyRef.current = '';
      lastSyncedPreviewUrlRef.current = '';
      return;
    }

    if (!friendPlayback || !friendPlayback.track) return;

    const friendTrack = friendPlayback.track;
    const friendTrackKey = `${friendTrack.id || ''}:${friendTrack.artist}-${friendTrack.title}`.toLowerCase();
    const isNewTrack = currentFriendTrackKeyRef.current !== friendTrackKey;
    const hasNewAudioPreview = Boolean(
      friendTrack.previewUrl && friendTrack.previewUrl !== lastSyncedPreviewUrlRef.current
    );

    // 1. Only execute track switch when the song has actually changed or audio preview arrived
    if (isNewTrack || hasNewAudioPreview) {
      currentFriendTrackKeyRef.current = friendTrackKey;
      lastSyncedPreviewUrlRef.current = friendTrack.previewUrl || '';

      const friendTitle = friendTrack.title.toLowerCase().replace(/！/g, '!').trim();
      const matched = tracks.find(
        (t) =>
          (friendTrack.id && t.id === friendTrack.id) ||
          t.title.toLowerCase().replace(/！/g, '!').includes(friendTitle) ||
          friendTitle.includes(t.title.toLowerCase().replace(/！/g, '!'))
      );

      const target: BackendRadioheadTrack = matched
        ? {
            ...matched,
            previewUrl: friendTrack.previewUrl || matched.previewUrl || '',
            syncedLyrics: friendTrack.syncedLyrics || matched.syncedLyrics || '',
            durationMs: friendTrack.durationMs || matched.durationMs || 235000,
          }
        : {
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

      if (isNewTrack) {
        selectTrack(target);
      }

      const friendSec = Math.max(0, friendLiveProgressMs / 1000);
      loadTrack(
        target.previewUrl,
        target.bpm || 120,
        (target.durationMs || 235000) / 1000,
        friendPlayback.isPlaying,
        friendSec
      );

      if (friendSec > 0) {
        seekToSeconds(friendSec);
      }

      if (friendPlayback.isPlaying) {
        play();
      }
      return;
    }

    // 2. Play / Pause Sync
    if (friendPlayback.isPlaying && !isPlaying) {
      play();
    } else if (!friendPlayback.isPlaying && isPlaying) {
      pause();
    }

    // 3. Gentle Drift Correction (Throttled, only when drifted significantly)
    const friendSec = friendLiveProgressMs / 1000;
    const drift = Math.abs(audioCurrentTimeSec - friendSec);
    const now = Date.now();

    if (!friendPlayback.isPlaying) {
      if (drift > 0.1 && now - lastFriendSeekTimeRef.current > 500) {
        lastFriendSeekTimeRef.current = now;
        seekToSeconds(friendSec);
      }
    } else {
      if (drift > 3.0 && now - lastFriendSeekTimeRef.current > 4000) {
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
  ]);

  // Filter tracks based on active Discord Server (Friend Spotify, Radiohead albums, or new artists)
  const displayTracks = tracks.filter((t) => matchesAlbumFilter(t, activeAlbum));

  // Switch Discord Server category & automatically load the primary track
  const handleSelectAlbum = useCallback(
    (album: AlbumFilterType) => {
      setActiveAlbum(album);
      try {
        localStorage.setItem('kasatune_active_album', album);
      } catch {}

      if (album === 'friend') {
        setIsFriendSyncConnected(true);
        try {
          localStorage.setItem('kasatune_is_friend_connected', 'true');
        } catch {}

        if (friendPlayback?.track) {
          const target = tracks.find(
            (t) =>
              t.id === friendPlayback.track?.id ||
              t.title.toLowerCase().includes(friendPlayback.track?.title.toLowerCase() || '')
          ) || (friendPlayback.track as any);

          const currentFriendSec = Math.max(0, (friendLiveProgressMs > 0 ? friendLiveProgressMs : friendPlayback.progressMs || 0) / 1000);
          selectTrack(target);
          loadTrack(
            target.previewUrl || '',
            target.bpm || 120,
            target.durationMs > 0 ? target.durationMs / 1000 : 235,
            true, // Immediately play on connect!
            currentFriendSec
          );
          if (currentFriendSec > 0) {
            seekToSeconds(currentFriendSec);
          }
          play();
        } else {
          const friendSong =
            tracks.find((t) => t.id === 'roselia-proud-of-oneself') ||
            tracks.find((t) => t.id === 'liella-sing-shine-smile') ||
            tracks[0];
          selectTrack(friendSong);
          loadTrack(
            friendSong.previewUrl,
            friendSong.bpm,
            friendSong.durationMs > 0 ? friendSong.durationMs / 1000 : 266,
            true
          );
          const targetSec = (friendLiveProgressMs > 0 ? friendLiveProgressMs : 155000) / 1000;
          seekToSeconds(targetSec);
          play();
        }
      } else {
        const matchedTrack = tracks.find((t) => matchesAlbumFilter(t, album)) || tracks[0];
        if (matchedTrack) {
          selectTrack(matchedTrack);
          try {
            localStorage.setItem('kasatune_saved_track_id', matchedTrack.id);
          } catch {}
          loadTrack(
            matchedTrack.previewUrl,
            matchedTrack.bpm,
            matchedTrack.durationMs > 0 ? matchedTrack.durationMs / 1000 : 238,
            true // Auto-play when selecting personal albums!
          );
        }
      }
    },
    [tracks, selectTrack, loadTrack, friendPlayback, friendLiveProgressMs, seekToSeconds, play]
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
          const target = tracks.find(
            (t) =>
              t.id === friendPlayback.track?.id ||
              t.title.toLowerCase().includes(friendPlayback.track?.title.toLowerCase() || '')
          ) || (friendPlayback.track as any);

          const currentFriendSec = Math.max(0, (friendLiveProgressMs > 0 ? friendLiveProgressMs : friendPlayback.progressMs || 0) / 1000);
          selectTrack(target);
          loadTrack(
            target.previewUrl || '',
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
        setActiveAlbum('radiohead');
        try {
          localStorage.setItem('kasatune_active_album', 'radiohead');
        } catch {}
      }

      return next;
    });
  }, [friendPlayback, friendLiveProgressMs, tracks, selectTrack, loadTrack, seekToSeconds, play]);

  // Direct connect to friend's live music session
  const handleConnectFriendSpotify = useCallback(() => {
    setIsFriendSyncConnected(true);
    setActiveAlbum('friend');
    try {
      localStorage.setItem('kasatune_is_friend_connected', 'true');
      localStorage.setItem('kasatune_active_album', 'friend');
    } catch {}

    if (friendPlayback?.track) {
      const target = tracks.find(
        (t) =>
          t.id === friendPlayback.track?.id ||
          t.title.toLowerCase().includes(friendPlayback.track?.title.toLowerCase() || '')
      ) || (friendPlayback.track as any);

      const currentFriendSec = Math.max(0, (friendLiveProgressMs > 0 ? friendLiveProgressMs : friendPlayback.progressMs || 0) / 1000);
      selectTrack(target);
      loadTrack(
        target.previewUrl || '',
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
  }, [friendPlayback, friendLiveProgressMs, tracks, selectTrack, loadTrack, seekToSeconds, play]);

  // Set active friend Discord User ID and immediately sync if in friend mode
  const handleSetDiscordUserId = useCallback((id: string) => {
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

  // Switch to Autonomous / Personal Music Mode (Radiohead / JKT48 / etc.)
  const handleSwitchToMyMusic = useCallback(() => {
    setIsFriendSyncConnected(false);
    setActiveAlbum('radiohead');
    try {
      localStorage.setItem('kasatune_active_album', 'radiohead');
    } catch {}
    const rhTrack = tracks.find((t) => t.artist.toLowerCase() === 'radiohead') || tracks[0];
    if (rhTrack) {
      selectTrack(rhTrack);
      try {
        localStorage.setItem('kasatune_saved_track_id', rhTrack.id);
      } catch {}
      loadTrack(
        rhTrack.previewUrl,
        rhTrack.bpm,
        rhTrack.durationMs > 0 ? rhTrack.durationMs / 1000 : 238,
        true
      );
    }
  }, [tracks, selectTrack, loadTrack]);

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
          matchedTrack.previewUrl,
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
      localStorage.setItem('kasatune_active_album', activeAlbum);
    } catch {}

    // On mobile, auto-navigate to player stage upon selecting a track
    setMobileView('player');

    if (track.id === activeTrack.id) {
      if (!isPlaying) {
        togglePlay();
      }
    } else {
      selectTrack(track);
      loadTrack(
        track.previewUrl,
        track.bpm,
        track.durationMs > 0 ? track.durationMs / 1000 : 238,
        true // Immediately start playing on click!
      );
    }
  }, [activeAlbum, friendPlayback, activeTrack.id, isPlaying, togglePlay, selectTrack, loadTrack]);

  const handleNextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const nextIndex = isShuffle
      ? Math.floor(Math.random() * tracks.length)
      : (tracks.findIndex((t) => t.id === activeTrack.id) + 1) % tracks.length;

    const nextTrk = tracks[nextIndex];
    selectTrack(nextTrk);
    loadTrack(
      nextTrk.previewUrl,
      nextTrk.bpm,
      nextTrk.durationMs > 0 ? nextTrk.durationMs / 1000 : 238,
      true // Immediately play on next
    );
  }, [tracks, activeTrack.id, isShuffle, selectTrack, loadTrack]);

  const handlePrevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    // If track has been playing for more than 3 seconds, rewind to beginning
    if (audioCurrentTimeSec > 3) {
      seekToSeconds(0);
      return;
    }

    const prevIndex = (tracks.findIndex((t) => t.id === activeTrack.id) - 1 + tracks.length) % tracks.length;
    const prevTrk = tracks[prevIndex];
    selectTrack(prevTrk);
    loadTrack(
      prevTrk.previewUrl,
      prevTrk.bpm,
      prevTrk.durationMs > 0 ? prevTrk.durationMs / 1000 : 238,
      true // Immediately play on prev
    );
  }, [tracks, activeTrack.id, audioCurrentTimeSec, seekToSeconds, selectTrack, loadTrack]);

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
  const displayCurrentTimeMs = isFriendMode ? friendLiveProgressMs : audioCurrentTimeSec * 1000;
  const displayDurationMs = (isFriendMode && friendPlayback?.track?.durationMs)
    ? friendPlayback.track.durationMs
    : (audioDurationSec > 0 ? audioDurationSec * 1000 : 238000);

  return (
    <div className="h-screen w-full bg-[#0B0C0E] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* 1. Discord x Spotify Top Navigation Header */}
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
      />

      {/* 2. Main Workspace (Responsive: Discord Server Rail + Channels + Grand Vinyl & Lyric Stage) */}
      <main className="flex-1 flex overflow-hidden min-h-0 bg-[#0B0C0E] relative">
        {/* Col 1: Discord Server Rail (72px) - Visible on desktop, and on mobile when in 'sidebar' view */}
        <div className={`h-full flex-shrink-0 ${mobileView === 'sidebar' ? 'block' : 'hidden md:block'}`}>
          <DiscordServerRail
            activeAlbum={activeAlbum}
            onSelectAlbum={(alb) => {
              handleSelectAlbum(alb);
            }}
            onRefreshBackend={refetchTracks}
            isBackendOnline={isBackendOnline}
          />
        </div>

        {/* Col 2: Discord Channel & Queue Drawer - Full width on mobile, comfortable custom drawer width on desktop */}
        <div
          className={`h-full ${
            mobileView === 'sidebar' ? 'flex-1 min-w-0 block' : 'hidden'
          } md:block md:flex-none md:w-72 lg:w-80 flex-shrink-0`}
        >
          <TrackListSidebar
            tracks={displayTracks}
            activeTrackId={activeTrack.id}
            onSelectTrack={handleSelectTrack}
            isPlaying={isPlaying}
            searchFilter={searchFilter}
            activeAlbum={activeAlbum}
            onSelectAlbum={handleSelectAlbum}
            friendPlayback={friendPlayback}
            friendLiveProgressMs={friendLiveProgressMs}
            isLoadingFriend={isLoadingFriend}
            isConnectingFriend={isConnectingFriend}
            onConnectFriendSpotify={handleConnectFriendSpotify}
            onRefreshFriendSpotify={refetchFriendSpotify}
            onListenAlong={handleListenAlong}
            isFriendSyncConnected={isFriendSyncConnected}
            discordUserId={discordUserId}
            friendsLiveMap={friendsLiveMap}
            onSetDiscordUserId={handleSetDiscordUserId}
            onToggleFriendSync={handleToggleFriendSync}
            onSwitchToMyMusic={handleSwitchToMyMusic}
          />
        </div>

        {/* Col 3 & 4: Grand Vinyl Studio & Live Lyric Stage */}
        <div className={`flex-1 h-full min-w-0 p-2 gap-2 overflow-hidden ${mobileView === 'sidebar' ? 'hidden md:flex' : 'flex'}`}>
          {/* Main Album Vinyl & Discography Stage */}
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
                isStandby: Boolean(friendPlayback && !friendPlayback.isPlaying && !friendPlayback.track),
              }}
            />
          </div>

          {/* Live Lyrics Theater (Collapsible or Full-Height on mobile) */}
          {(showLyrics || mobileView === 'lyrics') && (
            <div className={`h-full flex-shrink-0 animate-in fade-in duration-200 ${
              mobileView === 'lyrics'
                ? 'w-full block lg:w-[360px] xl:w-[420px]'
                : 'hidden lg:block lg:w-[360px] xl:w-[420px]'
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
      />
    </div>
  );
};
