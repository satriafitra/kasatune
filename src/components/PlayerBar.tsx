/**
 * PlayerBar Component (Discord Voice & Spotify Playback Hybrid)
 * Authentic Discord bottom dock with Kasatune Sunset Palette:
 * - Real Radiohead album artwork with crisp metadata
 * - Controls with Ochre/Rust radiant play button
 * - Gradient timeline scrubber with Cream hover thumb
 * - Ice blue metronome pulse & lyrics toggle
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
  Activity,
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
  beatPulse = 0,
  showLyrics,
  onToggleLyrics,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isScrubbingHover, setIsScrubbingHover] = useState(false);

  const safeDuration = durationSec > 0 ? durationSec : 238;
  const progressRatio = Math.max(0, Math.min(1, currentTimeSec / safeDuration));

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * safeDuration);
  };

  return (
    <footer className="h-20 w-full bg-[#1E1F22] border-t border-[#383A40]/80 px-4 flex items-center justify-between gap-4 select-none z-50">
      {/* Left: Now Playing Widget */}
      <div className="flex items-center gap-3 min-w-[180px] max-w-[280px]">
        {albumImageUrl && (
          <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-md overflow-hidden flex-shrink-0 bg-[#2B2D31] border border-[#383A40]/60 shadow-md">
            <img
              src={albumImageUrl}
              alt={trackTitle}
              crossOrigin="anonymous"
              className="w-full h-full object-cover block"
            />
          </div>
        )}
        <div className="min-w-0 flex flex-col justify-center">
          <span className="text-xs sm:text-sm font-bold text-[#F2F3F5] truncate hover:text-[#FFEAD3] cursor-pointer">
            {trackTitle}
          </span>
          <span className="text-[11px] text-[#949BA4] truncate hover:underline hover:text-[#F2F3F5] cursor-pointer">
            {artistName}
          </span>
        </div>
        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`p-1.5 transition-colors ml-0.5 rounded hover:bg-[#2B2D31] ${
            isLiked ? 'text-[#D46743]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
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
            className={`p-1.5 transition-colors rounded hover:bg-[#2B2D31] ${
              isShuffle ? 'text-[#BFE7EA]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrevTrack}
            className="p-1.5 text-[#949BA4] hover:text-[#FFEAD3] transition-colors rounded hover:bg-[#2B2D31]"
            title="Previous (ArrowLeft)"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-[#E89B5B] to-[#D46743] hover:from-[#f0a667] hover:to-[#df724e] text-white flex items-center justify-center transition-all shadow-[0_2px_12px_rgba(212,103,67,0.4)] hover:scale-105 active:scale-95"
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
            className="p-1.5 text-[#949BA4] hover:text-[#FFEAD3] transition-colors rounded hover:bg-[#2B2D31]"
            title="Next (ArrowRight)"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`p-1.5 transition-colors rounded hover:bg-[#2B2D31] ${
              isRepeat ? 'text-[#BFE7EA]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
            }`}
            title="Repeat"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="w-full flex items-center gap-2.5 text-[11px] font-mono text-[#949BA4]">
          <span className="min-w-[34px] text-right">
            {formatTime(currentTimeSec * 1000)}
          </span>

          <div
            onClick={handleTimelineClick}
            onMouseEnter={() => setIsScrubbingHover(true)}
            onMouseLeave={() => setIsScrubbingHover(false)}
            className="flex-1 h-3 flex items-center cursor-pointer group relative"
          >
            {/* Background bar */}
            <div className="w-full h-1 bg-[#383A40] rounded-full overflow-hidden relative group-hover:h-1.5 transition-all">
              {/* Progress bar filled with sunset gradient */}
              <div
                className="h-full bg-gradient-to-r from-[#E89B5B] to-[#D46743] transition-all duration-75"
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>

            {/* Hover thumb dot */}
            {isScrubbingHover && (
              <div
                className="absolute w-3 h-3 rounded-full bg-[#FFEAD3] border border-[#E89B5B] shadow-[0_0_8px_#FFEAD3] -translate-x-1/2 pointer-events-none"
                style={{ left: `${progressRatio * 100}%` }}
              />
            )}
          </div>

          <span className="min-w-[34px]">
            {formatTime(safeDuration * 1000)}
          </span>
        </div>
      </div>

      {/* Right: BPM pulse badge, Lyrics Toggle & Volume Slider */}
      <div className="flex items-center gap-3 min-w-[180px] justify-end">
        {/* Metronome Beat Indicator */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#2B2D31] border border-[#383A40] text-[11px] text-[#BFE7EA]"
          title={`Song BPM: ${bpm}`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full transition-transform duration-75"
            style={{
              backgroundColor: beatPulse > 0.4 ? '#E89B5B' : '#BFE7EA',
              transform: `scale(${1 + beatPulse * 0.9})`,
            }}
          />
          <span className="font-mono text-[10px]">{bpm} BPM</span>
        </div>

        {/* Lyrics Toggle Button */}
        <button
          onClick={onToggleLyrics}
          className={`p-2 rounded-md transition-colors border ${
            showLyrics
              ? 'text-[#FFEAD3] bg-[#2B2D31] border-[#383A40] shadow-sm'
              : 'text-[#949BA4] border-transparent hover:bg-[#2B2D31] hover:text-[#F2F3F5]'
          }`}
          title="Toggle Lyrics"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onVolumeChange(volume === 0 ? 0.85 : 0)}
            className="text-[#949BA4] hover:text-[#F2F3F5] transition-colors p-1"
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-[#ED4245]" />
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
            className="w-18 sm:w-22 h-1 bg-[#383A40] rounded-lg appearance-none cursor-pointer accent-[#E89B5B]"
          />
        </div>
      </div>
    </footer>
  );
};
