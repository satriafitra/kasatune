/**
 * PlayerBar Component (Discord Voice & Spotify Playback Hybrid)
 * Deep obsidian dark dock with vibrant Ice Blue (#BFE7EA) and Kasatune Sunset accents:
 * - Real Radiohead album artwork strictly constrained in 56x56 box
 * - Radiant Play button with sunset / album glow
 * - Gradient timeline scrubber with Ice Blue hover thumb
 * - Prominent Ice Blue (#BFE7EA) metronome beat pulse, shuffle/repeat indicators & volume accent
 */

import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  Mic2,
  ChevronDown,
} from 'lucide-react';
import { formatTime } from '../utils/lrcParser';
import type { AlbumColors } from '../hooks/useAlbumColor';

interface PlayerBarProps {
  trackTitle: string;
  artistName: string;
  albumName?: string;
  albumImageUrl?: string;
  currentTimeSec: number;
  durationSec: number;
  bpm: number;
  mood: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  isRepeat: boolean;
  onToggleRepeat: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onSeek: (seconds: number) => void;
  colors: AlbumColors;
  beatPulse?: number;
  showLyrics: boolean;
  onToggleLyrics: () => void;
  onOpenPlayer?: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  trackTitle,
  artistName,
  albumName,
  albumImageUrl,
  currentTimeSec,
  durationSec,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  isShuffle,
  onToggleShuffle,
  isRepeat,
  onToggleRepeat,
  volume,
  onVolumeChange,
  onSeek,
  colors,
  showLyrics,
  onToggleLyrics,
  onOpenPlayer,
  isLiked = false,
  onToggleLike,
}) => {
  const [isScrubbingHover, setIsScrubbingHover] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const safeDuration = durationSec > 0 ? durationSec : 238;
  const progressRatio = Math.max(0, Math.min(1, currentTimeSec / safeDuration));

  const [r, g, b] = colors?.dominantColor || [232, 155, 91];

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * safeDuration);
  };

  return (
    <>
      {/* MOBILE: Compact Floating Mini-Player (Distinct from Desktop Dock) */}
      <div className="md:hidden px-2.5 pt-1.5 pb-1 bg-[#0B0C0E] flex-shrink-0 z-40">
        <div
          role="button"
          tabIndex={0}
          aria-label="Buka pemutar layar penuh"
          onClick={() => setIsMobileSheetOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsMobileSheetOpen(true);
            }
          }}
          className="relative rounded-xl border border-white/[0.1] overflow-hidden shadow-lg active:scale-[0.99] transition-transform cursor-pointer"
          style={{
            background: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.28) 0%, #17191E 75%)`,
          }}
        >
          <div className="px-2.5 py-2 flex items-center justify-between gap-2.5">
            {/* Left: Cover + Song Title & Artist */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#121316] border border-white/10 shadow-sm">
                {albumImageUrl && (
                  <img
                    src={albumImageUrl}
                    alt={trackTitle}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover block"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate leading-tight">
                  {trackTitle}
                </p>
                <p className="text-[11px] text-white/70 truncate leading-tight mt-0.5">
                  {artistName}
                </p>
              </div>
            </div>

            {/* Right: Heart & Play/Pause ONLY (Zero horizontal crowding) */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike?.();
                }}
                className={`p-2 rounded-full transition-colors ${
                  isLiked ? 'text-[#FF4B72]' : 'text-white/70 active:text-white'
                }`}
                aria-label="Favorit"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#FF4B72]' : ''}`} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlay();
                }}
                className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                aria-label={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-black stroke-black" />
                ) : (
                  <Play className="w-4 h-4 fill-black stroke-black translate-x-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* Slim edge progress indicator */}
          <div className="w-full h-[2.5px] bg-white/10">
            <div
              className="h-full bg-white/90 transition-all duration-100"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* MOBILE: Full-Screen Immersive Now Playing Sheet */}
      {isMobileSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-[80] bg-[#0B0C0F] flex flex-col justify-between px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] select-none animate-in slide-in-from-bottom-4 duration-200 overflow-y-auto"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.45) 0%, rgba(17, 19, 24, 0.96) 52%, #0A0B0E 100%)`,
          }}
        >
          {/* Sheet Top Bar */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={() => setIsMobileSheetOpen(false)}
              className="w-9 h-9 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center text-white active:scale-95"
              aria-label="Tutup pemutar"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">
                Sedang Diputar
              </p>
              <p className="text-xs font-semibold text-white truncate">
                {albumName || artistName}
              </p>
            </div>

            <button
              onClick={() => {
                setIsMobileSheetOpen(false);
                onToggleLyrics();
              }}
              className="h-9 px-3 rounded-full bg-black/25 backdrop-blur-md text-xs font-semibold text-white/90 flex items-center gap-1.5 active:scale-95"
            >
              <Mic2 className="w-3.5 h-3.5 text-[#1DB954]" />
              <span>Lirik</span>
            </button>
          </div>

          {/* Centered Large Artwork */}
          <div className="flex-1 flex items-center justify-center py-5 min-h-0">
            <div className="w-full max-w-[300px] max-h-[38dvh] aspect-square rounded-2xl overflow-hidden bg-[#141619] shadow-[0_24px_60px_rgba(0,0,0,0.65)] border border-white/10">
              {albumImageUrl && (
                <img
                  src={albumImageUrl}
                  alt={trackTitle}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover block"
                />
              )}
            </div>
          </div>

          {/* Track Meta + Touch Scrubber + Controls */}
          <div className="space-y-5 pb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-white truncate leading-tight">
                  {trackTitle}
                </h2>
                <p className="text-sm text-white/70 truncate mt-0.5">
                  {artistName}
                </p>
              </div>
              <button
                onClick={onToggleLike}
                className={`p-2.5 rounded-full transition-colors flex-shrink-0 ${
                  isLiked ? 'text-[#FF4B72]' : 'text-white/70'
                }`}
                aria-label="Simpan favorit"
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-[#FF4B72]' : ''}`} />
              </button>
            </div>

            {/* Touch-friendly Range Scrubber */}
            <div className="space-y-1.5">
              <div className="relative w-full h-5 flex items-center">
                <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${progressRatio * 100}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={safeDuration}
                  step={0.5}
                  value={Math.min(safeDuration, currentTimeSec)}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Posisi lagu"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-white/60">
                <span>{formatTime(currentTimeSec * 1000)}</span>
                <span>{formatTime(safeDuration * 1000)}</span>
              </div>
            </div>

            {/* Clean Mobile Transport Row */}
            <div className="flex items-center justify-between px-1">
              <button
                onClick={onToggleShuffle}
                className={`p-2.5 rounded-full ${
                  isShuffle ? 'text-[#1DB954]' : 'text-white/60'
                }`}
                aria-label="Acak"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={onPrevTrack}
                className="p-2.5 text-white active:scale-90 transition-transform"
                aria-label="Sebelumnya"
              >
                <SkipBack className="w-7 h-7 fill-white" />
              </button>

              <button
                onClick={onTogglePlay}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-95 transition-transform"
                aria-label={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-black stroke-black" />
                ) : (
                  <Play className="w-7 h-7 fill-black stroke-black translate-x-0.5" />
                )}
              </button>

              <button
                onClick={onNextTrack}
                className="p-2.5 text-white active:scale-90 transition-transform"
                aria-label="Selanjutnya"
              >
                <SkipForward className="w-7 h-7 fill-white" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-2.5 rounded-full ${
                  isRepeat ? 'text-[#1DB954]' : 'text-white/60'
                }`}
                aria-label="Ulangi"
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP: Full 3-Column Playback Dock */}
      <footer className="hidden md:flex h-20 w-full bg-[#0B0C0E] border-t border-[#282B32] px-4 items-center justify-between gap-4 select-none z-50 flex-shrink-0">
        {/* Left: Now Playing Widget */}
        <div
          onClick={onOpenPlayer}
          className="flex items-center gap-3 min-w-[180px] max-w-[280px] cursor-pointer group"
          title="Buka Layar Pemutar"
        >
          {albumImageUrl && (
            <div className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-md overflow-hidden flex-shrink-0 bg-[#141619] border border-[#282B32] shadow-md group-hover:border-[#BFE7EA]/40 transition-colors">
              <img
                src={albumImageUrl}
                alt={trackTitle}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
                className="w-full h-full object-cover block"
              />
            </div>
          )}
          <div className="min-w-0 flex flex-col justify-center">
            <span className="text-sm font-bold text-white truncate group-hover:text-[#BFE7EA] transition-colors">
              {trackTitle}
            </span>
            <span className="text-[11px] text-[#A0A5AD] truncate group-hover:text-white transition-colors">
              {artistName}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike?.();
            }}
            className={`p-1.5 transition-colors ml-0.5 rounded hover:bg-[#1C1E22] ${
              isLiked ? 'text-[#FF4B72]' : 'text-[#656A74] hover:text-white'
            }`}
            title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#FF4B72]' : ''}`} />
          </button>
        </div>

        {/* Center: Full Spotify Controls & Scrubber */}
        <div className="flex-1 max-w-xl flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleShuffle}
              className={`p-1.5 transition-colors rounded hover:bg-[#1C1E22] ${
                isShuffle ? 'text-[#BFE7EA]' : 'text-[#A0A5AD] hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={onPrevTrack}
              className="p-1.5 text-[#A0A5AD] hover:text-white transition-colors rounded hover:bg-[#1C1E22]"
              title="Previous (ArrowLeft)"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={onTogglePlay}
              className="p-1 text-white hover:text-[#BFE7EA] transition-all duration-150 hover:scale-110 active:scale-95 flex items-center justify-center focus:outline-none"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current stroke-current" />
              ) : (
                <Play className="w-6 h-6 fill-current stroke-current translate-x-0.5" />
              )}
            </button>

            <button
              onClick={onNextTrack}
              className="p-1.5 text-[#A0A5AD] hover:text-white transition-colors rounded hover:bg-[#1C1E22]"
              title="Next (ArrowRight)"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={onToggleRepeat}
              className={`p-1.5 transition-colors rounded hover:bg-[#1C1E22] ${
                isRepeat ? 'text-[#BFE7EA]' : 'text-[#A0A5AD] hover:text-white'
              }`}
              title="Repeat"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full flex items-center gap-2.5 text-[11px] font-mono text-[#A0A5AD]">
            <span className="min-w-[34px] text-right font-medium text-[#BFE7EA]">
              {formatTime(currentTimeSec * 1000)}
            </span>

            <div
              onClick={handleTimelineClick}
              onMouseEnter={() => setIsScrubbingHover(true)}
              onMouseLeave={() => setIsScrubbingHover(false)}
              className="flex-1 h-3 flex items-center cursor-pointer group relative"
            >
              <div className="w-full h-1 bg-[#282B32] rounded-md overflow-hidden relative group-hover:h-1.5 transition-all">
                <div
                  className="h-full bg-gradient-to-r from-[#D46743] to-[#E89B5B] transition-all duration-75"
                  style={{ width: `${progressRatio * 100}%` }}
                />
              </div>

              {isScrubbingHover && (
                <div
                  className="absolute w-2.5 h-2.5 rounded-full bg-white shadow-sm -translate-x-1/2 pointer-events-none"
                  style={{ left: `${progressRatio * 100}%` }}
                />
              )}
            </div>

            <span className="min-w-[34px] text-[#656A74]">
              {formatTime(safeDuration * 1000)}
            </span>
          </div>
        </div>

        {/* Right: Lyrics Toggle & Volume Slider */}
        <div className="flex items-center gap-3 min-w-[160px] justify-end flex-shrink-0">
          <button
            onClick={onToggleLyrics}
            className={`p-2 rounded-full transition-colors flex items-center justify-center ${
              showLyrics
                ? 'text-[#1DB954] bg-[#1DB954]/10'
                : 'text-[#656A74] hover:text-white'
            }`}
            title="Tampilkan / Sembunyikan Lirik"
          >
            <Mic2 className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onVolumeChange(volume === 0 ? 0.85 : 0)}
              className="text-[#A0A5AD] hover:text-white transition-colors p-1"
              title={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#ED4245]" />
              ) : (
                <Volume2 className="w-4 h-4 hover:text-white" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-1 bg-[#282B32] rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
            />
          </div>
        </div>
      </footer>
    </>
  );
};
