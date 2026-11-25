/**
 * PlayerBar Component (Kasatune Warm Studio Console & Mobile Sheet)
 * - Mobile (< md): Floating orange-accented Mini-Player + opaque Full-Screen Now Playing Sheet
 * - Desktop (>= md): Floating rounded-2xl glass console bar with Kasatune Orange transport & scrubber
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
  const [r, g, b] = colors?.dominantColor || [255, 107, 43];

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * safeDuration);
  };

  return (
    <>
      {/* MOBILE: Compact Floating Warm Mini-Player */}
      <div className="md:hidden px-2.5 pt-1.5 pb-1 bg-[#0A0908] flex-shrink-0 z-40">
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
          className="relative rounded-2xl border border-white/[0.09] overflow-hidden shadow-xl active:scale-[0.99] transition-transform cursor-pointer bg-[#171412]"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(255, 107, 43, 0.16) 0%, rgba(${r}, ${g}, ${b}, 0.14) 40%, #171412 85%)`,
          }}
        >
          <div className="px-2.5 py-2 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-[#1D1A17] border border-white/10 shadow-sm">
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
                <p className="text-[13px] font-semibold text-[#FAF6F2] truncate leading-tight">
                  {trackTitle}
                </p>
                <p className="text-[11px] text-[#A8A099] truncate leading-tight mt-0.5">
                  {artistName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike?.();
                }}
                className={`p-2 rounded-xl transition-colors ${
                  isLiked ? 'text-[#FF6B2B]' : 'text-[#A8A099] active:text-white'
                }`}
                aria-label="Favorit"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#FF6B2B]' : ''}`} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlay();
                }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B2B] to-[#FF8A3D] text-[#0A0908] flex items-center justify-center shadow-md active:scale-95 transition-transform"
                aria-label={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current stroke-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current stroke-current translate-x-0.5" />
                )}
              </button>
            </div>
          </div>

          <div className="w-full h-[2.5px] bg-white/[0.08]">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B2B] to-[#FFA14A] transition-all duration-100"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* MOBILE: Full-Screen Immersive Now Playing Sheet (100% Opaque Base) */}
      {isMobileSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-[80] bg-[#0B0A09] flex flex-col justify-between px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] select-none animate-in slide-in-from-bottom-4 duration-200 overflow-y-auto"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(255, 107, 43, 0.28) 0%, rgba(${r}, ${g}, ${b}, 0.22) 28%, rgba(16, 14, 12, 0.96) 56%, #0A0908 100%)`,
          }}
        >
          {/* Sheet Top Bar */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={() => setIsMobileSheetOpen(false)}
              className="w-9 h-9 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#FAF6F2] active:scale-95"
              aria-label="Tutup pemutar"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#FFA14A] font-bold">
                Sedang Diputar
              </p>
              <p className="text-xs font-semibold text-[#FAF6F2] truncate">
                {albumName || artistName}
              </p>
            </div>

            <button
              onClick={() => {
                setIsMobileSheetOpen(false);
                onToggleLyrics();
              }}
              className="h-9 px-3 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 text-xs font-semibold text-[#FAF6F2] flex items-center gap-1.5 active:scale-95"
            >
              <Mic2 className="w-3.5 h-3.5 text-[#FF6B2B]" />
              <span>Lirik</span>
            </button>
          </div>

          {/* Centered Large Artwork */}
          <div className="flex-1 flex items-center justify-center py-5 min-h-0">
            <div className="w-full max-w-[300px] max-h-[38dvh] aspect-square rounded-3xl overflow-hidden bg-[#171412] shadow-[0_24px_60px_rgba(0,0,0,0.7)] border border-white/10">
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
                <h2 className="text-xl font-bold text-[#FAF6F2] truncate leading-tight">
                  {trackTitle}
                </h2>
                <p className="text-sm text-[#A8A099] truncate mt-0.5">
                  {artistName}
                </p>
              </div>
              <button
                onClick={onToggleLike}
                className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
                  isLiked ? 'text-[#FF6B2B]' : 'text-[#A8A099]'
                }`}
                aria-label="Simpan favorit"
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-[#FF6B2B]' : ''}`} />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="relative w-full h-5 flex items-center">
                <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF6B2B] to-[#FFA14A] rounded-full"
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
              <div className="flex items-center justify-between text-[11px] font-mono text-[#8A817A]">
                <span className="text-[#FFA14A]">{formatTime(currentTimeSec * 1000)}</span>
                <span>{formatTime(safeDuration * 1000)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <button
                onClick={onToggleShuffle}
                className={`p-2.5 rounded-xl ${
                  isShuffle ? 'text-[#FF6B2B] bg-[#FF6B2B]/15' : 'text-[#A8A099]'
                }`}
                aria-label="Acak"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={onPrevTrack}
                className="p-2.5 text-[#FAF6F2] active:scale-90 transition-transform"
                aria-label="Sebelumnya"
              >
                <SkipBack className="w-7 h-7 fill-current" />
              </button>

              <button
                onClick={onTogglePlay}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B2B] to-[#FF8A3D] text-[#0A0908] flex items-center justify-center shadow-[0_12px_32px_rgba(255,107,43,0.4)] active:scale-95 transition-transform"
                aria-label={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current stroke-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current stroke-current translate-x-0.5" />
                )}
              </button>

              <button
                onClick={onNextTrack}
                className="p-2.5 text-[#FAF6F2] active:scale-90 transition-transform"
                aria-label="Selanjutnya"
              >
                <SkipForward className="w-7 h-7 fill-current" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-2.5 rounded-xl ${
                  isRepeat ? 'text-[#FF6B2B] bg-[#FF6B2B]/15' : 'text-[#A8A099]'
                }`}
                aria-label="Ulangi"
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP: Floating Warm Glass Studio Console (Distinct from Spotify's flat full-bleed bar) */}
      <div className="hidden md:block px-3 pb-3 pt-0.5 bg-[#0A0908] flex-shrink-0 z-50 select-none">
        <footer className="h-[74px] w-full bg-[#151210]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-4 flex items-center justify-between gap-5 shadow-[0_12px_36px_rgba(0,0,0,0.65)]">
          {/* Left: Now Playing Track */}
          <div
            onClick={onOpenPlayer}
            className="flex items-center gap-3 min-w-[200px] max-w-[290px] cursor-pointer group"
            title="Buka Layar Pemutar"
          >
            {albumImageUrl && (
              <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl overflow-hidden flex-shrink-0 bg-[#1D1A17] border border-white/10 shadow-md group-hover:border-[#FF6B2B]/50 transition-colors">
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
              <span className="text-sm font-semibold text-[#FAF6F2] truncate group-hover:text-[#FFA14A] transition-colors">
                {trackTitle}
              </span>
              <span className="text-[11px] text-[#9E958D] truncate group-hover:text-[#FAF6F2] transition-colors">
                {artistName}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike?.();
              }}
              className={`p-1.5 transition-colors ml-0.5 rounded-lg hover:bg-white/[0.06] ${
                isLiked ? 'text-[#FF6B2B]' : 'text-[#756E68] hover:text-[#FAF6F2]'
              }`}
              title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#FF6B2B]' : ''}`} />
            </button>
          </div>

          {/* Center: Transport & Warm Orange Scrubber */}
          <div className="flex-1 max-w-xl flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-3.5">
              <button
                onClick={onToggleShuffle}
                className={`p-1.5 transition-colors rounded-lg hover:bg-white/[0.06] ${
                  isShuffle ? 'text-[#FF6B2B] bg-[#FF6B2B]/15' : 'text-[#9E958D] hover:text-[#FAF6F2]'
                }`}
                title="Acak"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onPrevTrack}
                className="p-1.5 text-[#B8B0A8] hover:text-[#FAF6F2] transition-colors rounded-lg hover:bg-white/[0.06]"
                title="Sebelumnya"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={onTogglePlay}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B2B] to-[#FF8A3D] hover:brightness-110 active:scale-95 text-[#0A0908] transition-all flex items-center justify-center shadow-[0_6px_18px_rgba(255,107,43,0.35)] focus:outline-none"
                title={isPlaying ? 'Jeda (Spasi)' : 'Putar (Spasi)'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current stroke-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current stroke-current translate-x-0.5" />
                )}
              </button>

              <button
                onClick={onNextTrack}
                className="p-1.5 text-[#B8B0A8] hover:text-[#FAF6F2] transition-colors rounded-lg hover:bg-white/[0.06]"
                title="Selanjutnya"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-1.5 transition-colors rounded-lg hover:bg-white/[0.06] ${
                  isRepeat ? 'text-[#FF6B2B] bg-[#FF6B2B]/15' : 'text-[#9E958D] hover:text-[#FAF6F2]'
                }`}
                title="Ulangi"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-full flex items-center gap-2.5 text-[11px] font-mono text-[#8A817A]">
              <span className="min-w-[34px] text-right font-medium text-[#FFA14A]">
                {formatTime(currentTimeSec * 1000)}
              </span>

              <div
                onClick={handleTimelineClick}
                onMouseEnter={() => setIsScrubbingHover(true)}
                onMouseLeave={() => setIsScrubbingHover(false)}
                className="flex-1 h-3 flex items-center cursor-pointer group relative"
              >
                <div className="w-full h-1 bg-white/[0.1] rounded-full overflow-hidden relative group-hover:h-1.5 transition-all">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF6B2B] to-[#FFA14A] transition-all duration-75"
                    style={{ width: `${progressRatio * 100}%` }}
                  />
                </div>

                {isScrubbingHover && (
                  <div
                    className="absolute w-3 h-3 rounded-full bg-[#FAF6F2] border-2 border-[#FF6B2B] shadow-sm -translate-x-1/2 pointer-events-none"
                    style={{ left: `${progressRatio * 100}%` }}
                  />
                )}
              </div>

              <span className="min-w-[34px] text-[#756E68]">
                {formatTime(safeDuration * 1000)}
              </span>
            </div>
          </div>

          {/* Right: Lyrics Toggle & Volume Slider */}
          <div className="flex items-center gap-3 min-w-[165px] justify-end flex-shrink-0">
            <button
              onClick={onToggleLyrics}
              className={`h-8 px-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
                showLyrics
                  ? 'text-[#FF8A4C] bg-[#FF6B2B]/15 border-[#FF6B2B]/30'
                  : 'text-[#8A817A] border-transparent hover:text-[#FAF6F2] hover:bg-white/[0.05]'
              }`}
              title="Tampilkan / Sembunyikan Lirik"
            >
              <Mic2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Lirik</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onVolumeChange(volume === 0 ? 0.85 : 0)}
                className="text-[#9E958D] hover:text-[#FAF6F2] transition-colors p-1"
                title={volume === 0 ? 'Unmute' : 'Mute'}
              >
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-[#FF6B2B]" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#FF6B2B]"
              />
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
