/**
 * DynamicLyrics Component
 * Clean dark matte lyrics panel (#121213) with #EEDFC7, #CE7F20, #607938.
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

  const isIntro = lyrics.length > 0 && activeIndex === -1 && lyrics[0].timeMs > 2500;

  return (
    <div className="w-full h-full bg-[#121213] rounded-xl border border-white/[0.07] flex flex-col overflow-hidden select-none relative">
      {/* Clean Flat Header */}
      <div className="h-11 px-4 sm:px-5 flex items-center justify-between border-b border-white/[0.06] z-20 flex-shrink-0 bg-[#101011]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-xs uppercase tracking-wider text-[#CE7F20] flex-shrink-0">
            Lirik
          </span>
          <span className="text-xs text-[#9A9288] truncate">
            &bull; {trackTitle}
          </span>
        </div>

        {lyrics.length > 0 && (
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 border flex-shrink-0 ${
              autoScroll
                ? 'bg-[#607938]/20 text-[#EEDFC7] border-[#607938]'
                : 'bg-transparent text-[#68625B] border-white/[0.08]'
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
      >
        {isLoading && lyrics.length === 0 && !plainLyrics ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-24">
            <p className="text-xs text-[#9A9288]">Memuat lirik...</p>
          </div>
        ) : lyrics.length > 0 ? (
          <>
            {isIntro && (
              <div className="py-1.5 px-3 rounded bg-[#18181A] border border-white/[0.07] w-fit text-xs text-[#9A9288] mb-4">
                Intro &bull; Vokal di {formatTime(lyrics[0].timeMs)}
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
                  className={`cursor-pointer flex flex-col items-start ${
                    isActive ? 'border-l-2 border-[#CE7F20] pl-3.5' : ''
                  }`}
                >
                  <p
                    className={`leading-snug break-words max-w-full ${
                      isActive
                        ? 'text-[#EEDFC7] font-bold text-xl sm:text-2xl'
                        : isPast
                        ? 'text-[#55504B] font-medium text-base sm:text-lg'
                        : 'text-[#8C847B] font-medium text-base sm:text-lg'
                    }`}
                  >
                    {isMusicalBreak ? (
                      <span className="text-sm text-[#68625B] italic flex items-center gap-2">
                        <Music className="w-4 h-4 inline text-[#CE7F20]" />
                        <span>(Instrumental)</span>
                      </span>
                    ) : (
                      line.text
                    )}
                  </p>
                  {line.subText && (
                    <p
                      className={`leading-normal mt-1 ${
                        isActive
                          ? 'text-[#CE7F20] font-medium text-sm sm:text-base'
                          : isPast
                          ? 'text-[#423E3A] font-normal text-xs sm:text-sm'
                          : 'text-[#68625B] font-normal text-xs sm:text-sm'
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
            <pre className="font-sans text-base sm:text-lg text-[#9A9288] leading-relaxed whitespace-pre-wrap">
              {plainLyrics}
            </pre>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-24 text-[#68625B]">
            <AlignLeft className="w-8 h-8" />
            <h4 className="text-sm font-medium text-[#EEDFC7]">Lirik belum tersedia</h4>
          </div>
        )}
      </div>
    </div>
  );
};
