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
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  trackTitle,
  artistName,
  albumImageUrl,
  currentTimeSec,
  durationSec,
  bpm,
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
  beatPulse = 0,
  showLyrics,
  onToggleLyrics,
  onOpenPlayer,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isScrubbingHover, setIsScrubbingHover] = useState(false);

  const safeDuration = durationSec > 0 ? durationSec : 238;
  const progressRatio = Math.max(0, Math.min(1, currentTimeSec / safeDuration));

  const [r, g, b] = colors?.dominantColor || [232, 155, 91];
  const albumColorRgb = `rgb(${r}, ${g}, ${b})`;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * safeDuration);
  };

  return (
    <footer className="h-20 w-full bg-[#0B0C0E] border-t border-[#282B32] px-4 flex items-center justify-between gap-4 select-none z-50">
      {/* Left: Now Playing Widget (Click to open full player screen on mobile) */}
      <div
        onClick={onOpenPlayer}
        className="flex items-center gap-2.5 sm:gap-3 min-w-[120px] sm:min-w-[180px] max-w-[280px] cursor-pointer group"
        title="Buka Layar Pemutar"
      >
        {albumImageUrl && (
          <div className="w-12 h-12 sm:w-14 sm:h-14 min-w-[48px] min-h-[48px] sm:min-w-[56px] sm:min-h-[56px] rounded-md overflow-hidden flex-shrink-0 bg-[#141619] border border-[#282B32] shadow-md group-hover:border-[#BFE7EA]/40 transition-colors">
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
          <span className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#BFE7EA] transition-colors">
            {trackTitle}
          </span>
          <span className="text-[11px] text-[#A0A5AD] truncate group-hover:text-white transition-colors">
            {artistName}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className={`p-1.5 transition-colors ml-0.5 rounded hover:bg-[#1C1E22] ${
            isLiked ? 'text-[#D46743]' : 'text-[#656A74] hover:text-white'
          }`}
          title={isLiked ? 'Liked' : 'Like'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#D46743]' : ''}`} />
        </button>
      </div>

      {/* Center: Full Spotify Controls & Scrubber */}
      <div className="flex-1 max-w-xl flex flex-col items-center gap-1.5">
        {/* Buttons Row */}
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

          {/* Clean Play / Pause Icon Button (No Shape Kotak / Directly the Icon) */}
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

        {/* Timeline Scrubber */}
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
            {/* Background bar */}
            <div className="w-full h-1 bg-[#282B32] rounded-md overflow-hidden relative group-hover:h-1.5 transition-all">
              {/* Progress bar filled with harmonious Kasatune Sunset gradient */}
              <div
                className="h-full bg-gradient-to-r from-[#D46743] to-[#E89B5B] transition-all duration-75"
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>

            {/* Hover thumb in clean white */}
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

      {/* Right: BPM badge, Lyrics Toggle & Volume Slider */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 sm:min-w-[180px] justify-end flex-shrink-0">
        {/* Metronome Beat Indicator without AI glow */}
        <div
          className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#141619] border border-[#282B32] text-[10px] text-[#A0A5AD]"
          title={`Song BPM: ${bpm}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#BFE7EA]" />
          <span className="font-mono text-[10px] font-semibold text-[#A0A5AD]">{bpm} BPM</span>
        </div>

        {/* Clean Lyrics Toggle Button (No Border Box) */}
        <button
          onClick={onToggleLyrics}
          className={`p-1.5 rounded transition-colors flex items-center justify-center ${
            showLyrics
              ? 'text-[#BFE7EA] hover:text-white'
              : 'text-[#656A74] hover:text-[#A0A5AD]'
          }`}
          title="Toggle Lyrics"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Volume Slider (Hidden on extra small mobile screens) */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => onVolumeChange(volume === 0 ? 0.85 : 0)}
            className="text-[#A0A5AD] hover:text-white transition-colors p-1"
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-[#ED4245]" />
            ) : (
              <Volume2 className="w-4 h-4 hover:text-[#BFE7EA]" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-18 sm:w-22 h-1 bg-[#282B32] rounded-lg appearance-none cursor-pointer accent-[#BFE7EA]"
          />
        </div>
      </div>
    </footer>
  );
};
