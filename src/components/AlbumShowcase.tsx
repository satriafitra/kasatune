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
  MoreHorizontal,
  Clock,
  Volume2,
  Pencil,
  Shuffle,
  Check,
  Disc,
} from 'lucide-react';
import type { BackendRadioheadTrack } from '../api/backend';
import type { AlbumColors } from '../hooks/useAlbumColor';
import type { AlbumFilterType } from './DiscordServerRail';
import type { CustomPlaylistData } from '../hooks/useCustomPlaylist';
import type { PinnedServerItem } from './AddAlbumModal';

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
  albumEntity?: PinnedServerItem | null;
  customPlaylist?: CustomPlaylistData;
  onOpenEditModal?: () => void;
  isLikedTrack?: (trackId: string) => boolean;
  onToggleLikeTrack?: (track: BackendRadioheadTrack) => void;
  onToggleShuffle?: () => void;
  isShuffle?: boolean;
}

// Generate realistic Spotify stream counts based on track string and ranking index
const getRealisticStreams = (id: string, title: string, index: number): string => {
  let hash = 0;
  const str = id + title;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const base = Math.abs(hash) % 750000000;
  const multiplier = Math.max(1, 12 - index);
  const streams = multiplier * 140000000 + base + 42000000;
  return streams.toLocaleString('en-US');
};

// Known monthly listener statistics
const getMonthlyListeners = (name: string, tracksCount: number): string => {
  const lower = name.toLowerCase();
  if (lower.includes('playboi') || lower.includes('carti')) return '40.5M monthly listeners';
  if (lower.includes('sheila')) return '4.8M monthly listeners';
  if (lower.includes('radiohead')) return '28.3M monthly listeners';
  if (lower.includes('drake')) return '78.4M monthly listeners';
  if (lower.includes('bruno mars')) return '115.2M monthly listeners';
  if (lower.includes('jkt48')) return '2.1M monthly listeners';
  if (lower.includes('serafim')) return '14.2M monthly listeners';
  if (lower.includes('twice')) return '12.8M monthly listeners';
  if (lower.includes('aespa')) return '15.6M monthly listeners';
  if (lower.includes('higuchi') || lower.includes('akuma')) return '3.7M monthly listeners';
  if (lower.includes('vander')) return '1.2M monthly listeners';

  const count = Math.max(1, tracksCount);
  const est = (count * 1.8 + 5.2).toFixed(1);
  return `${est}M monthly listeners`;
};

export const AlbumShowcase: React.FC<AlbumShowcaseProps> = ({
  track,
  tracks,
  activeTrackId,
  colors,
  isPlaying,
  onTogglePlay,
  onSelectTrack,
  friendStandbyInfo,
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

  // Determine if this is an ARTIST showcase (Playboi Carti, Sheila On 7, Radiohead, Drake, etc.)
  const isArtistView =
    !isFavorites &&
    !isFriend &&
    (albumEntity?.type === 'artist' ||
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
    albumEntity?.imageUrl ||
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

  // Check if active track belongs to current tracklist
  const isCurrentTrackInView = tracks.some((t) => t.id === activeTrackId);
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
    <div className="w-full h-full bg-[#121212] rounded-lg border border-[#282B32] flex flex-col overflow-y-auto select-none relative custom-scrollbar shadow-2xl">
      {/* 1. Header Section */}
      {isArtistView ? (
        /* ================= SPOTIFY ARTIST VIEW (Exact match to user screenshot) ================= */
        <div className="relative w-full min-h-[260px] sm:min-h-[320px] md:min-h-[360px] flex flex-col justify-end p-6 sm:p-8 overflow-hidden flex-shrink-0">
          {/* Artist Backdrop Photo with Spotify Gradient Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={coverImage}
              alt={artistName}
              className="w-full h-full object-cover object-center filter brightness-[0.75] contrast-[1.05]"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            {/* Dark atmospheric Spotify gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-black/30" />
            <div
              className="absolute inset-0 opacity-40 mix-blend-multiply"
              style={{
                background: `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.2) 0%, rgba(18, 18, 18, 0.95) 100%)`,
              }}
            />
          </div>

          {/* Artist Info Content */}
          <div className="relative z-10 flex flex-col gap-2 max-w-4xl">
            {/* Verified by Spotify Badge */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-white drop-shadow-md">
              <span className="w-4 h-4 rounded-full bg-[#3D91F4] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <Check className="w-2.5 h-2.5 stroke-[3.5]" />
              </span>
              <span className="tracking-wide">Verified by Spotify</span>
            </div>

            {/* Giant Artist Name */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none drop-shadow-lg select-text">
              {artistName}
            </h1>

            {/* Monthly Listeners & Track Count */}
            <p className="text-xs sm:text-sm md:text-base font-semibold text-white/90 drop-shadow mt-1">
              {monthlyListeners} &bull; {tracks.length} Lagu Tersedia
            </p>
          </div>
        </div>
      ) : isFavorites ? (
        /* ================= SPOTIFY PLAYLIST VIEW (KASONGS) ================= */
        <div
          className="w-full p-6 sm:p-8 flex flex-col justify-end relative overflow-hidden flex-shrink-0 border-b border-[#282B32]/60"
          style={{
            background: `linear-gradient(180deg, rgba(255, 75, 114, 0.4) 0%, rgba(20, 22, 25, 0.95) 85%, #121212 100%)`,
          }}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 z-10">
            {/* Playlist Cover */}
            <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.8)] overflow-hidden bg-[#0B0C0E] border border-white/10 flex-shrink-0">
              <img
                src={
                  customPlaylist?.coverUrl ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
                }
                alt={customPlaylist?.name || 'KASONGS'}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Meta */}
            <div className="flex flex-col gap-2 text-center sm:text-left min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-white bg-[#FF4B72] px-2.5 py-0.5 rounded shadow-sm w-fit mx-auto sm:mx-0">
                Kustom &bull; Playlist Saya
              </span>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight truncate">
                {customPlaylist?.name || 'KASONGS'}
              </h1>
              <p className="text-xs sm:text-sm text-[#A0A5AD]">
                {customPlaylist?.description || 'Dibuat oleh Anda'} &bull;{' '}
                <span className="text-white font-bold">{tracks.length} lagu favorit</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ================= SPOTIFY ALBUM VIEW (Vinyl + Official Sleeve) ================= */
        <div
          className="w-full p-6 sm:p-8 flex flex-col justify-end relative overflow-hidden flex-shrink-0 border-b border-[#282B32]/60"
          style={{
            background: `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.35) 0%, rgba(18, 18, 18, 0.95) 85%, #121212 100%)`,
          }}
        >
          {/* Friend Standby Banner ONLY when connected and viewing friend */}
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
            {/* Vinyl Peeking Record + Album Sleeve */}
            <div className="relative flex items-center flex-shrink-0 group">
              {/* Peeking Vinyl Record */}
              <div
                className={`absolute top-2 left-6 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#090A0C] border-4 border-[#141619] shadow-[0_12px_36px_rgba(0,0,0,0.85)] flex items-center justify-center transition-transform duration-700 pointer-events-none z-0 ${
                  isStagePlaying
                    ? 'translate-x-12 sm:translate-x-16 animate-spin-slow'
                    : 'translate-x-6'
                }`}
              >
                <div className="w-28 h-28 sm:w-34 sm:h-34 rounded-full border border-white/5 flex items-center justify-center">
                  <div className="w-20 h-20 sm:w-26 sm:h-26 rounded-full border border-white/5 flex items-center justify-center">
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
                  src={coverImage}
                  alt={albumTitle}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Album Metadata */}
            <div className="flex flex-col gap-1.5 min-w-0 text-center sm:text-left z-10 pl-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0B0C0E] bg-[#BFE7EA] px-2 py-0.5 rounded shadow-sm w-fit mx-auto sm:mx-0">
                ALBUM RESMI
              </span>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight truncate">
                {albumTitle}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#A0A5AD] pt-1">
                <span className="font-extrabold text-white">{artistName}</span>
                <span>&bull;</span>
                <span>{releaseYear}</span>
                <span>&bull;</span>
                <span>{tracks.length} Lagu</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Spotify Action Bar (Exact match to Playboi Carti screenshot) */}
      <div className="px-6 sm:px-8 py-4 flex items-center gap-5 z-20 flex-shrink-0 bg-[#121212]">
        {/* Big Green Spotify Play Button (#1DB954) */}
        <button
          onClick={handleMasterPlayToggle}
          className="w-14 h-14 rounded-full bg-[#1DB954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-2xl transition-all cursor-pointer flex-shrink-0"
          title={isStagePlaying ? 'Jeda Musik' : 'Putar Semua'}
        >
          {isStagePlaying ? (
            <Pause className="w-6 h-6 fill-black stroke-black" />
          ) : (
            <Play className="w-6 h-6 fill-black stroke-black translate-x-0.5" />
          )}
        </button>

        {/* Shuffle Button */}
        {onToggleShuffle && (
          <button
            onClick={onToggleShuffle}
            className={`p-2 transition-all hover:scale-110 active:scale-95 ${
              isShuffle ? 'text-[#1DB954]' : 'text-[#B3B3B3] hover:text-white'
            }`}
            title={isShuffle ? 'Acak Aktif' : 'Acak Pemutaran'}
          >
            <Shuffle className="w-5 h-5" />
          </button>
        )}

        {/* Follow / Ikuti Pill Button (as shown in screenshot) */}
        {isArtistView && (
          <button
            onClick={() => setIsFollowing((v) => !v)}
            className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 ${
              isFollowing
                ? 'border-[#1DB954] text-[#1DB954] bg-[#1DB954]/10'
                : 'border-[#727272] hover:border-white text-white'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}

        {/* Edit Rincian for Custom Playlist */}
        {isFavorites && onOpenEditModal && (
          <button
            onClick={onOpenEditModal}
            className="px-4 py-1.5 rounded-full border border-[#727272] hover:border-white text-white flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:scale-105 transition-all"
            title="Kustomisasi nama dan sampul playlist"
          >
            <Pencil className="w-3.5 h-3.5 text-[#BFE7EA]" />
            <span>Edit Rincian</span>
          </button>
        )}

        {/* Three dots (...) more menu */}
        <button
          className="p-2 text-[#B3B3B3] hover:text-white hover:scale-110 transition-all ml-auto sm:ml-0"
          title="Opsi Lainnya"
        >
          <MoreHorizontal className="w-6 h-6" />
        </button>

        {/* Now Playing Mini-Badge indicator when a track is playing in this album */}
        {isStagePlaying && track && (
          <div className="hidden sm:flex items-center gap-2 ml-auto px-3 py-1 rounded-full bg-[#181818] border border-[#282828] text-xs">
            <Volume2 className="w-3.5 h-3.5 text-[#1DB954] animate-pulse flex-shrink-0" />
            <span className="text-[#A0A5AD] truncate">Memutar:</span>
            <span className="text-white font-bold truncate max-w-[160px]">
              {track.title}
            </span>
          </div>
        )}
      </div>

      {/* 3. Authentic Spotify Tracklist Table */}
      <div className="px-4 sm:px-8 pb-10 flex-1 flex flex-col bg-[#121212]">
        {/* Section Heading: "Popular" (for artists) or "Daftar Lagu" */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
          {isArtistView ? 'Popular' : 'Daftar Lagu'}
        </h2>

        {/* Empty State for Favorites */}
        {isFavorites && tracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-[#A0A5AD]">
            <div className="w-16 h-16 rounded-full bg-[#181818] border border-[#282B32] flex items-center justify-center mb-4 text-[#FF4B72]">
              <Heart className="w-8 h-8 fill-current" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Belum Ada Lagu Favorit
            </h3>
            <p className="text-xs text-[#656A74] max-w-sm mb-4 leading-relaxed">
              Klik ikon hati pada lagu apa saja untuk menyimpannya otomatis ke playlist ini.
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
            {/* Table Rows (Matching Spotify layout with streams count) */}
            <div className="space-y-0.5">
              {tracks.map((t, index) => {
                const isActive = t.id === activeTrackId;
                const isHovered = hoveredTrackId === t.id;
                const isLiked = isLikedTrack ? isLikedTrack(t.id) : false;
                const streamsFormatted = getRealisticStreams(t.id, t.title, index);

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
                    className={`grid grid-cols-[28px_1fr_auto] md:grid-cols-[32px_5fr_3fr_36px_auto] gap-3 sm:gap-4 px-3 py-2 rounded-md text-sm items-center cursor-pointer transition-colors group ${
                      isActive
                        ? 'bg-[#2A2A2A]/80 text-[#1DB954]'
                        : 'hover:bg-[#2A2A2A]/40 text-[#B3B3B3]'
                    }`}
                  >
                    {/* Index / Play / Volume Equalizer */}
                    <div
                      className="w-7 h-7 flex items-center justify-center flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isActive) {
                          onTogglePlay();
                        } else {
                          onSelectTrack(t);
                        }
                      }}
                    >
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
                        <span className="text-xs font-semibold text-[#A0A5AD]">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Thumbnail + Title + Subtitle */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded overflow-hidden flex-shrink-0 bg-[#181818] shadow relative">
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
                          className={`font-semibold truncate text-sm leading-tight flex items-center gap-1.5 ${
                            isActive ? 'text-[#1DB954] font-bold' : 'text-white'
                          }`}
                        >
                          <span className="truncate">{t.title}</span>
                          {/* Explicit badge for hip-hop / rap tracks */}
                          {(t.title.toLowerCase().includes('vamp') ||
                            t.artist.toLowerCase().includes('carti') ||
                            t.artist.toLowerCase().includes('drake') ||
                            t.category === 'playboicarti') && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#727272]/50 text-white flex-shrink-0 font-bold">
                              E
                            </span>
                          )}
                          {t.category === 'online' && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 flex-shrink-0">
                              LIVE
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-[#B3B3B3] hover:text-white cursor-pointer truncate pt-0.5">
                          {t.artist}
                        </span>
                      </div>
                    </div>

                    {/* Stream Count (Authentic Spotify column as in user screenshot) */}
                    <div className="hidden md:block text-xs font-mono text-[#A0A5AD] truncate text-right md:text-left">
                      {streamsFormatted}
                    </div>

                    {/* Heart Like Button */}
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
                          className={`w-4 h-4 ${isLiked ? 'fill-[#FF4B72]' : ''}`}
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
