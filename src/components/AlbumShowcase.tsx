/**
 * AlbumShowcase Component (Discord x Spotify Studio & Vinyl Stage)
 * Deep obsidian dark surfaces with real-time album color harmony:
 * - Collector's Vinyl Record peeking out from the official album sleeve (rotates when playing!)
 * - Ambient gradient header dynamically driven by the active album's real colors
 * - Radiant Play button illuminated with the album's dominant hue
 * - High-contrast Tracklist Table (#, Title, Album, Duration) with vibrant Ice Blue (#BFE7EA) indicators
 */

import React, { useState } from 'react';
import { Play, Pause, Heart, MoreHorizontal, Clock, Volume2, Pencil, Sparkles } from 'lucide-react';
import type { BackendRadioheadTrack } from '../api/backend';
import type { AlbumColors } from '../hooks/useAlbumColor';
import type { AlbumFilterType } from './DiscordServerRail';
import type { CustomPlaylistData } from '../hooks/useCustomPlaylist';

interface AlbumShowcaseProps {
  track: BackendRadioheadTrack | null;
  tracks: BackendRadioheadTrack[];
  activeTrackId: string;
  colors: AlbumColors;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSelectTrack: (track: BackendRadioheadTrack) => void;
  friendStandbyInfo?: {
    friendName: string;
    avatarUrl?: string;
    isStandby: boolean;
  };
  activeAlbum?: AlbumFilterType;
  customPlaylist?: CustomPlaylistData;
  onOpenEditModal?: () => void;
  isLikedTrack?: (trackId: string) => boolean;
  onToggleLikeTrack?: (track: BackendRadioheadTrack) => void;
}

export const AlbumShowcase: React.FC<AlbumShowcaseProps> = ({
  track,
  tracks,
  activeTrackId,
  colors,
  isPlaying,
  onTogglePlay,
  onSelectTrack,
  friendStandbyInfo,
  activeAlbum,
  customPlaylist,
  onOpenEditModal,
  isLikedTrack,
  onToggleLikeTrack,
}) => {
  const isFavorites = activeAlbum === 'favorites';

  const title = isFavorites
    ? (customPlaylist?.name || 'Playlist Favorit Saya')
    : (track?.title || 'HOLLOW HUNGER');
  const artist = isFavorites
    ? 'Dibuat oleh Anda'
    : (track?.artist || 'OxT');
  const album = isFavorites
    ? (customPlaylist?.description || `${tracks.length} lagu favorit pilihan`)
    : (track?.album || 'OVERLORD IV OP - HOLLOW HUNGER');
  const year = isFavorites ? 2025 : (track?.year || 2022);
  const imageUrl = isFavorites
    ? (customPlaylist?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80')
    : (track?.coverUrl || 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/0a/a7/9f/0aa79f8a-101c-f475-c158-66e56d4a378a/JK_ZMCZ-15801.jpg/600x600bb.jpg');

  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);

  const [r, g, b] = colors.dominantColor || [232, 155, 91];
  const albumColorRgb = `rgb(${r}, ${g}, ${b})`;

  const activeTrackLiked = track ? (isLikedTrack ? isLikedTrack(track.id) : false) : false;

  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '3:58';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="w-full h-full bg-[#141619] rounded-lg border border-[#282B32] flex flex-col overflow-y-auto select-none relative custom-scrollbar shadow-lg">
      {/* 1. Collector's Vinyl & Album Hero Banner */}
      <div
        className="w-full p-5 sm:p-7 flex flex-col justify-end transition-all duration-[1200ms] relative overflow-hidden flex-shrink-0 border-b border-[#282B32]/70"
        style={{
          background: `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.35) 0%, rgba(${r}, ${g}, ${b}, 0.12) 50%, rgba(20, 22, 25, 0.98) 90%, #141619 100%)`,
        }}
      >
        {activeAlbum === 'friend' && friendStandbyInfo?.isStandby && (
          <div className="mb-4 p-2.5 rounded-lg bg-[#0E1013]/90 border border-[#E89B5B]/50 flex items-center justify-between gap-3 shadow-md z-20 backdrop-blur-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              {friendStandbyInfo.avatarUrl ? (
                <img
                  src={friendStandbyInfo.avatarUrl}
                  alt={friendStandbyInfo.friendName}
                  className="w-8 h-8 rounded-full border border-[#5865F2] object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center font-bold text-xs text-white flex-shrink-0">
                  {friendStandbyInfo.friendName.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-[#E89B5B]" />
                  <span>{friendStandbyInfo.friendName} sedang Standby (Tidak Memutar Lagu)</span>
                </p>
                <p className="text-[11px] text-[#A0A5AD] truncate">
                  Kasatune terhubung via Discord Lanyard dan siap sinkron otomatis saat musik diputar di Spotify.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1E22] text-[#BFE7EA] border border-[#282B32] flex-shrink-0">
              Standby Ready
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 z-10">
          {/* Vinyl + Album Cover Assembly */}
          <div className="relative flex items-center flex-shrink-0 group">
            {/* Peeking Vinyl Record */}
            <div
              className={`absolute top-2 left-6 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#090A0C] border-4 border-[#141619] shadow-[0_12px_36px_rgba(0,0,0,0.85)] flex items-center justify-center transition-transform duration-700 pointer-events-none z-0 ${
                isPlaying
                  ? 'translate-x-12 sm:translate-x-16 animate-spin-slow'
                  : 'translate-x-6'
              }`}
            >
              {/* Concentric Vinyl Grooves */}
              <div className="w-28 h-28 sm:w-34 sm:h-34 rounded-full border border-white/5 flex items-center justify-center">
                <div className="w-20 h-20 sm:w-26 sm:h-26 rounded-full border border-white/5 flex items-center justify-center">
                  {/* Vinyl Center Label (Dynamically colored to match album) */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-[#090A0C] transition-colors duration-700"
                    style={{ backgroundColor: albumColorRgb }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-[#090A0C]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Square Album Cover Sleeve */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.7)] overflow-hidden bg-[#0B0C0E] border border-[#282B32] z-10 flex-shrink-0">
              <img
                src={imageUrl}
                alt={title}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Metadata Block */}
          <div className="flex flex-col gap-1.5 min-w-0 text-center sm:text-left z-10 pl-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              {isFavorites ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-white bg-[#FF4B72] px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-white" />
                  <span>Kustom &bull; Playlist Saya</span>
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0B0C0E] bg-[#BFE7EA] px-2 py-0.5 rounded shadow-sm">
                  Master Audio
                </span>
              )}
              <span className="text-[11px] font-mono text-[#BFE7EA] font-semibold">
                {isFavorites ? `${tracks.length} Lagu Favorit` : '44.1 kHz • FLAC'}
              </span>
            </div>

            {/* Song Title */}
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight truncate">
              {title}
            </h1>

            {/* Subtitle & Credits */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#A0A5AD] pt-0.5">
              <span
                className="font-extrabold cursor-pointer transition-colors hover:text-white"
                style={{ color: '#FFEAD3' }}
              >
                {artist}
              </span>
              <span>&bull;</span>
              <span className="text-white font-semibold truncate max-w-xs">{album}</span>
              <span>&bull;</span>
              <span>{year}</span>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
              <button
                onClick={onTogglePlay}
                className="h-9 px-4 rounded-md bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center gap-2 text-xs font-bold transition-colors active:scale-95 shadow-sm"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-black stroke-black" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black stroke-black translate-x-0.5" />
                    <span>{isFavorites ? 'Putar Semua' : 'Play Master'}</span>
                  </>
                )}
              </button>

              {/* Heart Button */}
              {track && (
                <button
                  onClick={() => onToggleLikeTrack?.(track)}
                  className={`h-9 w-9 flex items-center justify-center transition-colors rounded-md bg-[#141619] border border-[#282B32] hover:bg-[#1C1E22] ${
                    activeTrackLiked ? 'text-[#FF4B72]' : 'text-[#A0A5AD] hover:text-white'
                  }`}
                  title={activeTrackLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                >
                  <Heart className={`w-4 h-4 ${activeTrackLiked ? 'fill-[#FF4B72]' : ''}`} />
                </button>
              )}

              {/* Edit Details Button */}
              {isFavorites && onOpenEditModal && (
                <button
                  onClick={onOpenEditModal}
                  className="h-9 px-3.5 rounded-md bg-[#1C1E22] hover:bg-[#282B32] text-white flex items-center gap-1.5 text-xs font-bold border border-[#282B32] hover:border-[#BFE7EA]/40 transition-colors shadow-sm"
                  title="Kustomisasi nama, profil foto, dan deskripsi playlist"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#BFE7EA]" />
                  <span>Edit Rincian</span>
                </button>
              )}

              <button
                className="h-9 w-9 flex items-center justify-center text-[#A0A5AD] hover:text-white rounded-md bg-[#141619] border border-[#282B32] hover:bg-[#1C1E22] transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Authentic Spotify Tracklist Table */}
      <div className="px-4 sm:px-6 pb-6 flex-1 flex flex-col pt-3">
        {/* Empty State for Favorites */}
        {isFavorites && tracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-[#A0A5AD]">
            <div className="w-16 h-16 rounded-full bg-[#1C1E22] border border-[#282B32] flex items-center justify-center mb-4 text-[#FF4B72]">
              <Heart className="w-8 h-8 fill-current" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Belum Ada Lagu Favorit
            </h3>
            <p className="text-xs text-[#656A74] max-w-sm mb-4 leading-relaxed">
              Klik ikon hati (<Heart className="inline w-3 h-3 text-[#FF4B72] fill-current" />) pada lagu apa saja untuk menyimpannya otomatis ke playlist ini.
            </p>
            {onOpenEditModal && (
              <button
                onClick={onOpenEditModal}
                className="px-4 py-2 rounded-md bg-[#1C1E22] hover:bg-[#282B32] text-xs font-bold text-white border border-[#282B32] flex items-center gap-1.5 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-[#BFE7EA]" />
                <span>Kustomisasi Profil Playlist</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[32px_1fr_36px_auto] md:grid-cols-[32px_4fr_3fr_36px_auto] gap-3 sm:gap-4 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#A0A5AD] border-b border-[#282B32] mb-1">
              <div className="text-center">#</div>
              <div>Title</div>
              <div className="hidden md:block">Album</div>
              <div className="text-center flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-[#656A74]" />
              </div>
              <div className="text-right flex items-center justify-end pr-2">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Table Rows */}
            <div className="space-y-0.5">
              {tracks.map((t, index) => {
                const isActive = t.id === activeTrackId;
                const isHovered = hoveredTrackId === t.id;
                const isLiked = isLikedTrack ? isLikedTrack(t.id) : false;

                return (
                  <div
                    key={t.id}
                    onMouseEnter={() => setHoveredTrackId(t.id)}
                    onMouseLeave={() => setHoveredTrackId(null)}
                    onClick={() => {
                      if (isActive) {
                        onTogglePlay();
                      } else {
                        onSelectTrack(t);
                      }
                    }}
                    className={`grid grid-cols-[32px_1fr_36px_auto] md:grid-cols-[32px_4fr_3fr_36px_auto] gap-3 sm:gap-4 px-3 py-2 rounded-md text-sm items-center cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#1C1E22] shadow-sm'
                        : 'hover:bg-[#1E2025] text-[#A0A5AD]'
                    }`}
                  >
                    {/* Index / Play / Pause Button with larger, comfortable click area */}
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center cursor-pointer hover:bg-white/10 active:scale-90 transition-all flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isActive) {
                          onTogglePlay();
                        } else {
                          onSelectTrack(t);
                        }
                      }}
                      title={isActive ? (isPlaying ? 'Pause lagu' : 'Putar lagu') : 'Putar lagu'}
                    >
                      {isActive ? (
                        isPlaying ? (
                          isHovered ? (
                            <Pause className="w-4 h-4 text-white fill-white" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-[#BFE7EA] animate-pulse" />
                          )
                        ) : (
                          <Play className="w-4 h-4 text-[#BFE7EA] fill-[#BFE7EA] translate-x-0.5" />
                        )
                      ) : isHovered ? (
                        <Play className="w-4 h-4 text-white fill-white translate-x-0.5" />
                      ) : (
                        <span className={isActive ? 'text-[#BFE7EA] font-black text-xs' : 'text-[#656A74] text-xs font-semibold'}>
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Title + Thumbnail + Artist */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] rounded-md overflow-hidden flex-shrink-0 bg-[#0B0C0E] border border-[#282B32]/70 shadow-sm relative">
                        <img
                          src={t.coverUrl}
                          alt={t.title}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                          className="w-full h-full object-cover block"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`font-bold truncate text-xs leading-tight flex items-center gap-1.5 ${
                            isActive ? 'text-white' : 'text-[#F2F3F5]'
                          }`}
                        >
                          <span className="truncate">{t.title}</span>
                          {t.category === 'online' && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 flex-shrink-0">
                              LIVE
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-[#A0A5AD] hover:text-white cursor-pointer truncate">
                          {t.artist}
                        </span>
                      </div>
                    </div>

                    {/* Album */}
                    <div className="hidden md:block text-xs text-[#A0A5AD] hover:text-white truncate">
                      {t.album}
                    </div>

                    {/* Heart Action Button */}
                    <div className="flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLikeTrack?.(t);
                        }}
                        className={`p-1.5 rounded-full transition-all hover:scale-110 active:scale-95 ${
                          isLiked
                            ? 'text-[#FF4B72]'
                            : 'text-[#656A74] opacity-0 group-hover:opacity-100 hover:text-white'
                        }`}
                        title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isLiked ? 'fill-[#FF4B72]' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Duration */}
                    <div className="text-right text-xs font-mono text-[#A0A5AD] pr-2">
                      {formatDuration(t.durationMs)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
