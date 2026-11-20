/**
 * App Component (Spotify Desktop Web Application)
 * Seamless Spotify Desktop Experience:
 * - 100% synchronized lyrics & audio on track skip (instantaneous zero-offset reset)
 * - Full-length studio recordings (3-6 minutes per song)
 * - Rhythmic beat-matched audio visualizer & tempo metronome for active and idle states
 * - Fluid Spotify controls (Shuffle, SkipBack, Play/Pause, SkipForward, Repeat)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { TrackListSidebar } from './components/TrackListSidebar';
import { AlbumShowcase } from './components/AlbumShowcase';
import { DynamicLyrics } from './components/DynamicLyrics';
import { PlayerBar } from './components/PlayerBar';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import { useMusicSync } from './hooks/useMusicSync';
import { useAlbumColor } from './hooks/useAlbumColor';
import { useAudioVisualizer } from './hooks/useAudioVisualizer';
import type { BackendRadioheadTrack } from './api/backend';

export const App: React.FC = () => {
  const [showLyrics, setShowLyrics] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

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
    <div className="h-screen w-full bg-[#1E1F22] text-[#F2F3F5] flex flex-col overflow-hidden font-sans select-none">
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
      />

      {/* 2. Main Workspace (Discord Surfaces + Spotify Panels) */}
      <main className="flex-1 px-2 pb-2 pt-2 gap-2 flex overflow-hidden min-h-0 bg-[#1E1F22]">
        {/* Left: Your Library Sidebar */}
        <div className="w-72 sm:w-80 h-full flex-shrink-0 hidden md:block">
          <TrackListSidebar
            tracks={tracks}
            activeTrackId={activeTrack.id}
            onSelectTrack={handleSelectTrack}
            isPlaying={isPlaying}
            searchFilter={searchFilter}
          />
        </div>

        {/* Center: Main Now Playing Stage & Tracklist */}
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

        {/* Right: Lyrics Tab Drawer (Collapsible) */}
        {showLyrics && (
          <div className="w-80 lg:w-96 h-full flex-shrink-0 hidden xl:block animate-in fade-in duration-300">
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
