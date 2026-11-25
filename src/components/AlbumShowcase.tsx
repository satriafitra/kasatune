/**
 * AlbumShowcase Component (Kasatune Editorial Studio Stage)
 * Distinct warm-obsidian + sunset-orange layout (non-Spotify):
 * - Framed square artwork card with soft ambient warm wash & inline orange pill controls
 * - Clean editorial tracklist with orange active surface, crisp typography, and zero clutter
 */

import React, { useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  Volume2,
  Pencil,
  Shuffle,
  Check,
} from 'lucide-react';
import type { BackendRadioheadTrack } from '../api/backend';
import type { AlbumColors } from '../hooks/useAlbumColor';
import type { AlbumFilterType } from './DiscordServerRail';
import type { CustomPlaylistData } from '../hooks/useCustomPlaylist';
import type { PinnedServerItem } from './AddAlbumModal';
import { computeRealtimeStreams, getMonthlyListeners, isSameTrack, isValidImageUrl } from '../api/liveSearch';

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
  friendHeaderSlot?: React.ReactNode;
  activeAlbum?: AlbumFilterType;
  albumEntity?: PinnedServerItem | null;
  customPlaylist?: CustomPlaylistData;
  onOpenEditModal?: () => void;
  isLikedTrack?: (trackId: string) => boolean;
  onToggleLikeTrack?: (track: BackendRadioheadTrack) => void;
  onToggleShuffle?: () => void;
  isShuffle?: boolean;
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
  friendHeaderSlot,
  activeAlbum = 'favorites',
  albumEntity,
  customPlaylist,
  onOpenEditModal,
  isLikedTrack,
  onToggleLikeTrack,
  onToggleShuffle,
  isShuffle = false,
}) => {
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const isFavorites = activeAlbum === 'favorites';
  const isFriend = activeAlbum === 'friend';

  const isArtistView =
    !isFavorites &&
    !isFriend &&
    (albumEntity?.type === 'artist' ||
      activeAlbum === 'richbrian' ||
      activeAlbum === 'sheilaon7' ||
      activeAlbum === 'radiohead' ||
      activeAlbum === 'playboicarti' ||
      activeAlbum === 'drake' ||
      activeAlbum === 'brunomars' ||
      activeAlbum === 'jkt48' ||
      activeAlbum === 'leserafim' ||
      activeAlbum === 'twice' ||
      activeAlbum === 'aespa' ||
      activeAlbum === 'vander' ||
      activeAlbum === 'akumanoko' ||
      activeAlbum.startsWith('online-artist-') ||
      (tracks.length > 2 && tracks.every((t) => t.artist.toLowerCase() === tracks[0].artist.toLowerCase())));

  const artistName =
    albumEntity?.name ||
    albumEntity?.artist ||
    (tracks.length > 0 ? tracks[0].artist : track?.artist) ||
    'Artis';

  const albumTitle =
    albumEntity?.albumTitle ||
    albumEntity?.name ||
    (tracks.length > 0 ? tracks[0].album : track?.album) ||
    'Album';

  const coverImage =
    (isValidImageUrl(albumEntity?.imageUrl) ? albumEntity?.imageUrl : '') ||
    (tracks.length > 0 ? tracks[0].coverUrl : track?.coverUrl) ||
    '/covers/radiohead.jpg';

  const releaseYear =
    albumEntity?.year ||
    (tracks.length > 0 ? tracks[0].year : track?.year) ||
    new Date().getFullYear();

  const monthlyListeners = getMonthlyListeners(artistName, tracks.length);
  const [r, g, b] = colors.dominantColor || [255, 107, 43];

  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '3:45';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const isCurrentTrackInView = tracks.some((t) => isSameTrack(t, track) || t.id === activeTrackId);
  const isStagePlaying = isPlaying && isCurrentTrackInView;

  const handleMasterPlayToggle = () => {
    if (isStagePlaying) {
      onTogglePlay();
    } else if (tracks.length > 0) {
      if (!isCurrentTrackInView) {
        onSelectTrack(tracks[0]);
      } else {
        onTogglePlay();
      }
    }
  };

  const heroArtwork = isFavorites
    ? customPlaylist?.coverUrl ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
    : coverImage;

  const heroEyebrow = isArtistView
    ? 'Artis Pilihan'
    : isFavorites
    ? 'Koleksi Favorit'
    : isFriend
    ? 'Live Sync Teman'
    : 'Album';

  const heroTitle = isArtistView
    ? artistName
    : isFavorites
    ? customPlaylist?.name || 'Favorit Saya'
    : albumTitle;

  return (
    <div className="w-full h-full bg-[#131110] rounded-2xl border border-white/[0.07] flex flex-col overflow-y-auto select-none relative custom-scrollbar">
      {/* Friend Live Sync Panel ONLY when viewing Friend mode */}
      {isFriend && friendHeaderSlot && (
        <div className="border-b border-white/[0.06] bg-[#161311]/70 pt-2 flex-shrink-0">
          {friendHeaderSlot}
        </div>
      )}

      {/* 1. Editorial Studio Header (Framed Artwork + Inline Orange Capsule Actions) */}
      <div
        className="w-full p-4 sm:p-6 md:p-7 relative overflow-hidden flex-shrink-0 border-b border-white/[0.06]"
        style={{
          backgroundImage: `radial-gradient(ellipse at 18% 0%, rgba(255, 107, 43, 0.18) 0%, rgba(${r}, ${g}, ${b}, 0.10) 42%, transparent 78%)`,
        }}
      >
        {activeAlbum === 'friend' && friendStandbyInfo?.isStandby && (
          <div className="mb-3.5 px-3 py-2 rounded-xl bg-[#1A1715]/90 border border-[#FF6B2B]/35 flex items-center gap-2.5 z-20 relative">
            <span className="w-2 h-2 rounded-full bg-[#FF6B2B] flex-shrink-0" />
            <p className="text-xs font-medium text-[#FAF6F2] truncate">
              {friendStandbyInfo.friendName} sedang Standby (Menunggu lagu diputar)
            </p>
          </div>
        )}

        <div className="relative z-10 flex flex-row items-center sm:items-end gap-4 sm:gap-6">
          {/* Framed Rounded-2xl Artwork (Consistent across Artist, Favorites, & Album) */}
          <div className="w-20 h-20 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden bg-[#1D1A17] border border-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.55)] flex-shrink-0 relative flex items-center justify-center">
            <span className="text-lg sm:text-2xl font-bold text-[#A8A099] uppercase">
              {heroTitle.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3) || '♪'}
            </span>
            {heroArtwork && (
              <img
                src={heroArtwork}
                alt={heroTitle}
                className="w-full h-full object-cover absolute inset-0"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            )}
          </div>

          {/* Right Meta + Inline Action Bar */}
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2B] flex-shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-[#FF8A4C] truncate">
                {heroEyebrow}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-[#FAF6F2] tracking-tight leading-tight break-words line-clamp-2">
              {heroTitle}
            </h1>

            <p className="text-xs text-[#A8A099] truncate">
              {isArtistView ? (
                <>
                  {monthlyListeners} &bull; <span className="text-[#FAF6F2] font-medium">{tracks.length} Lagu</span>
                </>
              ) : isFavorites ? (
                <>
                  {customPlaylist?.description || 'Daftar lagu tersimpan'} &bull;{' '}
                  <span className="text-[#FAF6F2] font-medium">{tracks.length} lagu</span>
                </>
              ) : (
                <>
                  <span className="text-[#FAF6F2] font-medium">{artistName}</span> &bull; {releaseYear} &bull; {tracks.length} Lagu
                </>
              )}
            </p>

            {/* Desktop Inline Controls (Distinct Rounded-xl Orange Pill — Not Spotify Circle) */}
            <div className="hidden sm:flex items-center gap-2.5 pt-2.5">
              <button
                onClick={handleMasterPlayToggle}
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#FF6B2B] to-[#FF8A3D] hover:brightness-110 active:scale-[0.98] text-[#0A0908] text-xs font-bold flex items-center gap-2 shadow-[0_8px_24px_rgba(255,107,43,0.32)] transition-all cursor-pointer"
                title={isStagePlaying ? 'Jeda Musik' : 'Putar Semua'}
              >
                {isStagePlaying ? (
                  <Pause className="w-4 h-4 fill-current stroke-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current stroke-current translate-x-0.5" />
                )}
                <span>{isStagePlaying ? 'Jeda' : 'Putar'}</span>
              </button>

              {onToggleShuffle && (
                <button
                  onClick={onToggleShuffle}
                  className={`h-10 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isShuffle
                      ? 'bg-[#FF6B2B]/15 border-[#FF6B2B]/40 text-[#FF8A4C]'
                      : 'bg-[#1B1816] border-white/[0.08] text-[#B8B0A8] hover:text-white hover:border-white/20'
                  }`}
                  title={isShuffle ? 'Acak Aktif' : 'Acak Pemutaran'}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Acak</span>
                </button>
              )}

              {isArtistView && (
                <button
                  onClick={() => setIsFollowing((v) => !v)}
                  className={`h-10 px-4 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isFollowing
                      ? 'bg-[#FF6B2B]/15 border-[#FF6B2B]/40 text-[#FF8A4C]'
                      : 'bg-[#1B1816] border-white/[0.08] text-[#FAF6F2] hover:border-white/25'
                  }`}
                >
                  {isFollowing && <Check className="w-3.5 h-3.5" />}
                  <span>{isFollowing ? 'Mengikuti' : 'Ikuti'}</span>
                </button>
              )}

              {isFavorites && onOpenEditModal && (
                <button
                  onClick={onOpenEditModal}
                  className="h-10 px-3.5 rounded-xl bg-[#1B1816] border border-white/[0.08] hover:border-white/25 text-[#FAF6F2] flex items-center gap-1.5 text-xs font-semibold transition-all"
                  title="Edit rincian playlist"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#FF8A4C]" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Compact Action Row (Full width breathing room on < sm) */}
        <div className="flex sm:hidden items-center gap-2 pt-4 relative z-10">
          <button
            onClick={handleMasterPlayToggle}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#FF6B2B] to-[#FF8A3D] active:scale-[0.98] text-[#0A0908] text-xs font-bold flex items-center gap-1.5 shadow-[0_6px_18px_rgba(255,107,43,0.3)] flex-shrink-0"
          >
            {isStagePlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current stroke-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current stroke-current translate-x-0.5" />
            )}
            <span>{isStagePlaying ? 'Jeda' : 'Putar'}</span>
          </button>

          {onToggleShuffle && (
            <button
              onClick={onToggleShuffle}
              className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isShuffle
                  ? 'bg-[#FF6B2B]/15 border-[#FF6B2B]/40 text-[#FF8A4C]'
                  : 'bg-[#1B1816] border-white/[0.08] text-[#B8B0A8]'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Acak</span>
            </button>
          )}

          {isArtistView && (
            <button
              onClick={() => setIsFollowing((v) => !v)}
              className={`h-9 px-3.5 rounded-xl border text-xs font-semibold transition-all ${
                isFollowing
                  ? 'bg-[#FF6B2B]/15 border-[#FF6B2B]/40 text-[#FF8A4C]'
                  : 'bg-[#1B1816] border-white/[0.08] text-[#FAF6F2]'
              }`}
            >
              {isFollowing ? 'Mengikuti' : 'Ikuti'}
            </button>
          )}

          {isFavorites && onOpenEditModal && (
            <button
              onClick={onOpenEditModal}
              className="h-9 px-3 rounded-xl bg-[#1B1816] border border-white/[0.08] text-[#FAF6F2] flex items-center gap-1.5 text-xs font-semibold"
            >
              <Pencil className="w-3.5 h-3.5 text-[#FF8A4C]" />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Clean Editorial Tracklist */}
      <div className="px-2.5 sm:px-6 py-4 sm:py-5 flex-1 flex flex-col bg-[#131110]">
        <div className="flex items-center justify-between px-2 mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8A817A]">
            {isArtistView ? 'Lagu Populer' : 'Daftar Lagu'}
          </h2>
          {tracks.length > 0 && (
            <span className="text-[11px] font-mono text-[#756E68]">
              {tracks.length} trek
            </span>
          )}
        </div>

        {isFavorites && tracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-[#A8A099]">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B2B]/15 border border-[#FF6B2B]/25 flex items-center justify-center mb-3">
              <Heart className="w-5 h-5 text-[#FF6B2B]" />
            </div>
            <h3 className="text-sm font-bold text-[#FAF6F2] mb-1">Belum Ada Lagu Favorit</h3>
            <p className="text-xs text-[#756E68] max-w-xs">
              Ketuk ikon hati pada lagu apa saja untuk menyimpannya ke koleksi ini.
            </p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-[#8A817A]">
            <p className="text-xs">Memuat daftar lagu...</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tracks.map((t, index) => {
              const isActive = isSameTrack(t, track) || t.id === activeTrackId;
              const isHovered = hoveredTrackId === t.id;
              const isLiked = isLikedTrack ? isLikedTrack(t.id) : false;
              const streamsFormatted = computeRealtimeStreams(t.title, t.artist, index, (t as any).rank);

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
                  className={`grid grid-cols-[24px_1fr_auto_auto] md:grid-cols-[28px_5fr_2.5fr_34px_auto] gap-2.5 sm:gap-4 px-2.5 sm:px-3.5 py-2 rounded-xl text-sm items-center cursor-pointer transition-all border group ${
                    isActive
                      ? 'bg-[#FF6B2B]/15 border-[#FF6B2B]/25 text-[#FF8A4C]'
                      : 'bg-transparent border-transparent hover:bg-white/[0.04] text-[#B8B0A8]'
                  }`}
                >
                  <div className="w-6 h-7 flex items-center justify-center flex-shrink-0">
                    {isActive ? (
                      isPlaying ? (
                        isHovered ? (
                          <Pause className="w-4 h-4 text-[#FF6B2B] fill-[#FF6B2B]" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-[#FF6B2B] animate-pulse" />
                        )
                      ) : (
                        <Play className="w-4 h-4 text-[#FF6B2B] fill-[#FF6B2B] translate-x-0.5" />
                      )
                    ) : isHovered ? (
                      <Play className="w-4 h-4 text-[#FAF6F2] fill-[#FAF6F2] translate-x-0.5" />
                    ) : (
                      <span className="text-xs font-mono text-[#756E68]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#1D1A17] border border-white/[0.06]">
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
                        className={`truncate text-sm leading-tight ${
                          isActive ? 'text-[#FFA14A] font-semibold' : 'text-[#FAF6F2] font-medium'
                        }`}
                      >
                        {t.title}
                      </span>
                      <span className="text-xs text-[#8A817A] truncate pt-0.5">
                        {t.artist}
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:block text-[11px] font-mono text-[#756E68] truncate">
                    {streamsFormatted}
                  </div>

                  <div className="flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLikeTrack?.(t);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isLiked
                          ? 'text-[#FF6B2B]'
                          : 'text-[#756E68] sm:opacity-0 sm:group-hover:opacity-100 hover:text-[#FAF6F2]'
                      }`}
                      title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                      aria-label="Favorit"
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#FF6B2B]' : ''}`} />
                    </button>
                  </div>

                  <span className="text-xs font-mono text-[#756E68] text-right min-w-[36px]">
                    {formatDuration(t.durationMs)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
