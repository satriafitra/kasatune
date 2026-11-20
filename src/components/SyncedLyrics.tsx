/**
 * SyncedLyrics Component
 * Synchronized, auto-scrolling lyrics panel styled with Discord Dark Mode.
 * Clean, readable typography with smooth active line auto-scrolling.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Mic2, Compass, Music, AlignLeft } from 'lucide-react';
import type { LyricLine } from '../utils/lrcParser';
import { findActiveLyricIndex, formatTime } from '../utils/lrcParser';
import type { AlbumColors } from '../hooks/useAlbumColor';

interface SyncedLyricsProps {
  lyrics: LyricLine[];
  plainLyrics?: string | null;
  isInstrumental?: boolean;
  currentProgressMs: number;
  colors: AlbumColors;
  isLoading: boolean;
  onSeek?: (timeMs: number) => void;
}

export const SyncedLyrics: React.FC<SyncedLyricsProps> = ({
  lyrics,
  plainLyrics,
  isInstrumental = false,
  currentProgressMs,
  colors,
  isLoading,
  onSeek,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const activeIndex = findActiveLyricIndex(lyrics, currentProgressMs);

  useEffect(() => {
    if (!autoScroll || activeIndex === -1) return;

    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, autoScroll]);

  return (
    <div className="relative w-full h-full min-h-[460px] max-h-[640px] flex flex-col rounded-2xl bg-[#2B2D31] border border-[#3F4147] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#3F4147] bg-[#2B2D31]">
        <div className="flex items-center gap-2">
          <Mic2 className="w-4 h-4 text-[#5865F2]" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#F2F3F5]">
            Synced Lyrics
          </h3>
          {lyrics.length > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1E1F22] text-[#80848E] border border-[#3F4147]">
              {lyrics.length} lines
            </span>
          )}
        </div>

        {lyrics.length > 0 && (
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              autoScroll
                ? 'bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/40'
                : 'bg-[#1E1F22] text-[#80848E] border-[#3F4147] hover:text-[#F2F3F5]'
            }`}
            title="Toggle auto-scroll lock"
          >
            <Compass className={`w-3 h-3 ${autoScroll ? 'animate-spin' : ''}`} />
            <span>Auto: {autoScroll ? 'ON' : 'OFF'}</span>
          </button>
        )}
      </div>

      {/* Lyrics Scrollable Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-5 py-6 space-y-4 scroll-smooth select-none"
      >
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-16">
            <div className="w-7 h-7 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#80848E]">Loading synced lyrics...</p>
          </div>
        ) : isInstrumental ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-16 text-[#80848E]">
            <Music className="w-8 h-8 text-[#5865F2] animate-pulse" />
            <h4 className="text-sm font-bold text-[#F2F3F5]">Instrumental</h4>
            <p className="text-xs">No vocal lyrics for this track.</p>
          </div>
        ) : lyrics.length > 0 ? (
          lyrics.map((line, index) => {
            const isActive = index === activeIndex;

            return (
              <div
                key={line.id}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek && onSeek(line.timeMs)}
                className={`group flex items-start gap-3 transition-all duration-200 cursor-pointer rounded-lg p-1.5 -mx-1.5 ${
                  isActive
                    ? 'bg-[#313338] shadow-sm'
                    : 'hover:bg-[#313338]/40 opacity-70 hover:opacity-100'
                }`}
              >
                <span
                  className={`text-[11px] font-mono tabular-nums pt-1 ${
                    isActive ? 'text-[#5865F2] font-bold' : 'text-[#80848E]'
                  }`}
                >
                  {formatTime(line.timeMs)}
                </span>

                <div className="flex-1">
                  <p
                    className={`text-sm sm:text-base font-semibold leading-relaxed transition-all ${
                      isActive ? 'text-[#F2F3F5]' : 'text-[#80848E]'
                    }`}
                    style={
                      isActive
                        ? {
                            color: '#F2F3F5',
                            borderLeft: `3px solid ${colors.hexDominant}`,
                            paddingLeft: '10px',
                          }
                        : {
                            paddingLeft: '13px',
                          }
                    }
                  >
                    {line.text || '...'}
                  </p>
                </div>
              </div>
            );
          })
        ) : plainLyrics ? (
          <div className="space-y-2 py-2">
            <pre className="font-sans text-xs text-[#B5BAC1] leading-relaxed whitespace-pre-wrap">
              {plainLyrics}
            </pre>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-16 text-[#80848E]">
            <AlignLeft className="w-8 h-8" />
            <h4 className="text-sm font-bold text-[#F2F3F5]">No Lyrics</h4>
            <p className="text-xs">No lyrics found in LRCLIB for this song.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#3F4147] bg-[#1E1F22]/90 flex items-center justify-between text-[11px] text-[#80848E]">
        <span>Powered by LRCLIB Open DB</span>
        <span className="font-mono text-[#F2F3F5]">{formatTime(currentProgressMs)}</span>
      </div>
    </div>
  );
};
