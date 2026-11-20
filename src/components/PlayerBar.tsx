/**
 * PlayerBar Component (Spotify Desktop Playback Bar)
 * Authentic Spotify bottom dock:
 * Full-length audio duration support (3-6 minutes), transport controls,
 * green hover scrubber with click-to-seek, tempo beat metronome, and lyrics toggle.
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
  beatPulse = 0,
  showLyrics,
  onToggleLyrics,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isScrubberHovered, setIsScrubberHovered] = useState(false);

  const safeDuration = durationSec > 0 ? durationSec : 238;
  const progressRatio = Math.max(0, Math.min(1, currentTimeSec / safeDuration));

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * safeDuration);
  };

  return (
    <footer className="h-20 w-full bg-[#000000] border-t border-[#181818] px-4 flex items-center justify-between gap-4 select-none z-50">
      {/* Left: Now Playing Widget */}
      <div className="flex items-center gap-3 min-w-[180px] max-w-[280px]">
        {albumImageUrl && (
          <img
            src={albumImageUrl}
            alt={trackTitle}
            className="w-14 h-14 rounded object-cover shadow-md flex-shrink-0"
          />
        )}
        <div className="min-w-0 flex flex-col justify-center">
          <span className="text-sm font-semibold text-white truncate hover:underline cursor-pointer">
            {trackTitle}
          </span>
          <span className="text-xs text-[#B3B3B3] truncate hover:underline hover:text-white cursor-pointer">
            {artistName}
          </span>
        </div>
        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`p-1.5 transition-colors ml-1 ${
            isLiked ? 'text-[#1DB954]' : 'text-[#B3B3B3] hover:text-white'
          }`}
          title={isLiked ? 'Liked' : 'Like'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#1DB954]' : ''}`} />
        </button>
      </div>

      {/* Center: Full Spotify Controls & Scrubber */}
      <div className="flex-1 max-w-xl flex flex-col items-center gap-1.5">
        {/* Buttons Row */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleShuffle}
            className={`p-1.5 transition-colors ${
              isShuffle ? 'text-[#1DB954]' : 'text-[#B3B3B3] hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrevTrack}
            className="p-1.5 text-[#B3B3B3] hover:text-white transition-colors"
            title="Previous (ArrowLeft)"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center transition-all shadow-md"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black stroke-black" />
            ) : (
              <Play className="w-4 h-4 fill-black stroke-black translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNextTrack}
            className="p-1.5 text-[#B3B3B3] hover:text-white transition-colors"
            title="Next (ArrowRight)"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`p-1.5 transition-colors ${
              isRepeat ? 'text-[#1DB954]' : 'text-[#B3B3B3] hover:text-white'
            }`}
            title="Repeat"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="w-full flex items-center gap-2 text-[11px] font-mono text-[#B3B3B3]">
          <span className="min-w-[34px] text-right">
            {formatTime(currentTimeSec * 1000)}
          </span>

          <div
            onClick={handleProgressBarClick}
            onMouseEnter={() => setIsScrubberHovered(true)}
            onMouseLeave={() => setIsScrubberHovered(false)}
            className="group relative flex-1 h-1 bg-[#4D4D4D] rounded-full cursor-pointer hover:h-1.5 transition-all"
          >
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                isScrubberHovered ? 'bg-[#1DB954]' : 'bg-white'
              }`}
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>

          <span className="min-w-[34px]">
            {formatTime(safeDuration * 1000)}
          </span>
        </div>
      </div>

      {/* Right: BPM Metronome + Lyrics Toggle + Volume */}
      <div className="flex items-center gap-3 min-w-[180px] justify-end">
        {/* Metronome BPM Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181818] text-[11px] font-semibold text-[#B3B3B3]">
          <span
            className="w-1.5 h-1.5 rounded-full transition-transform duration-75"
            style={{
              backgroundColor: beatPulse > 0.4 ? '#1DB954' : '#B3B3B3',
              transform: `scale(${1 + beatPulse * 0.8})`,
            }}
          />
          <span className="font-mono">{bpm} BPM</span>
        </div>

        {/* Lyrics Toggle Button */}
        <button
          onClick={onToggleLyrics}
          className={`p-2 rounded-full transition-colors ${
            showLyrics ? 'text-[#1DB954] bg-[#242424]' : 'text-[#B3B3B3] hover:text-white'
          }`}
          title="Lyrics View"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onVolumeChange(volume === 0 ? 0.85 : 0)}
            className="text-[#B3B3B3] hover:text-white transition-colors"
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
            className="w-20 sm:w-24 h-1 bg-[#4D4D4D] rounded-lg appearance-none cursor-pointer accent-white hover:accent-[#1DB954]"
          />
        </div>
      </div>
    </footer>
  );
};
