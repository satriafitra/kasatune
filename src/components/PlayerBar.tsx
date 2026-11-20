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
      {/* Left: Now Playing Widget */}
      <div className="flex items-center gap-3 min-w-[180px] max-w-[280px]">
        {albumImageUrl && (
          <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-md overflow-hidden flex-shrink-0 bg-[#141619] border border-[#282B32] shadow-md">
            <img
              src={albumImageUrl}
              alt={trackTitle}
              crossOrigin="anonymous"
              className="w-full h-full object-cover block"
            />
          </div>
        )}
        <div className="min-w-0 flex flex-col justify-center">
          <span className="text-xs sm:text-sm font-bold text-white truncate hover:text-[#BFE7EA] cursor-pointer transition-colors">
            {trackTitle}
          </span>
          <span className="text-[11px] text-[#A0A5AD] truncate hover:underline hover:text-white cursor-pointer">
            {artistName}
          </span>
        </div>
        <button
          onClick={() => setIsLiked(!isLiked)}
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
              isShuffle ? 'text-[#BFE7EA] drop-shadow-[0_0_8px_#BFE7EA]' : 'text-[#A0A5AD] hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrevTrack}
            className="p-1.5 text-[#A0A5AD] hover:text-[#BFE7EA] transition-colors rounded hover:bg-[#1C1E22]"
            title="Previous (ArrowLeft)"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-lg text-white flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 shadow-md bg-gradient-to-br from-[#E89B5B] to-[#D46743] hover:from-[#f0a667] hover:to-[#df734f]"
            style={{
              boxShadow: '0 2px 14px rgba(212, 103, 67, 0.45)',
            }}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white stroke-white" />
            ) : (
              <Play className="w-4 h-4 fill-white stroke-white translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNextTrack}
            className="p-1.5 text-[#A0A5AD] hover:text-[#BFE7EA] transition-colors rounded hover:bg-[#1C1E22]"
            title="Next (ArrowRight)"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`p-1.5 transition-colors rounded hover:bg-[#1C1E22] ${
              isRepeat ? 'text-[#BFE7EA] drop-shadow-[0_0_8px_#BFE7EA]' : 'text-[#A0A5AD] hover:text-white'
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

            {/* Hover thumb in vibrant Ice Blue */}
            {isScrubbingHover && (
              <div
                className="absolute w-3 h-3 rounded-sm bg-[#BFE7EA] border border-white shadow-[0_0_8px_#BFE7EA] -translate-x-1/2 pointer-events-none"
                style={{ left: `${progressRatio * 100}%` }}
              />
            )}
          </div>

          <span className="min-w-[34px] text-[#656A74]">
            {formatTime(safeDuration * 1000)}
          </span>
        </div>
      </div>

      {/* Right: BPM pulse badge, Lyrics Toggle & Volume Slider */}
      <div className="flex items-center gap-3 min-w-[180px] justify-end">
        {/* Metronome Beat Indicator with glowing Ice Blue dot */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#141619] border border-[#282B32] text-[11px] text-[#BFE7EA]"
          title={`Song BPM: ${bpm}`}
        >
          <span
            className="w-2 h-2 rounded-sm transition-transform duration-75 bg-[#BFE7EA]"
            style={{
              boxShadow: beatPulse > 0.4 ? '0 0 10px #BFE7EA' : 'none',
              transform: `scale(${1 + beatPulse * 0.9})`,
            }}
          />
          <span className="font-mono text-[10px] font-bold text-[#BFE7EA]">{bpm} BPM</span>
        </div>

        {/* Lyrics Toggle Button */}
        <button
          onClick={onToggleLyrics}
          className={`p-2 rounded-md transition-all border ${
            showLyrics
              ? 'text-[#BFE7EA] bg-[#1C1E22] border-[#BFE7EA]/40 shadow-[0_0_10px_rgba(191,231,234,0.3)]'
              : 'text-[#656A74] border-transparent hover:bg-[#141619] hover:text-white'
          }`}
          title="Toggle Lyrics"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
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
