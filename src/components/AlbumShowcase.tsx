/**
 * AlbumShowcase Component (Spotify Now Playing Header & Discography Tracklist)
 * Authentic Spotify desktop experience:
 * - Real official Radiohead album artwork
 * - Signature dynamic ambient gradient banner
 * - Action controls (Big green play button, Like, More options)
 * - Authentic Spotify Tracklist Table (#, Title, Album, Duration)
 * - Hover play/pause interaction & active track highlighting
 */

import React, { useState } from 'react';
import { Play, Pause, Heart, MoreHorizontal, Clock, Volume2 } from 'lucide-react';
import type { BackendRadioheadTrack } from '../api/backend';
import type { AlbumColors } from '../hooks/useAlbumColor';

interface AlbumShowcaseProps {
  track: BackendRadioheadTrack | null;
  tracks: BackendRadioheadTrack[];
  activeTrackId: string;
  colors: AlbumColors;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSelectTrack: (track: BackendRadioheadTrack) => void;
}

export const AlbumShowcase: React.FC<AlbumShowcaseProps> = ({
  track,
  tracks,
  activeTrackId,
  colors,
  isPlaying,
  onTogglePlay,
  onSelectTrack,
}) => {
  const title = track?.title || 'Creep';
  const artist = track?.artist || 'Radiohead';
  const album = track?.album || 'Pablo Honey';
  const year = track?.year || 1993;
  const imageUrl = track?.coverUrl || 'https://upload.wikimedia.org/wikipedia/en/0/0f/Radiohead.pablohoney.albumart.jpg';

  const [isLiked, setIsLiked] = useState(false);
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);

  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '3:58';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="w-full h-full bg-[#121212] rounded-lg flex flex-col overflow-y-auto select-none relative custom-scrollbar">
      {/* 1. Spotify Signature Ambient Header Gradient */}
      <div
        className="w-full p-6 sm:p-8 flex flex-col justify-end transition-colors duration-[1200ms] relative overflow-hidden flex-shrink-0"
        style={{
          background: `linear-gradient(180deg, rgba(${colors.dominantColor[0]}, ${colors.dominantColor[1]}, ${colors.dominantColor[2]}, 0.5) 0%, rgba(18, 18, 18, 0.95) 90%, #121212 100%)`,
        }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 z-10">
          {/* Square Album Cover with Spotify Shadow */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded shadow-[0_16px_40px_rgba(0,0,0,0.8)] overflow-hidden flex-shrink-0 bg-[#242424]">
            <img
              src={imageUrl}
              alt={title}
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Metadata Block */}
          <div className="flex flex-col gap-2 min-w-0 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Radiohead Song
            </span>

            {/* Song Title */}
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight truncate">
              {title}
            </h1>

            {/* Subtitle & Credits */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs text-[#B3B3B3] pt-1">
              <span className="font-bold text-white hover:underline cursor-pointer">
                {artist}
              </span>
              <span>&bull;</span>
              <span>{album}</span>
              <span>&bull;</span>
              <span>{year}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Action Buttons Row (Big Green Play Button, Like, Options) */}
      <div className="px-6 sm:px-8 py-4 flex items-center gap-6 bg-[#121212] z-10 flex-shrink-0">
        <button
          onClick={onTogglePlay}
          className="w-14 h-14 rounded-full bg-[#1DB954] hover:bg-[#1ED760] text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-black stroke-black" />
          ) : (
            <Play className="w-6 h-6 fill-black stroke-black translate-x-0.5" />
          )}
        </button>

        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`p-2 transition-colors ${
            isLiked ? 'text-[#1DB954]' : 'text-[#B3B3B3] hover:text-white'
          }`}
          title={isLiked ? 'Remove from Your Library' : 'Save to Your Library'}
        >
          <Heart className={`w-7 h-7 ${isLiked ? 'fill-[#1DB954]' : ''}`} />
        </button>

        <button
          className="p-2 text-[#B3B3B3] hover:text-white transition-colors"
          title="More options"
        >
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* 3. Authentic Spotify Tracklist Table */}
      <div className="px-6 sm:px-8 pb-8 flex-1 flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_4fr_3fr_auto] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#B3B3B3] border-b border-[#282828] mb-2">
          <div className="text-center">#</div>
          <div>Title</div>
          <div className="hidden md:block">Album</div>
          <div className="text-right flex items-center justify-end pr-2">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="space-y-0.5">
          {tracks.map((t, index) => {
            const isActive = t.id === activeTrackId;
            const isHovered = hoveredTrackId === t.id;

            return (
              <div
                key={t.id}
                onMouseEnter={() => setHoveredTrackId(t.id)}
                onMouseLeave={() => setHoveredTrackId(null)}
                onClick={() => {
                  if (isActive) {
                    onTogglePlay();
                  } else {
                    onSelectTrack(t);
                  }
                }}
                className={`grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_4fr_3fr_auto] gap-4 px-4 py-2.5 rounded-md text-sm items-center cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#282828] text-[#1DB954]'
                    : 'hover:bg-[#2A2A2A]/60 text-[#B3B3B3]'
                }`}
              >
                {/* Index / Play Button */}
                <div className="text-center text-xs font-semibold flex items-center justify-center">
                  {isHovered ? (
                    isActive && isPlaying ? (
                      <Pause className="w-3.5 h-3.5 text-white fill-white" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-white fill-white translate-x-0.5" />
                    )
                  ) : isActive && isPlaying ? (
                    <Volume2 className="w-4 h-4 text-[#1DB954] animate-pulse" />
                  ) : (
                    <span className={isActive ? 'text-[#1DB954]' : 'text-[#B3B3B3]'}>
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Title + Thumbnail + Artist */}
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={t.coverUrl}
                    alt={t.title}
                    crossOrigin="anonymous"
                    className="w-10 h-10 rounded object-cover flex-shrink-0 bg-[#242424]"
                  />
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`font-semibold truncate leading-tight ${
                        isActive ? 'text-[#1DB954]' : 'text-white'
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-xs text-[#B3B3B3] hover:underline cursor-pointer truncate">
                      {t.artist}
                    </span>
                  </div>
                </div>

                {/* Album */}
                <div className="hidden md:block text-xs text-[#B3B3B3] hover:text-white truncate">
                  {t.album}
                </div>

                {/* Duration */}
                <div className="text-right text-xs font-mono text-[#B3B3B3] pr-2">
                  {formatDuration(t.durationMs)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
