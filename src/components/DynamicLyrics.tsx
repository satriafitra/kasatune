/**
 * DynamicLyrics Component (Discord Chat & Spotify Synced Lyrics Hybrid)
 * Authentic Discord chat room aesthetic combined with Apple Music / Spotify kinetic lyrics:
 * - Kasatune Sunset Palette (#FFEAD3 Cream, #BFE7EA Ice Blue, #E89B5B Ochre, #D46743 Rust)
 * - 100% human-synchronized vocal tracking from LRCLIB
 * - Dynamic kinetic text with warm amber glow on active sung line
 * - Depth-of-field past lines and soft ice cyan upcoming lines
 * - Click-to-seek timestamp navigation
 */

import React, { useEffect, useRef, useState } from 'react';
import { Mic2, Compass, AlignLeft, Music, Hash } from 'lucide-react';
import type { LyricLine } from '../utils/lrcParser';
import { findActiveLyricIndex, formatTime } from '../utils/lrcParser';
import type { AlbumColors } from '../hooks/useAlbumColor';

interface DynamicLyricsProps {
  lyrics: LyricLine[];
  plainLyrics?: string | null;
  currentProgressMs: number;
  colors: AlbumColors;
  isLoading: boolean;
  onSeek: (timeMs: number) => void;
  trackTitle: string;
}

export const DynamicLyrics: React.FC<DynamicLyricsProps> = ({
  lyrics,
  plainLyrics,
  currentProgressMs,
  isLoading,
  onSeek,
  trackTitle,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const activeIndex = findActiveLyricIndex(lyrics, currentProgressMs);

  // Instantly reset scroll to top whenever the song is skipped / changed
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [trackTitle]);

  // Smooth fluid auto-centering on active line
  useEffect(() => {
    if (!autoScroll || activeIndex === -1) return;

    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, autoScroll]);

  const isIntro = lyrics.length > 0 && activeIndex === -1;

  return (
    <div
      className="w-full h-full bg-[#2B2D31] rounded-lg border border-[#383A40]/60 flex flex-col overflow-hidden select-none transition-colors duration-[1200ms] relative shadow-sm"
      style={{
        background: 'linear-gradient(180deg, rgba(212, 103, 67, 0.22) 0%, rgba(191, 231, 234, 0.06) 45%, rgba(43, 45, 49, 0.98) 80%, #2B2D31 100%)',
      }}
    >
      {/* Top Discord Channel Header */}
      <div className="p-3.5 px-5 flex items-center justify-between border-b border-[#383A40]/40 z-20 flex-shrink-0 bg-[#2B2D31]/70 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="w-4 h-4 text-[#E89B5B] flex-shrink-0" />
          <span className="font-extrabold text-sm text-[#F2F3F5] tracking-tight">
            synced-lyrics
          </span>
          <span className="text-xs text-[#949BA4] truncate hidden sm:inline">
            &bull; {trackTitle}
          </span>
        </div>

        {lyrics.length > 0 && (
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              autoScroll
                ? 'bg-[#1E1F22] text-[#BFE7EA] border-[#383A40]'
                : 'bg-transparent text-[#949BA4] border-transparent hover:bg-[#35373C] hover:text-white'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${autoScroll ? 'animate-spin' : ''}`} />
            <span>Auto-scroll</span>
          </button>
        )}
      </div>

      {/* Main Lyrics Viewport with Top & Bottom Fade Mask */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 sm:px-8 py-20 space-y-6 scroll-smooth relative custom-scrollbar"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
        }}
      >
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-24">
            <div className="w-8 h-8 border-2 border-[#E89B5B] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#949BA4]">Connecting to LRCLIB timestamps...</p>
          </div>
        ) : lyrics.length > 0 ? (
          <>
            {/* Intro indicator when waiting for first vocal line */}
            {isIntro && (
              <div className="flex items-center gap-2.5 py-2 px-3.5 rounded-md bg-[#1E1F22] border border-[#383A40] w-fit text-xs text-[#BFE7EA] font-semibold animate-pulse mb-6">
                <span className="w-2 h-2 rounded-full bg-[#E89B5B]" />
                <span>Intro Instrumental &bull; Vocals at {formatTime(lyrics[0].timeMs)}</span>
              </div>
            )}

            {lyrics.map((line, index) => {
              const isActive = index === activeIndex;
              const isPast = activeIndex !== -1 && index < activeIndex;
              const isMusicalBreak = line.text === '♪';

              return (
                <div
                  key={line.id}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek(line.timeMs)}
                  className={`transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'text-[#FFEAD3] font-black text-2xl sm:text-3xl leading-snug drop-shadow-[0_0_16px_rgba(232,155,91,0.5)] scale-[1.01] origin-left'
                      : isPast
                      ? 'text-[#949BA4]/45 font-medium text-lg sm:text-xl leading-snug hover:text-[#949BA4]/80'
                      : 'text-[#BFE7EA]/70 font-bold text-xl sm:text-2xl leading-snug hover:text-[#FFEAD3]'
                  }`}
                >
                  <p className={isMusicalBreak ? 'text-base text-[#BFE7EA]/50 italic flex items-center gap-2' : ''}>
                    {isMusicalBreak ? (
                      <>
                        <Music className="w-4 h-4 inline opacity-60 text-[#E89B5B]" />
                        <span>(Instrumental)</span>
                      </>
                    ) : (
                      line.text
                    )}
                  </p>
                </div>
              );
            })}
          </>
        ) : plainLyrics ? (
          <div className="space-y-4 py-8">
            <pre className="font-sans text-lg text-[#949BA4] leading-relaxed whitespace-pre-wrap">
              {plainLyrics}
            </pre>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-24 text-[#949BA4]">
            <AlignLeft className="w-10 h-10" />
            <h4 className="text-sm font-bold text-[#F2F3F5]">No synced lyrics available.</h4>
          </div>
        )}
      </div>
    </div>
  );
};
