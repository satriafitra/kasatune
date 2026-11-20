/**
 * AlbumShowcase Component (Discord x Spotify Studio & Vinyl Stage)
 * Immersive album stage featuring:
 * - Collector's Vinyl Record peeking out from the official album sleeve (rotates when playing!)
 * - Radiant Ochre/Rust sunset action controls
 * - Authentic Spotify Tracklist Table with instant auto-play
 * - Seamless Discord Dark (#2B2D31) glass surfaces
 */

import React, { useState } from 'react';
import { Play, Pause, Heart, MoreHorizontal, Clock, Volume2, Disc } from 'lucide-react';
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
      {/* 1. Collector's Vinyl & Album Hero Banner */}
      <div
        className="w-full p-5 sm:p-7 flex flex-col justify-end transition-colors duration-[1200ms] relative overflow-hidden flex-shrink-0 border-b border-[#383A40]/40"
        style={{
          background: 'linear-gradient(180deg, rgba(212, 103, 67, 0.38) 0%, rgba(232, 155, 91, 0.15) 50%, rgba(43, 45, 49, 0.95) 90%, #2B2D31 100%)',
        }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 z-10">
          {/* Vinyl + Album Cover Assembly */}
          <div className="relative flex items-center flex-shrink-0 group">
            {/* Peeking Vinyl Record */}
            <div
              className={`absolute top-2 left-6 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#0E0F12] border-4 border-[#1E1F22] shadow-[0_12px_30px_rgba(0,0,0,0.8)] flex items-center justify-center transition-transform duration-700 pointer-events-none z-0 ${
                isPlaying
                  ? 'translate-x-12 sm:translate-x-16 animate-spin-slow'
                  : 'translate-x-6'
              }`}
            >
              {/* Concentric Vinyl Grooves */}
              <div className="w-28 h-28 sm:w-34 sm:h-34 rounded-full border border-white/5 flex items-center justify-center">
                <div className="w-20 h-20 sm:w-26 sm:h-26 rounded-full border border-white/5 flex items-center justify-center">
                  {/* Vinyl Center Label */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#E89B5B] to-[#D46743] flex items-center justify-center border-2 border-[#1E1F22]">
                    <div className="w-3 h-3 rounded-full bg-[#0E0F12]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Square Album Cover Sleeve */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-lg shadow-[0_16px_36px_rgba(0,0,0,0.6)] overflow-hidden bg-[#1E1F22] border border-[#383A40]/70 z-10 flex-shrink-0">
              <img
                src={imageUrl}
                alt={title}
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Metadata Block */}
          <div className="flex flex-col gap-1.5 min-w-0 text-center sm:text-left z-10 pl-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#BFE7EA] bg-[#1E1F22]/90 border border-[#383A40] px-2 py-0.5 rounded">
                Master Audio
              </span>
              <span className="text-[10px] font-mono text-[#FFEAD3]">
                44.1 kHz &bull; FLAC
              </span>
            </div>

            {/* Song Title */}
            <h1 className="text-2xl sm:text-4xl font-black text-[#F2F3F5] tracking-tight leading-tight truncate drop-shadow-sm">
              {title}
            </h1>

            {/* Subtitle & Credits */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#949BA4] pt-0.5">
              <span className="font-extrabold text-[#FFEAD3] hover:underline cursor-pointer">
                {artist}
              </span>
              <span>&bull;</span>
              <span className="text-[#F2F3F5] font-semibold">{album}</span>
              <span>&bull;</span>
              <span>{year}</span>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
              <button
                onClick={onTogglePlay}
                className="h-10 px-5 rounded-full bg-gradient-to-r from-[#E89B5B] to-[#D46743] hover:from-[#f0a667] hover:to-[#df724e] text-white flex items-center gap-2 shadow-[0_4px_16px_rgba(212,103,67,0.4)] hover:scale-105 active:scale-95 transition-all text-xs font-bold"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-white stroke-white" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white stroke-white translate-x-0.5" />
                    <span>Play Master</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2 transition-colors rounded-full bg-[#1E1F22]/80 border border-[#383A40] hover:bg-[#35373C] ${
                  isLiked ? 'text-[#D46743]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
                }`}
                title={isLiked ? 'Remove from favorites' : 'Save to favorites'}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#D46743]' : ''}`} />
              </button>

              <button
                className="p-2 text-[#949BA4] hover:text-[#F2F3F5] rounded-full bg-[#1E1F22]/80 border border-[#383A40] hover:bg-[#35373C] transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Authentic Spotify Tracklist Table */}
      <div className="px-4 sm:px-6 pb-6 flex-1 flex flex-col pt-3">
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
                className={`grid grid-cols-[20px_1fr_auto] md:grid-cols-[20px_4fr_3fr_auto] gap-4 px-3 py-2 rounded-md text-sm items-center cursor-pointer transition-all ${
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
                    className="w-9 h-9 rounded-md object-cover flex-shrink-0 bg-[#1E1F22] border border-[#383A40]/50"
                  />
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`font-bold truncate text-xs leading-tight ${
                        isActive ? 'text-[#FFEAD3]' : 'text-[#F2F3F5]'
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-[11px] text-[#949BA4] hover:underline cursor-pointer truncate">
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
