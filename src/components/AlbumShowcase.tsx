/**
 * AlbumShowcase Component (Authentic Spotify Artist & Album Discography Stage)
 * Recreates the exact Spotify visual experience:
 * - Immersive Artist Header with verified badge, monthly listeners, and wide hero banner
 * - Official Album Sleeve & Collector's Vinyl Record for studio albums
 * - Spotify Action Bar: Large #1DB954 circular Play button, Shuffle, Follow pill, More options
 * - "Popular" / Tracklist table with thumbnail, title, explicit badge, realistic stream counts, heart & duration
 * - Active playing track highlighted in Spotify green with live equalizer animation
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

  // Determine if this is an ARTIST showcase (Rich Brian, Playboi Carti, Sheila On 7, Radiohead, Drake, etc.)
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

  // Title, artist & banner metadata resolution
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

  const [r, g, b] = colors.dominantColor || [18, 18, 18];
  const albumColorRgb = `rgb(${r}, ${g}, ${b})`;

  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '3:45';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Check if active track belongs to current tracklist (syncs search results with artist tracklists)
  const isCurrentTrackInView = tracks.some((t) => isSameTrack(t, track) || t.id === activeTrackId);
  const isStagePlaying = isPlaying && isCurrentTrackInView;

  const handleMasterPlayToggle = () => {
    if (isStagePlaying) {
      onTogglePlay();
    } else {
      if (tracks.length > 0) {
        if (!isCurrentTrackInView) {
          onSelectTrack(tracks[0]);
        } else {
          onTogglePlay();
        }
      }
    }
  };

  return (
    <div className="w-full h-full bg-[#121212] rounded-xl border border-[#1E2025] flex flex-col overflow-y-auto select-none relative custom-scrollbar">
      {/* Friend Live Sync Panel ONLY when viewing Friend mode */}
      {isFriend && friendHeaderSlot && (
        <div className="border-b border-[#1E2025] bg-[#141619]/60 flex-shrink-0">
          {friendHeaderSlot}
        </div>
      )}

      {/* 1. Compact & Clean Header Section */}
      {isArtistView ? (
        <div className="relative w-full min-h-[168px] sm:min-h-[230px] flex flex-col justify-end p-4 sm:p-7 overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 z-0">
            <img
              src={coverImage}
              alt={artistName}
              className="w-full h-full object-cover object-center filter brightness-[0.62]"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/65 to-black/25" />
          </div>

          <div className="relative z-10 flex flex-col gap-1 max-w-4xl min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-white/90">
              <span className="w-4 h-4 rounded-full bg-[#3D91F4] flex items-center justify-center text-white flex-shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3.5]" />
              </span>
              <span>Artis Terverifikasi</span>
            </div>

            <h1 className="text-2xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md select-text break-words">
              {artistName}
            </h1>

            <p className="text-xs sm:text-sm font-medium text-white/80">
              {monthlyListeners} &bull; {tracks.length} Lagu
            </p>
          </div>
        </div>
      ) : isFavorites ? (
        <div
          className="w-full p-4 sm:p-7 flex flex-col justify-end relative overflow-hidden flex-shrink-0 border-b border-white/[0.06]"
          style={{
            background: `linear-gradient(180deg, rgba(255, 75, 114, 0.28) 0%, #121212 100%)`,
          }}
        >
          <div className="flex flex-row items-center sm:items-end gap-4 sm:gap-5 z-10">
            <div className="w-20 h-20 sm:w-36 sm:h-36 rounded-xl shadow-xl overflow-hidden bg-[#0B0C0E] border border-white/10 flex-shrink-0">
              <img
                src={
                  customPlaylist?.coverUrl ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
                }
                alt={customPlaylist?.name || 'KASONGS'}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col gap-1 text-left min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#FF4B72]">
                Playlist Favorit
              </span>
              <h1 className="text-xl sm:text-4xl font-black text-white tracking-tight leading-tight truncate">
                {customPlaylist?.name || 'KASONGS'}
              </h1>
              <p className="text-xs text-[#A0A5AD] truncate">
                {customPlaylist?.description || 'Koleksi lagu tersimpan'} &bull;{' '}
                <span className="text-white font-semibold">{tracks.length} lagu</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="w-full p-4 sm:p-7 flex flex-col justify-end relative overflow-hidden flex-shrink-0 border-b border-white/[0.06]"
          style={{
            background: `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.28) 0%, #121212 100%)`,
          }}
        >
          {activeAlbum === 'friend' && friendStandbyInfo?.isStandby && (
            <div className="mb-3 p-2.5 rounded-lg bg-[#0E1013]/80 border border-[#E89B5B]/40 flex items-center justify-between gap-3 z-20">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#E89B5B] flex-shrink-0" />
                <p className="text-xs font-medium text-white truncate">
                  {friendStandbyInfo.friendName} sedang Standby (Menunggu lagu diputar)
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-row items-center sm:items-end gap-4 sm:gap-5 z-10">
            <div className="w-20 h-20 sm:w-36 sm:h-36 rounded-xl shadow-xl overflow-hidden bg-[#0B0C0E] border border-white/10 flex-shrink-0">
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
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#BFE7EA]">
                {isFriend ? 'Friend Live' : 'Album'}
              </span>
              <h1 className="text-xl sm:text-4xl font-black text-white tracking-tight leading-tight truncate">
                {albumTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#A0A5AD]">
                <span className="font-semibold text-white truncate">{artistName}</span>
                <span>&bull;</span>
                <span>{releaseYear}</span>
                <span>&bull;</span>
                <span>{tracks.length} Lagu</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Clean Action Bar */}
      <div className="px-4 sm:px-7 py-3 sm:py-3.5 flex items-center gap-3.5 sm:gap-4 z-20 flex-shrink-0 bg-[#121212]">
        <button
          onClick={handleMasterPlayToggle}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1DB954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-lg transition-all cursor-pointer flex-shrink-0"
          title={isStagePlaying ? 'Jeda Musik' : 'Putar Semua'}
        >
          {isStagePlaying ? (
            <Pause className="w-5 h-5 fill-black stroke-black" />
          ) : (
            <Play className="w-5 h-5 fill-black stroke-black translate-x-0.5" />
          )}
        </button>

        {onToggleShuffle && (
          <button
            onClick={onToggleShuffle}
            className={`p-2 transition-colors ${
              isShuffle ? 'text-[#1DB954]' : 'text-[#B3B3B3] hover:text-white'
            }`}
            title={isShuffle ? 'Acak Aktif' : 'Acak Pemutaran'}
          >
            <Shuffle className="w-5 h-5" />
          </button>
        )}

        {isArtistView && (
          <button
            onClick={() => setIsFollowing((v) => !v)}
            className={`px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              isFollowing
                ? 'border-[#1DB954] text-[#1DB954] bg-[#1DB954]/10'
                : 'border-[#555] hover:border-white text-white'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}

        {isFavorites && onOpenEditModal && (
          <button
            onClick={onOpenEditModal}
            className="px-3.5 py-1.5 rounded-full border border-[#555] hover:border-white text-white flex items-center gap-1.5 text-xs font-semibold transition-all"
            title="Edit rincian playlist"
          >
            <Pencil className="w-3.5 h-3.5 text-[#BFE7EA]" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {/* 3. Clean Tracklist Table */}
      <div className="px-2.5 sm:px-7 pb-6 sm:pb-8 flex-1 flex flex-col bg-[#121212]">
        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mb-2 px-2">
          {isArtistView ? 'Populer' : 'Daftar Lagu'}
        </h2>

        {isFavorites && tracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-[#A0A5AD]">
            <Heart className="w-8 h-8 text-[#FF4B72] mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Belum Ada Lagu Favorit</h3>
            <p className="text-xs text-[#656A74] max-w-xs">
              Klik ikon hati pada lagu apa saja untuk menyimpannya di sini.
            </p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-[#A0A5AD]">
            <p className="text-xs text-[#656A74]">Memuat lagu...</p>
          </div>
        ) : (
          <div className="space-y-0.5">
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
                  className={`grid grid-cols-[24px_1fr_auto_auto] md:grid-cols-[32px_5fr_3fr_36px_auto] gap-2.5 sm:gap-4 px-2 sm:px-3 py-2 rounded-lg text-sm items-center cursor-pointer transition-colors group ${
                    isActive
                      ? 'bg-[#2A2A2A]/75 text-[#1DB954]'
                      : 'hover:bg-[#2A2A2A]/35 text-[#B3B3B3]'
                  }`}
                >
                  <div className="w-6 sm:w-7 h-7 flex items-center justify-center flex-shrink-0">
                    {isActive ? (
                      isPlaying ? (
                        isHovered ? (
                          <Pause className="w-4 h-4 text-[#1DB954] fill-[#1DB954]" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-[#1DB954] animate-pulse" />
                        )
                      ) : (
                        <Play className="w-4 h-4 text-[#1DB954] fill-[#1DB954] translate-x-0.5" />
                      )
                    ) : isHovered ? (
                      <Play className="w-4 h-4 text-white fill-white translate-x-0.5" />
                    ) : (
                      <span className="text-xs text-[#8C929C]">{index + 1}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-[#181818]">
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
                        className={`font-medium truncate text-sm leading-tight ${
                          isActive ? 'text-[#1DB954] font-semibold' : 'text-white'
                        }`}
                      >
                        {t.title}
                      </span>
                      <span className="text-xs text-[#9E9E9E] truncate pt-0.5">
                        {t.artist}
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:block text-xs font-mono text-[#8C929C] truncate text-right md:text-left">
                    {streamsFormatted}
                  </div>

                  <div className="flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLikeTrack?.(t);
                      }}
                      className={`p-1.5 rounded-full transition-colors ${
                        isLiked
                          ? 'text-[#FF4B72]'
                          : 'text-[#656A74] md:opacity-0 md:group-hover:opacity-100 hover:text-white'
                      }`}
                      title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#FF4B72]' : ''}`} />
                    </button>
                  </div>

                  <div className="text-right text-xs font-mono text-[#8C929C] pr-1">
                    {formatDuration(t.durationMs)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
