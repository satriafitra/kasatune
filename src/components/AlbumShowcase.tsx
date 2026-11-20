/**
 * AlbumShowcase Component (Discord x Spotify Studio & Vinyl Stage)
 * Deep obsidian dark surfaces with real-time album color harmony:
 * - Collector's Vinyl Record peeking out from the official album sleeve (rotates when playing!)
 * - Ambient gradient header dynamically driven by the active album's real colors
 * - Radiant Play button illuminated with the album's dominant hue
 * - High-contrast Tracklist Table (#, Title, Album, Duration) with vibrant Ice Blue (#BFE7EA) indicators
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

  const [r, g, b] = colors.dominantColor || [232, 155, 91];
  const albumColorRgb = `rgb(${r}, ${g}, ${b})`;
  const albumColorGlow = `rgba(${r}, ${g}, ${b}, 0.5)`;

  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '3:58';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="w-full h-full bg-[#141619] rounded-lg border border-[#282B32] flex flex-col overflow-y-auto select-none relative custom-scrollbar shadow-lg">
      {/* 1. Collector's Vinyl & Album Hero Banner */}
      <div
        className="w-full p-5 sm:p-7 flex flex-col justify-end transition-all duration-[1200ms] relative overflow-hidden flex-shrink-0 border-b border-[#282B32]/70"
        style={{
          background: `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.35) 0%, rgba(${r}, ${g}, ${b}, 0.12) 50%, rgba(20, 22, 25, 0.98) 90%, #141619 100%)`,
        }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 z-10">
          {/* Vinyl + Album Cover Assembly */}
          <div className="relative flex items-center flex-shrink-0 group">
            {/* Peeking Vinyl Record */}
            <div
              className={`absolute top-2 left-6 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#090A0C] border-4 border-[#141619] shadow-[0_12px_36px_rgba(0,0,0,0.85)] flex items-center justify-center transition-transform duration-700 pointer-events-none z-0 ${
                isPlaying
                  ? 'translate-x-12 sm:translate-x-16 animate-spin-slow'
                  : 'translate-x-6'
              }`}
            >
              {/* Concentric Vinyl Grooves */}
              <div className="w-28 h-28 sm:w-34 sm:h-34 rounded-full border border-white/5 flex items-center justify-center">
                <div className="w-20 h-20 sm:w-26 sm:h-26 rounded-full border border-white/5 flex items-center justify-center">
                  {/* Vinyl Center Label (Dynamically colored to match album) */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-[#090A0C] transition-colors duration-700"
                    style={{ backgroundColor: albumColorRgb }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-[#090A0C]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Square Album Cover Sleeve */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.7)] overflow-hidden bg-[#0B0C0E] border border-[#282B32] z-10 flex-shrink-0">
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
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0B0C0E] bg-[#BFE7EA] px-2 py-0.5 rounded shadow-sm">
                Master Audio
              </span>
              <span className="text-[11px] font-mono text-[#BFE7EA] font-semibold">
                44.1 kHz &bull; FLAC
              </span>
            </div>

            {/* Song Title */}
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight truncate drop-shadow-md">
              {title}
            </h1>

            {/* Subtitle & Credits */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#A0A5AD] pt-0.5">
              <span
                className="font-extrabold cursor-pointer transition-colors hover:text-white"
                style={{ color: '#FFEAD3' }}
              >
                {artist}
              </span>
              <span>&bull;</span>
              <span className="text-white font-semibold">{album}</span>
              <span>&bull;</span>
              <span>{year}</span>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
              <button
                onClick={onTogglePlay}
                className="h-10 px-6 rounded-lg text-white flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-black tracking-wide shadow-md bg-gradient-to-r from-[#E89B5B] to-[#D46743] hover:from-[#f0a667] hover:to-[#df734f]"
                style={{
                  boxShadow: '0 4px 20px rgba(212, 103, 67, 0.4)',
                }}
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
                className={`h-10 w-10 flex items-center justify-center transition-all rounded-lg bg-[#0B0C0E]/80 border border-[#282B32] hover:border-[#E89B5B]/50 hover:bg-[#1C1E22] ${
                  isLiked ? 'text-[#D46743]' : 'text-[#A0A5AD] hover:text-white'
                }`}
                title={isLiked ? 'Remove from favorites' : 'Save to favorites'}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#D46743]' : ''}`} />
              </button>

              <button
                className="h-10 w-10 flex items-center justify-center text-[#A0A5AD] hover:text-white rounded-lg bg-[#0B0C0E]/80 border border-[#282B32] hover:border-[#BFE7EA]/50 hover:bg-[#1C1E22] transition-colors"
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
        <div className="grid grid-cols-[20px_1fr_auto] md:grid-cols-[20px_4fr_3fr_auto] gap-4 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#A0A5AD] border-b border-[#282B32] mb-1">
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
                    ? 'bg-[#1C1E22] shadow-sm'
                    : 'hover:bg-[#1E2025] text-[#A0A5AD]'
                }`}
              >
                {/* Index / Play Button */}
                <div className="text-center text-xs font-semibold flex items-center justify-center">
                  {isHovered ? (
                    isActive && isPlaying ? (
                      <Pause className="w-3.5 h-3.5 text-white fill-white" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-[#BFE7EA] fill-[#BFE7EA] translate-x-0.5" />
                    )
                  ) : isActive && isPlaying ? (
                    <Volume2 className="w-4 h-4 text-[#BFE7EA] animate-pulse" />
                  ) : (
                    <span className={isActive ? 'text-[#BFE7EA] font-black' : 'text-[#656A74]'}>
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Title + Thumbnail + Artist */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] rounded-md overflow-hidden flex-shrink-0 bg-[#0B0C0E] border border-[#282B32]/70 shadow-sm">
                    <img
                      src={t.coverUrl}
                      alt={t.title}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover block"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`font-bold truncate text-xs leading-tight ${
                        isActive ? 'text-white' : 'text-[#F2F3F5]'
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-[11px] text-[#A0A5AD] hover:text-white cursor-pointer truncate">
                      {t.artist}
                    </span>
                  </div>
                </div>

                {/* Album */}
                <div className="hidden md:block text-xs text-[#A0A5AD] hover:text-white truncate">
                  {t.album}
                </div>

                {/* Duration */}
                <div className="text-right text-xs font-mono text-[#A0A5AD] pr-2">
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
