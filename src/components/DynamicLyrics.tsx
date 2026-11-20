/**
 * DynamicLyrics Component (Dynamic Album-Colored Kinetic Lyrics Theater)
 * 100% human-synchronized vocal tracking dynamically tinted by the active album's real colors:
 * - Ambient background gradient smoothly derived from the active album cover (ColorThief)
 * - Active sung line dynamically illuminated with the album's exact dominant hue & radiant glow
 * - Upcoming lyrics styled in vibrant Ice Blue (#BFE7EA) for maximum legibility and contrast
 * - Past lines in elegant obsidian-muted gray (#656A74)
 * - Click-to-seek timestamp navigation
 */

import React, { useEffect, useRef, useState } from 'react';
import { Compass, AlignLeft, Music, Hash, Sparkles } from 'lucide-react';
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

  const [r, g, b] = colors.dominantColor || [232, 155, 91];
  const albumColorRgb = `rgb(${r}, ${g}, ${b})`;
  const albumColorGlow = `rgba(${r}, ${g}, ${b}, 0.8)`;

  const isIntro = lyrics.length > 0 && activeIndex === -1;

  return (
    <div
      className="w-full h-full bg-[#141619] rounded-lg border border-[#282B32] flex flex-col overflow-hidden select-none transition-all duration-[1200ms] relative shadow-lg"
      style={{
        background: `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.22) 0%, rgba(${r}, ${g}, ${b}, 0.06) 45%, rgba(17, 18, 21, 0.98) 85%, #141619 100%)`,
      }}
    >
      {/* Top Discord Channel Header */}
      <div className="h-12 px-5 flex items-center justify-between border-b border-[#282B32]/70 z-20 flex-shrink-0 bg-[#141619]/80 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="w-4 h-4 text-[#BFE7EA] flex-shrink-0" />
          <span className="font-extrabold text-sm text-white tracking-tight">
            synced-lyrics
          </span>
          <span className="text-xs text-[#A0A5AD] truncate hidden sm:inline">
            &bull; {trackTitle}
          </span>
        </div>

        {lyrics.length > 0 && (
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              autoScroll
                ? 'bg-[#0B0C0E] text-[#BFE7EA] border-[#BFE7EA]/40 shadow-[0_0_8px_rgba(191,231,234,0.25)]'
                : 'bg-transparent text-[#A0A5AD] border-transparent hover:bg-[#1C1E22] hover:text-white'
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
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: albumColorRgb, borderTopColor: 'transparent' }}
            />
            <p className="text-xs text-[#A0A5AD]">Synchronizing with master audio...</p>
          </div>
        ) : lyrics.length > 0 ? (
          <>
            {/* Intro indicator when waiting for first vocal line */}
            {isIntro && (
              <div
                className="flex items-center gap-2.5 py-2 px-4 rounded-md bg-[#0B0C0E]/90 border border-[#282B32] w-fit text-xs text-[#BFE7EA] font-semibold animate-pulse mb-6 shadow-md"
                style={{ borderColor: `rgba(${r}, ${g}, ${b}, 0.4)` }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: albumColorRgb, boxShadow: `0 0 10px ${albumColorGlow}` }}
                />
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
                  className={`transition-all duration-300 cursor-pointer flex items-center ${
                    isActive
                      ? 'scale-[1.02] origin-left'
                      : ''
                  }`}
                >
                  {/* Active Line Accent Pill */}
                  {isActive && (
                    <div
                      className="w-1.5 h-7 rounded-sm flex-shrink-0 mr-3 animate-in fade-in zoom-in-75 duration-200"
                      style={{
                        backgroundColor: albumColorRgb,
                        boxShadow: `0 0 14px ${albumColorGlow}`,
                      }}
                    />
                  )}

                  <p
                    className={`leading-snug transition-all duration-200 ${
                      isActive
                        ? 'text-white font-black text-2xl sm:text-3xl'
                        : isPast
                        ? 'text-[#656A74] font-medium text-lg sm:text-xl hover:text-[#A0A5AD]'
                        : 'text-[#BFE7EA] font-semibold text-xl sm:text-2xl hover:text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]'
                    }`}
                    style={
                      isActive
                        ? {
                            color: '#FFFFFF',
                            textShadow: `0 0 20px ${albumColorGlow}, 0 2px 10px rgba(0,0,0,0.9)`,
                          }
                        : {}
                    }
                  >
                    {isMusicalBreak ? (
                      <span className="text-base text-[#BFE7EA]/60 italic flex items-center gap-2">
                        <Music className="w-4 h-4 inline opacity-70 text-[#BFE7EA]" />
                        <span>(Instrumental Break)</span>
                      </span>
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
            <pre className="font-sans text-lg text-[#A0A5AD] leading-relaxed whitespace-pre-wrap">
              {plainLyrics}
            </pre>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-24 text-[#A0A5AD]">
            <AlignLeft className="w-10 h-10" />
            <h4 className="text-sm font-bold text-white">No synchronized lyrics available.</h4>
          </div>
        )}
      </div>
    </div>
  );
};
