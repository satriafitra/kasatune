/**
 * AlbumShowcase Component
 * Modern dark matte elegance (#0B0B0C / #121213) with #CE7F20, #EEDFC7, #607938, #53341A:
 * - Seamless artist photo gradient fading cleanly into the dark #121213 main background (desktop & mobile)
 * - Flat, minimal, zero-glow controls without noisy interactive effects
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

  return (
    <div className="w-full h-full bg-[#121213] rounded-xl border border-white/[0.07] flex flex-col overflow-y-auto select-none relative custom-scrollbar">
      {/* Friend Live Sync Panel ONLY when viewing Friend mode */}
      {isFriend && friendHeaderSlot && (
        <div className="border-b border-white/[0.07] bg-[#101011] pt-2 flex-shrink-0">
          {friendHeaderSlot}
        </div>
      )}

      {/* 1. Seamless Artist Photo-to-Dark Background Gradient Header (Desktop & Mobile) */}
      {isArtistView ? (
        <div className="relative w-full min-h-[190px] sm:min-h-[250px] flex flex-col justify-end p-4 sm:p-7 overflow-hidden flex-shrink-0 bg-[#181512]">
          <div className="absolute inset-0 z-0">
            <img
              src={coverImage}
              alt={artistName}
              className="w-full h-full object-cover object-center opacity-75"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121213] via-[#121213]/65 to-black/20" />
          </div>

          <div className="relative z-10 flex flex-col gap-1 max-w-3xl min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#CE7F20]">
              Artis
            </span>
            <h1 className="text-2xl sm:text-5xl font-bold text-[#EEDFC7] tracking-tight leading-tight break-words">
              {artistName}
            </h1>
            <p className="text-xs sm:text-sm text-[#EEDFC7]/75">
              {monthlyListeners} &bull; {tracks.length} Lagu
            </p>
          </div>
        </div>
      ) : isFavorites ? (
        <div className="w-full p-4 sm:p-7 flex flex-col justify-end relative overflow-hidden flex-shrink-0 bg-gradient-to-b from-[#53341A]/55 via-[#1C1612] to-[#121213]">
          <div className="flex flex-row items-center sm:items-end gap-4 sm:gap-5 z-10">
            <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-[#0B0B0C] border border-white/10 flex-shrink-0">
              <img
                src={
                  customPlaylist?.coverUrl ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
                }
                alt={customPlaylist?.name || 'Favorit'}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col gap-1 text-left min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-[#CE7F20]">
                Playlist Favorit
              </span>
              <h1 className="text-xl sm:text-4xl font-bold text-[#EEDFC7] tracking-tight leading-tight truncate">
                {customPlaylist?.name || 'Favorit Saya'}
              </h1>
              <p className="text-xs text-[#9A9288] truncate">
                {customPlaylist?.description || 'Daftar lagu tersimpan'} &bull;{' '}
                <span className="text-[#EEDFC7]">{tracks.length} lagu</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full p-4 sm:p-7 flex flex-col justify-end relative overflow-hidden flex-shrink-0 bg-gradient-to-b from-[#53341A]/45 via-[#1A1613] to-[#121213]">
          {activeAlbum === 'friend' && friendStandbyInfo?.isStandby && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-[#0B0B0C]/85 border border-white/[0.08] flex items-center gap-2 z-20">
              <span className="w-2 h-2 rounded-full bg-[#607938] flex-shrink-0" />
              <p className="text-xs text-[#EEDFC7] truncate">
                {friendStandbyInfo.friendName} sedang Standby (Menunggu lagu diputar)
              </p>
            </div>
          )}

          <div className="flex flex-row items-center sm:items-end gap-4 sm:gap-5 z-10">
            <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-[#0B0B0C] border border-white/10 flex-shrink-0">
              <img
                src={coverImage}
                alt={albumTitle}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col gap-1 min-w-0 flex-1 text-left">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-[#607938]">
                {isFriend ? 'Live Sync' : 'Album'}
              </span>
              <h1 className="text-xl sm:text-4xl font-bold text-[#EEDFC7] tracking-tight leading-tight truncate">
                {albumTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#9A9288]">
                <span className="text-[#EEDFC7] font-medium truncate">{artistName}</span>
                <span>&bull;</span>
                <span>{releaseYear}</span>
                <span>&bull;</span>
                <span>{tracks.length} Lagu</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Flat Minimal Action Bar (Zero Glow / Zero Bounce) */}
      <div className="px-4 sm:px-7 py-3 flex items-center gap-2.5 flex-shrink-0 bg-[#121213]">
        <button
          onClick={handleMasterPlayToggle}
          className="h-9 sm:h-10 px-4 sm:px-5 rounded-lg bg-[#CE7F20] text-[#0B0B0C] text-xs font-semibold flex items-center gap-2 cursor-pointer flex-shrink-0"
          title={isStagePlaying ? 'Jeda Musik' : 'Putar Semua'}
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
            className={`h-9 sm:h-10 px-3.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
              isShuffle
                ? 'bg-[#607938]/20 border-[#607938] text-[#EEDFC7]'
                : 'bg-[#19191B] border-white/[0.08] text-[#9A9288]'
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
            className={`h-9 sm:h-10 px-3.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
              isFollowing
                ? 'bg-[#607938]/20 border-[#607938] text-[#EEDFC7]'
                : 'bg-[#19191B] border-white/[0.08] text-[#EEDFC7]'
            }`}
          >
            {isFollowing && <Check className="w-3.5 h-3.5 text-[#607938]" />}
            <span>{isFollowing ? 'Mengikuti' : 'Ikuti'}</span>
          </button>
        )}

        {isFavorites && onOpenEditModal && (
          <button
            onClick={onOpenEditModal}
            className="h-9 sm:h-10 px-3.5 rounded-lg bg-[#19191B] border border-white/[0.08] text-[#EEDFC7] flex items-center gap-1.5 text-xs font-medium"
            title="Edit rincian playlist"
          >
            <Pencil className="w-3.5 h-3.5 text-[#CE7F20]" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {/* 3. Clean Minimal Tracklist */}
      <div className="px-2.5 sm:px-7 pb-6 pt-1 flex-1 flex flex-col bg-[#121213]">
        <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-white/[0.06]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9A9288]">
            {isArtistView ? 'Populer' : 'Daftar Lagu'}
          </h2>
          {tracks.length > 0 && (
            <span className="text-[11px] font-mono text-[#68625B]">
              {tracks.length} lagu
            </span>
          )}
        </div>

        {isFavorites && tracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-[#9A9288]">
            <Heart className="w-7 h-7 text-[#CE7F20] mb-3" />
            <h3 className="text-sm font-semibold text-[#EEDFC7] mb-1">Belum Ada Lagu Favorit</h3>
            <p className="text-xs text-[#68625B] max-w-xs">
              Ketuk ikon hati pada lagu apa saja untuk menyimpannya di sini.
            </p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-[#68625B]">
            <p className="text-xs">Memuat daftar lagu...</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {tracks.map((t, index) => {
              const isActive = isSameTrack(t, track) || t.id === activeTrackId;
              const isLiked = isLikedTrack ? isLikedTrack(t.id) : false;
              const streamsFormatted = computeRealtimeStreams(t.title, t.artist, index, (t as any).rank);

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (isActive) {
                      onTogglePlay();
                    } else {
                      onSelectTrack(t);
                    }
                  }}
                  className={`grid grid-cols-[24px_1fr_auto_auto] md:grid-cols-[28px_5fr_2.5fr_34px_auto] gap-2.5 sm:gap-4 px-2 sm:px-3 py-2.5 rounded-lg text-sm items-center cursor-pointer ${
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

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-[#19191B] border border-white/[0.06]">
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

                  <div className="hidden md:block text-[11px] font-mono text-[#68625B] truncate">
                    {streamsFormatted}
                  </div>

                  <div className="flex items-center justify-center">
                    <button
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

                  <span className="text-xs font-mono text-[#68625B] text-right min-w-[36px]">
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
