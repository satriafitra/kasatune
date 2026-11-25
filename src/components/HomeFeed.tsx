/**
 * HomeFeed Component
 * Default landing stage for Kasatune (both Desktop & Mobile):
 * - Real-time global recommendations (shuffled from live Global + ID charts)
 * - Trending GTA VI & viral hits for the current real-time year
 * - Top Songs {year} Global real-time chart
 * Strictly adheres to the calm matte dark palette (#0B0B0C / #121213 / #CE7F20 / #EEDFC7 / #607938 / #53341A).
 */

import React from 'react';
import { Play, Pause, Heart, ListPlus, RefreshCw, Volume2 } from 'lucide-react';
import type { BackendRadioheadTrack } from '../api/backend';
import { isSameTrack } from '../api/liveSearch';

export interface HomeDiscoveryData {
  year: number;
  topGlobal: BackendRadioheadTrack[];
  gtaTrending: BackendRadioheadTrack[];
  recommendations: BackendRadioheadTrack[];
  fetchedAt: number;
}

interface HomeFeedProps {
  userName?: string;
  data: HomeDiscoveryData | null;
  isLoading: boolean;
  activeTrack: BackendRadioheadTrack | null;
  isPlaying: boolean;
  onSelectTrack: (track: BackendRadioheadTrack, sourceList: BackendRadioheadTrack[]) => void;
  onTogglePlay: () => void;
  onRefresh: () => void;
  isLikedTrack?: (trackId: string) => boolean;
  onToggleLikeTrack?: (track: BackendRadioheadTrack) => void;
  onAddToQueue?: (track: BackendRadioheadTrack) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 19) return 'Selamat Sore';
  return 'Selamat Malam';
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  userName,
  data,
  isLoading,
  activeTrack,
  isPlaying,
  onSelectTrack,
  onTogglePlay,
  onRefresh,
  isLikedTrack,
  onToggleLikeTrack,
  onAddToQueue,
}) => {
  const year = data?.year || new Date().getFullYear();
  const topGlobal = data?.topGlobal || [];
  const gtaTrending = data?.gtaTrending || [];
  const recommendations = data?.recommendations || [];

  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '3:30';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handlePlayItem = (track: BackendRadioheadTrack, list: BackendRadioheadTrack[]) => {
    if (isSameTrack(track, activeTrack)) {
      onTogglePlay();
    } else {
      onSelectTrack(track, list);
    }
  };

  return (
    <div className="w-full h-full bg-[#121213] rounded-xl border border-white/[0.07] flex flex-col overflow-y-auto select-none custom-scrollbar">
      {/* Top Hero Greeting Header */}
      <div className="px-4 sm:px-7 pt-5 sm:pt-7 pb-5 border-b border-white/[0.06] bg-gradient-to-b from-[#53341A]/40 via-[#171412] to-[#121213] flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#CE7F20]">
              Beranda &bull; {year}
            </span>
            <h1 className="text-xl sm:text-3xl font-bold text-[#EEDFC7] tracking-tight leading-tight mt-1 truncate">
              {getGreeting()}
              {userName ? `, ${userName}` : ''}
            </h1>
            <p className="text-xs text-[#9A9288] mt-1">
              Rekomendasi lagu global, tren GTA VI, dan tangga lagu real-time {year}.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 px-3 rounded-lg bg-[#19191B] border border-white/[0.08] text-xs font-medium text-[#EEDFC7] flex items-center gap-1.5 flex-shrink-0 disabled:opacity-60 cursor-pointer"
            title="Segarkan rekomendasi real-time"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#CE7F20] ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-7 py-5 sm:py-6 space-y-7 flex-1">
        {isLoading && !data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-[#19191B] border border-white/[0.05]" />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-xl bg-[#19191B] border border-white/[0.05]" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Section 1: Rekomendasi Untuk Kamu (Random Live Global + Indonesia Mix) */}
            {recommendations.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-bold text-[#EEDFC7] tracking-tight">
                    Rekomendasi Untuk Kamu
                  </h2>
                  <span className="text-[11px] font-medium text-[#607938]">
                    Live Global
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {recommendations.slice(0, 6).map((t) => {
                    const isActive = isSameTrack(t, activeTrack);
                    return (
                      <div
                        key={t.id}
                        onClick={() => handlePlayItem(t, recommendations)}
                        className={`p-2 rounded-lg border flex items-center justify-between gap-2.5 cursor-pointer ${
                          isActive
                            ? 'bg-[#53341A]/40 border-[#CE7F20]/45'
                            : 'bg-[#171719] border-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-11 h-11 rounded overflow-hidden bg-[#0B0B0C] border border-white/[0.07] flex-shrink-0">
                            <img
                              src={t.coverUrl}
                              alt={t.title}
                              className="w-full h-full object-cover block"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs font-semibold truncate leading-tight ${
                                isActive ? 'text-[#CE7F20]' : 'text-[#EEDFC7]'
                              }`}
                            >
                              {t.title}
                            </p>
                            <p className="text-[11px] text-[#9A9288] truncate mt-0.5">
                              {t.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {onAddToQueue && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToQueue(t);
                              }}
                              className="p-1.5 rounded text-[#68625B]"
                              title="Tambah ke antrian"
                              aria-label="Tambah ke antrian"
                            >
                              <ListPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div className="w-7 h-7 rounded-md bg-[#CE7F20] text-[#0B0B0C] flex items-center justify-center flex-shrink-0">
                            {isActive && isPlaying ? (
                              <Pause className="w-3.5 h-3.5 fill-current stroke-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current stroke-current translate-x-0.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Section 2: Trending GTA VI & Viral {year} */}
            {gtaTrending.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-[#EEDFC7] tracking-tight">
                      Trending GTA VI &amp; Viral {year}
                    </h2>
                    <p className="text-[11px] text-[#9A9288]">
                      Soundtrack populer &amp; lagu yang ramai diputar tahun {year}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {gtaTrending.map((t) => {
                    const isActive = isSameTrack(t, activeTrack);
                    return (
                      <div
                        key={t.id}
                        onClick={() => handlePlayItem(t, gtaTrending)}
                        className={`p-2.5 rounded-xl border flex flex-col gap-2.5 cursor-pointer ${
                          isActive
                            ? 'bg-[#53341A]/35 border-[#CE7F20]/45'
                            : 'bg-[#171719] border-white/[0.06]'
                        }`}
                      >
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#0B0B0C] border border-white/[0.06]">
                          <img
                            src={t.coverUrl}
                            alt={t.title}
                            className="w-full h-full object-cover block"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-[#CE7F20] text-[#0B0B0C] flex items-center justify-center">
                            {isActive && isPlaying ? (
                              <Pause className="w-4 h-4 fill-current stroke-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current stroke-current translate-x-0.5" />
                            )}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold truncate leading-tight ${
                              isActive ? 'text-[#CE7F20]' : 'text-[#EEDFC7]'
                            }`}
                          >
                            {t.title}
                          </p>
                          <p className="text-[11px] text-[#9A9288] truncate mt-0.5">
                            {t.artist}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Section 3: Top Songs {year} (Global Real-Time Chart) */}
            {topGlobal.length > 0 && (
              <section className="space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-[#EEDFC7] tracking-tight">
                      Top Songs {year}
                    </h2>
                    <p className="text-[11px] text-[#9A9288]">
                      Tangga lagu global real-time
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-[#68625B]">
                    {topGlobal.length} lagu
                  </span>
                </div>

                <div className="divide-y divide-white/[0.04]">
                  {topGlobal.map((t, index) => {
                    const isActive = isSameTrack(t, activeTrack);
                    const isLiked = isLikedTrack ? isLikedTrack(t.id) : false;

                    return (
                      <div
                        key={t.id}
                        onClick={() => handlePlayItem(t, topGlobal)}
                        className={`grid grid-cols-[22px_1fr_auto_auto_auto] gap-2 sm:gap-3.5 px-2 sm:px-3 py-2.5 rounded-lg text-sm items-center cursor-pointer ${
                          isActive
                            ? 'bg-[#53341A]/35 text-[#EEDFC7]'
                            : 'text-[#9A9288]'
                        }`}
                      >
                        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                          {isActive ? (
                            isPlaying ? (
                              <Volume2 className="w-4 h-4 text-[#CE7F20]" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-[#CE7F20] fill-current translate-x-0.5" />
                            )
                          ) : (
                            <span className="text-xs font-mono text-[#68625B]">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-[#19191B] border border-white/[0.06]">
                            <img
                              src={t.coverUrl}
                              alt={t.title}
                              className="w-full h-full object-cover block"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span
                              className={`truncate text-sm leading-tight ${
                                isActive ? 'text-[#CE7F20] font-semibold' : 'text-[#EEDFC7] font-medium'
                              }`}
                            >
                              {t.title}
                            </span>
                            <span className="text-xs text-[#9A9288] truncate pt-0.5">
                              {t.artist}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center">
                          {onAddToQueue && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToQueue(t);
                              }}
                              className="p-1.5 rounded text-[#68625B]"
                              title="Tambah ke antrian"
                              aria-label="Tambah ke antrian"
                            >
                              <ListPlus className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleLikeTrack?.(t);
                            }}
                            className={`p-1.5 rounded ${
                              isLiked ? 'text-[#CE7F20]' : 'text-[#68625B]'
                            }`}
                            title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                            aria-label="Favorit"
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#CE7F20]' : ''}`} />
                          </button>
                        </div>

                        <span className="text-xs font-mono text-[#68625B] text-right min-w-[34px]">
                          {formatDuration(t.durationMs)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};
