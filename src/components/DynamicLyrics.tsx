/**
 * DynamicLyrics Component (Kasatune Warm Studio Lyrics Panel)
 * Synchronized vocal tracking with warm obsidian surface & Kasatune Orange editorial highlights.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Compass, AlignLeft, Music } from 'lucide-react';
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
  colors,
  isLoading,
  onSeek,
  trackTitle,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const activeIndex = findActiveLyricIndex(lyrics, currentProgressMs);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [trackTitle]);

  useEffect(() => {
    if (!autoScroll || activeIndex === -1) return;

    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, autoScroll]);

  const [r, g, b] = colors.dominantColor || [255, 107, 43];
  const isIntro = lyrics.length > 0 && activeIndex === -1 && lyrics[0].timeMs > 2500;

  return (
    <div
      className="w-full h-full bg-[#131110] rounded-2xl border border-white/[0.07] flex flex-col overflow-hidden select-none relative"
      style={{
        backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(255, 107, 43, 0.16) 0%, rgba(${r}, ${g}, ${b}, 0.10) 40%, transparent 72%)`,
      }}
    >
      {/* Clean Minimal Lyrics Header */}
      <div className="h-12 px-4 sm:px-5 flex items-center justify-between border-b border-white/[0.06] z-20 flex-shrink-0 bg-[#131110]/70 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2B] flex-shrink-0" />
          <span className="font-bold text-xs uppercase tracking-wider text-[#FAF6F2] flex-shrink-0">
            Lirik
          </span>
          <span className="text-xs text-[#8A817A] truncate">
            &bull; {trackTitle}
          </span>
        </div>

        {lyrics.length > 0 && (
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors border flex-shrink-0 ${
              autoScroll
                ? 'bg-[#FF6B2B]/15 text-[#FF8A4C] border-[#FF6B2B]/30'
                : 'bg-transparent text-[#756E68] border-transparent hover:bg-white/[0.06] hover:text-[#FAF6F2]'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>Auto</span>
          </button>
        )}
      </div>

      {/* Main Lyrics Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-5 sm:px-7 py-10 sm:py-14 space-y-5 sm:space-y-6 scroll-smooth relative custom-scrollbar"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 7%, black 93%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 7%, black 93%, transparent 100%)',
        }}
      >
        {isLoading && lyrics.length > 0 && (
          <div className="absolute top-14 right-5 z-30 px-2.5 py-1 rounded-lg bg-[#1A1715]/95 border border-[#FF6B2B]/30 text-[10px] text-[#FFA14A] flex items-center gap-1.5 shadow-sm backdrop-blur-sm animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2B]" />
            <span>Menyelaraskan...</span>
          </div>
        )}

        {isLoading && lyrics.length === 0 && !plainLyrics ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-24">
            <div className="w-7 h-7 border-2 border-[#FF6B2B] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#8A817A]">Menyelaraskan lirik...</p>
          </div>
        ) : lyrics.length > 0 ? (
          <>
            {isIntro && (
              <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-[#1B1816] border border-white/[0.07] w-fit text-xs text-[#A8A099] font-medium mb-4">
                <span className="w-2 h-2 rounded-full bg-[#FF6B2B]" />
                <span>Intro &bull; Vokal di {formatTime(lyrics[0].timeMs)}</span>
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
                  className={`transition-all duration-200 cursor-pointer flex flex-col items-start ${
                    isActive ? 'border-l-2 border-[#FF6B2B] pl-3.5' : 'pl-0'
                  }`}
                >
                  <p
                    className={`leading-snug transition-colors duration-150 break-words max-w-full ${
                      isActive
                        ? 'text-[#FAF6F2] font-bold text-xl sm:text-2xl'
                        : isPast
                        ? 'text-[#5A534E] font-medium text-base sm:text-lg hover:text-[#A8A099]'
                        : 'text-[#9E958D] font-medium text-base sm:text-lg hover:text-[#FAF6F2]'
                    }`}
                  >
                    {isMusicalBreak ? (
                      <span className="text-sm text-[#756E68] italic flex items-center gap-2">
                        <Music className="w-4 h-4 inline opacity-60 text-[#FF8A4C]" />
                        <span>(Instrumental)</span>
                      </span>
                    ) : (
                      line.text
                    )}
                  </p>
                  {line.subText && (
                    <p
                      className={`leading-normal transition-colors duration-150 mt-1 ${
                        isActive
                          ? 'text-[#FFA14A] font-semibold text-sm sm:text-base tracking-wide'
                          : isPast
                          ? 'text-[#433D39] font-normal text-xs sm:text-sm'
                          : 'text-[#756E68] font-normal text-xs sm:text-sm hover:text-[#A8A099]'
                      }`}
                    >
                      {line.subText}
                    </p>
                  )}
                </div>
              );
            })}
          </>
        ) : plainLyrics ? (
          <div className="space-y-4 py-6">
            <pre className="font-sans text-base sm:text-lg text-[#A8A099] leading-relaxed whitespace-pre-wrap">
              {plainLyrics}
            </pre>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-24 text-[#8A817A]">
            <AlignLeft className="w-9 h-9 opacity-70" />
            <h4 className="text-sm font-semibold text-[#FAF6F2]">Lirik belum tersedia</h4>
          </div>
        )}
      </div>
    </div>
  );
};
