/**
 * App Component (Kasatune: Discord x Spotify Hybrid Architecture)
 * Unique, compelling layout architecture:
 * - Leftmost Discord Server Rail (Official album icons with squircle morphing & pill markers)
 * - Discord Channel Drawer (Category channels & instant-play tracks)
 * - Grand Vinyl Studio Stage (Spinning collector's vinyl disc, album metadata & discography table)
 * - High-Impact Kinetic Lyrics Theater (Apple Music / Spotify Sing full-height synced lyrics)
 * - Persistent Bottom Dock with Kasatune Warm Sunset Palette (#FFEAD3, #BFE7EA, #E89B5B, #D46743)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DiscordServerRail, type AlbumFilterType } from './components/DiscordServerRail';
import { TrackListSidebar } from './components/TrackListSidebar';
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
  const [activeAlbum, setActiveAlbum] = useState<AlbumFilterType>('all');

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
    togglePlay,
    seekToSeconds,
    loadTrack,
    visualizerData,
  } = useAudioVisualizer(
    activeTrack.previewUrl,
    activeTrack.bpm,
    activeTrack.durationMs > 0 ? activeTrack.durationMs / 1000 : 238,
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
    connectSpotify: connectFriendSpotify,
    fetchNowPlaying: refetchFriendSpotify,
  } = useFriendSpotify();

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
  }, [activeTrack.id, isPlaying, togglePlay, selectTrack, loadTrack]);

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
        friendTrackTitle={friendPlayback?.track?.title}
        isFriendConnected={friendPlayback?.isConnected}
        onConnectFriendSpotify={connectFriendSpotify}
      />

      {/* 2. Main Workspace (Discord Server Rail + Channels + Grand Vinyl & Lyric Stage) */}
      <main className="flex-1 flex overflow-hidden min-h-0 bg-[#0B0C0E]">
        {/* Col 1: Discord Server Rail (72px) */}
        <DiscordServerRail
          activeAlbum={activeAlbum}
          onSelectAlbum={setActiveAlbum}
          onRefreshBackend={refetchTracks}
          isBackendOnline={isBackendOnline}
        />

        {/* Col 2: Discord Channel & Queue Drawer (260px hidden on mobile) */}
        <div className="h-full flex-shrink-0 hidden md:block">
          <TrackListSidebar
            tracks={tracks}
            activeTrackId={activeTrack.id}
            onSelectTrack={handleSelectTrack}
            isPlaying={isPlaying}
            searchFilter={searchFilter}
            activeAlbum={activeAlbum}
            onSelectAlbum={setActiveAlbum}
            friendPlayback={friendPlayback}
            friendLiveProgressMs={friendLiveProgressMs}
            isLoadingFriend={isLoadingFriend}
            isConnectingFriend={isConnectingFriend}
            onConnectFriendSpotify={connectFriendSpotify}
            onRefreshFriendSpotify={refetchFriendSpotify}
            onListenAlong={handleListenAlong}
          />
        </div>

        {/* Col 3 & 4: Grand Vinyl Studio & Live Lyric Stage */}
        <div className="flex-1 h-full min-w-0 p-2 gap-2 flex overflow-hidden">
          {/* Main Album Vinyl & Discography Stage */}
          <div className="flex-1 h-full min-w-0">
            <AlbumShowcase
              track={activeTrack}
              tracks={tracks}
              activeTrackId={activeTrack.id}
              colors={albumColors}
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              onSelectTrack={handleSelectTrack}
            />
          </div>

          {/* Live Lyrics Theater (Collapsible or Full-Height) */}
          {showLyrics && (
            <div className="w-[320px] lg:w-[380px] xl:w-[440px] 2xl:w-[480px] h-full flex-shrink-0 hidden lg:block animate-in fade-in duration-300">
              <DynamicLyrics
                lyrics={lyrics}
                plainLyrics={plainLyrics}
                currentProgressMs={audioCurrentTimeSec * 1000}
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
        currentTimeSec={audioCurrentTimeSec}
        durationSec={audioDurationSec}
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
        onToggleLyrics={() => setShowLyrics(!showLyrics)}
      />
    </div>
  );
};
