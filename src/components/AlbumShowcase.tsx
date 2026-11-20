/**
 * AlbumShowcase Component (Discord x Spotify Now Playing & Discography Stage)
 * Unites Discord dark UI surfaces with Spotify's desktop discography view:
 * - Kasatune Sunset Palette (#FFEAD3, #BFE7EA, #E89B5B, #D46743)
 * - Real official Radiohead album artwork
 * - Ambient gradient header melting into Discord Panel (#2B2D31)
 * - Big radiant Play button with ochre/rust gradient
 * - Authentic Spotify Tracklist Table (#, Title, Album, Duration) with instant auto-play
 */

import React, { useState } from 'react';
import { Play, Pause, Heart, MoreHorizontal, Clock, Volume2, Sparkles } from 'lucide-react';
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
    <div className="w-full h-full bg-[#2B2D31] rounded-lg border border-[#383A40]/60 flex flex-col overflow-y-auto select-none relative custom-scrollbar shadow-sm">
      {/* 1. Kasatune Ambient Sunset Header Gradient (Discord #2B2D31 base) */}
      <div
        className="w-full p-6 sm:p-8 flex flex-col justify-end transition-colors duration-[1200ms] relative overflow-hidden flex-shrink-0"
        style={{
          background: 'linear-gradient(180deg, rgba(212, 103, 67, 0.40) 0%, rgba(232, 155, 91, 0.18) 50%, rgba(43, 45, 49, 0.95) 90%, #2B2D31 100%)',
        }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 z-10">
          {/* Square Album Cover with Discord-style drop shadow */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-lg shadow-[0_16px_36px_rgba(0,0,0,0.6)] overflow-hidden flex-shrink-0 bg-[#1E1F22] border border-[#383A40]/60">
            <img
              src={imageUrl}
              alt={title}
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Metadata Block */}
          <div className="flex flex-col gap-2 min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#BFE7EA] bg-[#1E1F22]/80 border border-[#383A40] px-2 py-0.5 rounded">
                Official Studio Master
              </span>
            </div>

            {/* Song Title */}
            <h1 className="text-3xl sm:text-5xl font-black text-[#F2F3F5] tracking-tight leading-tight truncate drop-shadow-sm">
              {title}
            </h1>

            {/* Subtitle & Credits */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#949BA4] pt-1">
              <span className="font-extrabold text-[#FFEAD3] hover:underline cursor-pointer">
                {artist}
              </span>
              <span>&bull;</span>
              <span className="text-[#F2F3F5] font-semibold">{album}</span>
              <span>&bull;</span>
              <span>{year}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Action Controls Row (Radiant Play Button, Like, Options) */}
      <div className="px-6 sm:px-8 py-3.5 flex items-center gap-5 bg-[#2B2D31] z-10 flex-shrink-0 border-b border-[#383A40]/30">
        <button
          onClick={onTogglePlay}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-[#E89B5B] to-[#D46743] hover:from-[#f0a667] hover:to-[#df724e] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(212,103,67,0.45)] hover:scale-105 active:scale-95 transition-all"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-white stroke-white" />
          ) : (
            <Play className="w-6 h-6 fill-white stroke-white translate-x-0.5" />
          )}
        </button>

        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`p-2 transition-colors rounded-md hover:bg-[#35373C] ${
            isLiked ? 'text-[#D46743]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
          }`}
          title={isLiked ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart className={`w-6 h-6 ${isLiked ? 'fill-[#D46743]' : ''}`} />
        </button>

        <button
          className="p-2 text-[#949BA4] hover:text-[#F2F3F5] hover:bg-[#35373C] rounded-md transition-colors"
          title="More options"
        >
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* 3. Authentic Spotify Tracklist Table in Discord Dark Surface */}
      <div className="px-6 sm:px-8 pb-8 flex-1 flex flex-col pt-3">
        {/* Table Header */}
        <div className="grid grid-cols-[20px_1fr_auto] md:grid-cols-[20px_4fr_3fr_auto] gap-4 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#949BA4] border-b border-[#383A40] mb-1">
          <div className="text-center">#</div>
          <div>Title</div>
          <div className="hidden md:block">Album</div>
          <div className="text-right flex items-center justify-end pr-2">
            <Clock className="w-3.5 h-3.5" />
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
                className={`grid grid-cols-[20px_1fr_auto] md:grid-cols-[20px_4fr_3fr_auto] gap-4 px-3 py-2.5 rounded-md text-sm items-center cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#35373C] border-l-2 border-[#E89B5B] shadow-sm'
                    : 'hover:bg-[#313338] text-[#949BA4]'
                }`}
              >
                {/* Index / Play Button */}
                <div className="text-center text-xs font-semibold flex items-center justify-center">
                  {isHovered ? (
                    isActive && isPlaying ? (
                      <Pause className="w-3.5 h-3.5 text-[#FFEAD3] fill-[#FFEAD3]" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-[#FFEAD3] fill-[#FFEAD3] translate-x-0.5" />
                    )
                  ) : isActive && isPlaying ? (
                    <Volume2 className="w-4 h-4 text-[#BFE7EA] animate-pulse" />
                  ) : (
                    <span className={isActive ? 'text-[#BFE7EA] font-bold' : 'text-[#949BA4]'}>
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
                    className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-[#1E1F22] border border-[#383A40]/50"
                  />
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`font-bold truncate leading-tight ${
                        isActive ? 'text-[#FFEAD3]' : 'text-[#F2F3F5]'
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-xs text-[#949BA4] hover:underline cursor-pointer truncate">
                      {t.artist}
                    </span>
                  </div>
                </div>

                {/* Album */}
                <div className="hidden md:block text-xs text-[#949BA4] hover:text-[#F2F3F5] truncate">
                  {t.album}
                </div>

                {/* Duration */}
                <div className="text-right text-xs font-mono text-[#949BA4] pr-2">
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
