/**
 * PlayerBar Component
 * Modern dark matte player (#0B0B0C / #121213) with #CE7F20, #EEDFC7, #607938, #53341A:
 * - Mobile (< md): Flat mini-player + clean opaque Now Playing Sheet (zero glow)
 * - Desktop (>= md): Clean matte studio dock with #CE7F20 transport & scrubber
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
  showLyrics,
  onToggleLyrics,
  onOpenPlayer,
  isLiked = false,
  onToggleLike,
}) => {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const safeDuration = durationSec > 0 ? durationSec : 238;
  const progressRatio = Math.max(0, Math.min(1, currentTimeSec / safeDuration));

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * safeDuration);
  };

  return (
    <>
      {/* MOBILE: Flat Matte Mini-Player */}
      <div className="md:hidden px-2.5 pt-1.5 pb-1 bg-[#0B0B0C] flex-shrink-0 z-40">
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
          className="relative rounded-xl border border-white/[0.08] overflow-hidden cursor-pointer bg-[#171719]"
        >
          <div className="px-2.5 py-2 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#0B0B0C] border border-white/[0.08]">
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
                <p className="text-[13px] font-semibold text-[#EEDFC7] truncate leading-tight">
                  {trackTitle}
                </p>
                <p className="text-[11px] text-[#9A9288] truncate leading-tight mt-0.5">
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
                className={`p-2 rounded-lg ${
                  isLiked ? 'text-[#CE7F20]' : 'text-[#9A9288]'
                }`}
                aria-label="Favorit"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#CE7F20]' : ''}`} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlay();
                }}
                className="w-9 h-9 rounded-lg bg-[#CE7F20] text-[#0B0B0C] flex items-center justify-center"
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
              className="h-full bg-[#CE7F20]"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* MOBILE: Clean Dark Matte Full-Screen Now Playing Sheet */}
      {isMobileSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-[80] bg-[#0B0B0C] flex flex-col justify-between px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] select-none overflow-y-auto"
          style={{
            backgroundImage: 'linear-gradient(180deg, rgba(83, 52, 26, 0.45) 0%, #121213 46%, #0B0B0C 100%)',
          }}
        >
          {/* Sheet Top Bar */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={() => setIsMobileSheetOpen(false)}
              className="w-9 h-9 rounded-lg bg-[#171719] border border-white/[0.08] flex items-center justify-center text-[#EEDFC7]"
              aria-label="Tutup pemutar"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#CE7F20] font-semibold">
                Sedang Diputar
              </p>
              <p className="text-xs font-medium text-[#EEDFC7] truncate">
                {albumName || artistName}
              </p>
            </div>

            <button
              onClick={() => {
                setIsMobileSheetOpen(false);
                onToggleLyrics();
              }}
              className="h-9 px-3 rounded-lg bg-[#171719] border border-white/[0.08] text-xs font-medium text-[#EEDFC7] flex items-center gap-1.5"
            >
              <Mic2 className="w-3.5 h-3.5 text-[#CE7F20]" />
              <span>Lirik</span>
            </button>
          </div>

          {/* Centered Large Artwork */}
          <div className="flex-1 flex items-center justify-center py-5 min-h-0">
            <div className="w-full max-w-[300px] max-h-[38dvh] aspect-square rounded-2xl overflow-hidden bg-[#171719] border border-white/[0.08]">
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

          {/* Track Meta + Touch Scrubber + Flat Controls */}
          <div className="space-y-5 pb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-[#EEDFC7] truncate leading-tight">
                  {trackTitle}
                </h2>
                <p className="text-sm text-[#9A9288] truncate mt-0.5">
                  {artistName}
                </p>
              </div>
              <button
                onClick={onToggleLike}
                className={`p-2.5 rounded-lg flex-shrink-0 ${
                  isLiked ? 'text-[#CE7F20]' : 'text-[#9A9288]'
                }`}
                aria-label="Simpan favorit"
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-[#CE7F20]' : ''}`} />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="relative w-full h-5 flex items-center">
                <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#CE7F20] rounded-full"
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
              <div className="flex items-center justify-between text-[11px] font-mono text-[#68625B]">
                <span className="text-[#EEDFC7]">{formatTime(currentTimeSec * 1000)}</span>
                <span>{formatTime(safeDuration * 1000)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <button
                onClick={onToggleShuffle}
                className={`p-2.5 rounded-lg ${
                  isShuffle ? 'text-[#607938] bg-[#607938]/20' : 'text-[#9A9288]'
                }`}
                aria-label="Acak"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={onPrevTrack}
                className="p-2.5 text-[#EEDFC7]"
                aria-label="Sebelumnya"
              >
                <SkipBack className="w-7 h-7 fill-current" />
              </button>

              <button
                onClick={onTogglePlay}
                className="w-[60px] h-[60px] rounded-xl bg-[#CE7F20] text-[#0B0B0C] flex items-center justify-center"
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
                className="p-2.5 text-[#EEDFC7]"
                aria-label="Selanjutnya"
              >
                <SkipForward className="w-7 h-7 fill-current" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-2.5 rounded-lg ${
                  isRepeat ? 'text-[#607938] bg-[#607938]/20' : 'text-[#9A9288]'
                }`}
                aria-label="Ulangi"
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP: Clean Dark Matte Console Bar */}
      <div className="hidden md:block px-3 pb-3 pt-0.5 bg-[#0B0B0C] flex-shrink-0 z-50 select-none">
        <footer className="h-[72px] w-full bg-[#121213] border border-white/[0.07] rounded-xl px-4 flex items-center justify-between gap-5">
          {/* Left: Now Playing Track */}
          <div
            onClick={onOpenPlayer}
            className="flex items-center gap-3 min-w-[200px] max-w-[290px] cursor-pointer"
            title="Buka Layar Pemutar"
          >
            {albumImageUrl && (
              <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-lg overflow-hidden flex-shrink-0 bg-[#19191B] border border-white/[0.07]">
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
              <span className="text-sm font-semibold text-[#EEDFC7] truncate">
                {trackTitle}
              </span>
              <span className="text-[11px] text-[#9A9288] truncate">
                {artistName}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike?.();
              }}
              className={`p-1.5 ml-0.5 rounded ${
                isLiked ? 'text-[#CE7F20]' : 'text-[#68625B]'
              }`}
              title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#CE7F20]' : ''}`} />
            </button>
          </div>

          {/* Center: Flat Transport & Scrubber */}
          <div className="flex-1 max-w-xl flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-3.5">
              <button
                onClick={onToggleShuffle}
                className={`p-1.5 rounded ${
                  isShuffle ? 'text-[#607938] bg-[#607938]/20' : 'text-[#9A9288]'
                }`}
                title="Acak"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onPrevTrack}
                className="p-1.5 text-[#EEDFC7]"
                title="Sebelumnya"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={onTogglePlay}
                className="w-9 h-9 rounded-lg bg-[#CE7F20] text-[#0B0B0C] flex items-center justify-center focus:outline-none"
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
                className="p-1.5 text-[#EEDFC7]"
                title="Selanjutnya"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-1.5 rounded ${
                  isRepeat ? 'text-[#607938] bg-[#607938]/20' : 'text-[#9A9288]'
                }`}
                title="Ulangi"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-full flex items-center gap-2.5 text-[11px] font-mono text-[#68625B]">
              <span className="min-w-[34px] text-right text-[#EEDFC7]">
                {formatTime(currentTimeSec * 1000)}
              </span>

              <div
                onClick={handleTimelineClick}
                className="flex-1 h-3 flex items-center cursor-pointer relative"
              >
                <div className="w-full h-1.5 bg-white/[0.10] rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-[#CE7F20]"
                    style={{ width: `${progressRatio * 100}%` }}
                  />
                </div>
              </div>

              <span className="min-w-[34px] text-[#68625B]">
                {formatTime(safeDuration * 1000)}
              </span>
            </div>
          </div>

          {/* Right: Lyrics Toggle & Volume Slider */}
          <div className="flex items-center gap-3 min-w-[165px] justify-end flex-shrink-0">
            <button
              onClick={onToggleLyrics}
              className={`h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border ${
                showLyrics
                  ? 'text-[#EEDFC7] bg-[#53341A]/45 border-[#CE7F20]/45'
                  : 'text-[#9A9288] border-transparent'
              }`}
              title="Tampilkan / Sembunyikan Lirik"
            >
              <Mic2 className="w-3.5 h-3.5 text-[#CE7F20]" />
              <span className="hidden lg:inline">Lirik</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onVolumeChange(volume === 0 ? 0.85 : 0)}
                className="text-[#9A9288] p-1"
                title={volume === 0 ? 'Unmute' : 'Mute'}
              >
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-[#CE7F20]" />
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
                className="w-20 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#CE7F20]"
              />
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
