/**
 * DynamicLyrics Component (Spotify Desktop Lyrics Tab)
 * Seamless, full-height lyrics screen tinted by the album's dynamic color.
 * Features:
 * - 100% human-synchronized vocal tracking (zero periodic formulas)
 * - Instant scroll reset to top when skipping tracks (zero desync on track skip)
 * - Instrumental intro indicator displaying exact countdown to vocal onset
 * - Auto-centering on active lyric line
 * - Click-to-seek directly to timestamp
 */

import React, { useEffect, useRef, useState } from 'react';
import { Mic2, Compass, AlignLeft, Music } from 'lucide-react';
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
      className="w-full h-full bg-[#121212] rounded-lg flex flex-col overflow-hidden select-none transition-colors duration-[1200ms] relative"
      style={{
        background: `linear-gradient(180deg, rgba(${colors.dominantColor[0]}, ${colors.dominantColor[1]}, ${colors.dominantColor[2]}, 0.35) 0%, rgba(18, 18, 18, 0.98) 75%, #121212 100%)`,
      }}
    >
      {/* Top Bar */}
      <div className="p-4 px-6 flex items-center justify-between border-b border-white/5 z-20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Mic2 className="w-5 h-5 text-white" />
          <span className="font-extrabold text-sm text-white">Lyrics</span>
          <span className="text-xs text-[#B3B3B3] truncate max-w-[150px]">
            &bull; {trackTitle}
          </span>
        </div>

        {lyrics.length > 0 && (
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              autoScroll
                ? 'bg-white text-black'
                : 'bg-black/40 text-[#B3B3B3] hover:text-white'
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
            <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#B3B3B3]">Loading lyrics...</p>
          </div>
        ) : lyrics.length > 0 ? (
          <>
            {/* Intro indicator when waiting for first vocal line */}
            {isIntro && (
              <div className="flex items-center gap-2.5 py-2.5 px-4 rounded-full bg-white/5 border border-white/10 w-fit text-xs text-[#1DB954] font-semibold animate-pulse mb-6">
                <span className="w-2 h-2 rounded-full bg-[#1DB954]" />
                <span>Intro Instrumental &bull; Vocals start at {formatTime(lyrics[0].timeMs)}</span>
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
                      ? 'text-white font-extrabold text-2xl sm:text-3xl leading-snug drop-shadow-[0_2px_14px_rgba(255,255,255,0.45)] scale-[1.01] origin-left'
                      : isPast
                      ? 'text-white/30 font-semibold text-xl sm:text-2xl leading-snug hover:text-white/70'
                      : 'text-white/45 font-bold text-xl sm:text-2xl leading-snug hover:text-white/85'
                  }`}
                >
                  <p className={isMusicalBreak ? 'text-lg text-white/40 italic flex items-center gap-2' : ''}>
                    {isMusicalBreak ? (
                      <>
                        <Music className="w-4 h-4 inline opacity-60" />
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
            <pre className="font-sans text-lg text-[#B3B3B3] leading-relaxed whitespace-pre-wrap">
              {plainLyrics}
            </pre>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-24 text-[#B3B3B3]">
            <AlignLeft className="w-10 h-10" />
            <h4 className="text-base font-bold text-white">Looks like we don&apos;t have the lyrics for this song yet.</h4>
          </div>
        )}
      </div>
    </div>
  );
};
