/**
 * DiscordServerRail Component (Leftmost Discord Server Navigation Bar)
 * Deep obsidian dark surfaces with vibrant Ice Blue (#BFE7EA) active indicators:
 * - Kasatune Home Server Pill
 * - Official Radiohead 9 Studio Albums + New Artists (JKT48, LE SSERAFIM, TWICE, aespa, H2H, RUNW)
 * - Discord Pill Indicator in Ice Blue (#BFE7EA) / Spotify Green
 * - Discord Floating Tooltip on hover
 * - Smooth overflow-y scrolling for all servers
 */

import React, { useState } from 'react';
import { Music2, Disc, Sparkles, Heart } from 'lucide-react';
import { KasatuneLogoIcon } from './KasatuneLogo';
import type { CustomPlaylistData } from '../hooks/useCustomPlaylist';

export type AlbumFilterType =
  | 'friend'
  | 'all'
  | 'favorites'
  | 'radiohead'
  | 'Pablo Honey'
  | 'The Bends'
  | 'OK Computer'
  | 'Kid A'
  | 'Amnesiac'
  | 'Hail to the Thief'
  | 'In Rainbows'
  | 'The King of Limbs'
  | 'A Moon Shaped Pool'
  | 'jkt48'
  | 'leserafim'
  | 'twice'
  | 'aespa'
  | 'h2h'
  | 'RUNW'
  | 'riskiinrahim'
  | 'vander'
  | 'playboicarti'
  | 'drake'
  | 'brunomars'
  | 'akumanoko';

interface DiscordServerRailProps {
  activeAlbum: AlbumFilterType;
  onSelectAlbum: (album: AlbumFilterType) => void;
  onRefreshBackend: () => void;
  isBackendOnline: boolean;
  customPlaylist?: CustomPlaylistData;
  likedCount?: number;
}

interface ServerItem {
  id: AlbumFilterType;
  name: string;
  albumTitle?: string;
  artistName?: string;
  year?: number;
  imageUrl?: string;
  isHome?: boolean;
  isSpotify?: boolean;
  isFavorites?: boolean;
  categoryDivider?: string;
}

const SERVERS: ServerItem[] = [
  // 1. Friend Spotify Live
  {
    id: 'friend',
    name: "Teman (Spotify Live Sync)",
    albumTitle: "Spotify Real-Time Friend Activity",
    artistName: "Spotify Live Presence",
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/0a/a7/9f/0aa79f8a-101c-f475-c158-66e56d4a378a/JK_ZMCZ-15801.jpg/600x600bb.jpg',
    isSpotify: true,
  },

  // 2. All Songs Master
  {
    id: 'all',
    name: 'Semua Koleksi (All Songs)',
    albumTitle: 'Semua Album & Lagu (250+ Tracks)',
    artistName: 'Koleksi Kasatune',
    isHome: true,
  },

  // 3. Custom Playlist / Liked Songs
  {
    id: 'favorites',
    name: 'Playlist Favorit Saya',
    albumTitle: 'Lagu Favorit & Koleksi Kustom',
    artistName: 'Playlist Saya',
    isFavorites: true,
  },

  // 3. Radiohead Complete & 9 Studio Albums
  {
    id: 'radiohead',
    name: 'Radiohead (Semua Album)',
    albumTitle: 'Diskografi Lengkap (9 Studio Albums)',
    artistName: 'Radiohead',
    imageUrl: '/covers/radiohead.jpg',
  },
  {
    id: 'Pablo Honey',
    name: 'Radiohead - Pablo Honey',
    albumTitle: 'Pablo Honey',
    artistName: 'Radiohead',
    year: 1993,
    imageUrl: '/covers/pablo_honey.jpg',
  },
  {
    id: 'The Bends',
    name: 'Radiohead - The Bends',
    albumTitle: 'The Bends',
    artistName: 'Radiohead',
    year: 1995,
    imageUrl: '/covers/the_bends.jpg',
  },
  {
    id: 'OK Computer',
    name: 'Radiohead - OK Computer',
    albumTitle: 'OK Computer',
    artistName: 'Radiohead',
    year: 1997,
    imageUrl: '/covers/ok_computer.jpg',
  },
  {
    id: 'Kid A',
    name: 'Radiohead - Kid A',
    albumTitle: 'Kid A',
    artistName: 'Radiohead',
    year: 2000,
    imageUrl: '/covers/kid_a.jpg',
  },
  {
    id: 'Amnesiac',
    name: 'Radiohead - Amnesiac',
    albumTitle: 'Amnesiac',
    artistName: 'Radiohead',
    year: 2001,
    imageUrl: '/covers/amnesiac.jpg',
  },
  {
    id: 'Hail to the Thief',
    name: 'Radiohead - Hail to the Thief',
    albumTitle: 'Hail to the Thief',
    artistName: 'Radiohead',
    year: 2003,
    imageUrl: '/covers/hail_to_the_thief.jpg',
  },
  {
    id: 'In Rainbows',
    name: 'Radiohead - In Rainbows',
    albumTitle: 'In Rainbows',
    artistName: 'Radiohead',
    year: 2007,
    imageUrl: '/covers/in_rainbows.jpg',
  },
  {
    id: 'The King of Limbs',
    name: 'Radiohead - The King of Limbs',
    albumTitle: 'The King of Limbs',
    artistName: 'Radiohead',
    year: 2011,
    imageUrl: '/covers/the_king_of_limbs.jpg',
  },
  {
    id: 'A Moon Shaped Pool',
    name: 'Radiohead - A Moon Shaped Pool',
    albumTitle: 'A Moon Shaped Pool',
    artistName: 'Radiohead',
    year: 2016,
    imageUrl: '/covers/a_moon_shaped_pool.jpg',
  },

  // 4. Requested Artists
  {
    id: 'jkt48',
    name: 'JKT48',
    albumTitle: 'Mahagita, Heavy Rotation & Special Singles',
    artistName: 'JKT48',
    imageUrl: '/covers/jkt48.jpg',
  },
  {
    id: 'leserafim',
    name: 'LE SSERAFIM',
    albumTitle: 'UNFORGIVEN, ANTIFRAGILE & FEARLESS',
    artistName: 'LE SSERAFIM',
    imageUrl: '/covers/leserafim.jpg',
  },
  {
    id: 'twice',
    name: 'TWICE',
    albumTitle: 'Formula of Love, Eyes wide open, Feel Special & FANCY YOU',
    artistName: 'TWICE',
    year: 2021,
    imageUrl: '/covers/twice.jpg',
  },
  {
    id: 'aespa',
    name: 'aespa',
    albumTitle: 'MY WORLD, Savage, Drama & Girls',
    artistName: 'aespa',
    imageUrl: '/covers/aespa.jpg',
  },
  {
    id: 'h2h',
    name: 'Hearts2Hearts (H2H)',
    albumTitle: 'Original Singles & Collaborations',
    artistName: 'Hearts2Hearts',
    imageUrl: '/covers/h2h.jpg',
  },
  {
    id: 'RUNW',
    name: 'RUNW (Runway Hits)',
    albumTitle: 'Runway Electronic & House Essentials',
    artistName: 'Various Artists',
    imageUrl: '/covers/runw.jpg',
  },

  // 5. Hip-Hop, Pop & Anime Spotlight
  {
    id: 'riskiinrahim',
    name: 'Riski Inrahim',
    albumTitle: 'Sdr Kematian (Saudara Kematian)',
    artistName: 'Riski Inrahim',
    year: 2025,
    imageUrl: '/covers/riskiinrahim.jpg',
  },
  {
    id: 'vander',
    name: 'vander! / vender!',
    albumTitle: 'KING MOKONDO, Bencana Alam & Vandereism',
    artistName: 'Vander (vandereism)',
    year: 2025,
    imageUrl: '/covers/vander.jpg',
  },
  {
    id: 'playboicarti',
    name: 'Playboi Carti',
    albumTitle: 'Whole Lotta Red & Die Lit',
    artistName: 'Playboi Carti',
    year: 2020,
    imageUrl: '/covers/playboicarti.jpg',
  },
  {
    id: 'drake',
    name: 'Drake',
    albumTitle: 'Scorpion, Views & Certified Lover Boy',
    artistName: 'Drake',
    year: 2018,
    imageUrl: '/covers/drake.jpg',
  },
  {
    id: 'brunomars',
    name: 'Bruno Mars',
    albumTitle: '24K Magic, Unorthodox Jukebox & Doo-Wops',
    artistName: 'Bruno Mars',
    year: 2016,
    imageUrl: '/covers/brunomars.jpg',
  },
  {
    id: 'akumanoko',
    name: 'Ai Higuchi',
    albumTitle: '悪魔の子 (Akuma no Ko) / 最悪最愛 (Saiaku Saiai)',
    artistName: 'Ai Higuchi (Higuchi Ai)',
    year: 2022,
    imageUrl: '/covers/akumanoko.jpg',
  },
];

export const DiscordServerRail: React.FC<DiscordServerRailProps> = ({
  activeAlbum,
  onSelectAlbum,
  onRefreshBackend,
  isBackendOnline,
  customPlaylist,
  likedCount = 0,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const playlistName = customPlaylist?.name || 'Playlist Favorit Saya';
  const playlistCover = customPlaylist?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

  return (
    <nav className="w-[72px] h-full bg-[#0B0C0E] border-r border-[#282B32] flex flex-col items-center py-3 gap-2 flex-shrink-0 select-none z-30 overflow-y-auto overflow-x-hidden custom-scrollbar">
      {SERVERS.map((server, index) => {
        const isActive = activeAlbum === server.id;
        const isHovered = hoveredId === server.id;
        const displayName = server.isFavorites ? playlistName : server.name;

        return (
          <React.Fragment key={server.id}>
            {/* Divider after Friend Spotify */}
            {index === 0 && (
              <div className="w-8 h-[2px] bg-[#282B32] rounded-md my-1 flex-shrink-0" />
            )}
            {/* Divider after Favorites Playlist */}
            {index === 2 && (
              <div className="w-8 h-[2px] bg-[#282B32] rounded-md my-1 flex-shrink-0" />
            )}
            {/* Divider after Radiohead Discography (before JKT48) */}
            {index === 12 && (
              <div className="w-8 h-[2px] bg-[#282B32] rounded-md my-1 flex-shrink-0" />
            )}
            {/* Divider after J-Pop/K-Pop (before Hip-Hop, Pop & Anime Spotlight) */}
            {index === 18 && (
              <div className="w-8 h-[2px] bg-[#282B32] rounded-md my-1 flex-shrink-0" />
            )}

            <div
              className="relative flex items-center justify-center w-full group cursor-pointer flex-shrink-0"
              onMouseEnter={() => setHoveredId(server.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectAlbum(server.id)}
              title={
                server.isFavorites
                  ? `${playlistName} • ${likedCount} lagu favorit tersimpan`
                  : server.albumTitle
                  ? `${server.name} • Album: ${server.albumTitle}${server.year ? ` (${server.year})` : ''}`
                  : server.name
              }
            >
              {/* Discord Pill Indicator (Left Edge) */}
              <div
                className={`absolute left-0 w-1 ${
                  server.isSpotify
                    ? 'bg-[#1DB954]'
                    : server.isFavorites
                    ? 'bg-[#FF4B72]'
                    : 'bg-[#BFE7EA]'
                } rounded-r-md transition-all duration-200 ${
                  isActive
                    ? 'h-10 opacity-100'
                    : isHovered
                    ? 'h-5 opacity-80'
                    : 'h-0 opacity-0'
                }`}
              />

              {/* Server Squircle Icon */}
              <div
                className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 overflow-hidden border ${
                  isActive
                    ? server.isSpotify
                      ? 'rounded-[16px] ring-2 ring-[#1DB954] border-transparent'
                      : server.isFavorites
                      ? 'rounded-[16px] ring-2 ring-[#FF4B72] border-transparent'
                      : 'rounded-[16px] ring-2 ring-[#BFE7EA] border-transparent'
                    : isHovered
                    ? 'rounded-[16px] bg-[#1C1E22] border-[#282B32]'
                    : 'rounded-[24px] bg-[#141619] border-[#282B32]/70'
                }`}
              >
                {server.isHome ? (
                  <div className="w-full h-full bg-[#12141A] flex items-center justify-center p-1.5 group">
                    <KasatuneLogoIcon size={32} className="transform group-hover:scale-110" />
                  </div>
                ) : server.isFavorites ? (
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FF4B72]/20 via-[#141619] to-[#1DB954]/20 group">
                    <img
                      src={playlistCover}
                      alt={playlistName}
                      loading="eager"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                      className="w-full h-full object-cover relative z-10"
                    />
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                      <Heart className="w-5 h-5 text-white fill-[#FF4B72] drop-shadow-md" />
                    </div>
                    {likedCount > 0 && (
                      <span className="absolute bottom-1 right-1 z-30 px-1 py-0.5 text-[9px] font-black rounded bg-[#FF4B72] text-white shadow-md font-mono leading-none">
                        {likedCount > 99 ? '99+' : likedCount}
                      </span>
                    )}
                  </div>
                ) : server.imageUrl ? (
                  <>
                    <img
                      src={server.imageUrl}
                      alt=""
                      loading="eager"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                      className="w-full h-full object-cover relative z-10"
                    />
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white/90 uppercase select-none pointer-events-none bg-[#1C1E22]">
                      {server.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3)}
                    </div>
                    {server.isSpotify && (
                      <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#1DB954] border border-[#0B0C0E] z-20" />
                    )}
                  </>
                ) : (
                  <Disc className="w-5 h-5 text-[#A0A5AD]" />
                )}
              </div>

              {/* Discord Floating Tooltip (Menampilkan Nama & Info Album) */}
              {isHovered && (
                <div className="absolute left-[80px] bg-[#111215] border border-[#282B32] text-white text-xs px-3 py-2 rounded-lg shadow-2xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 min-w-[160px] max-w-[280px]">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        server.isSpotify
                          ? 'bg-[#1DB954]'
                          : server.isFavorites
                          ? 'bg-[#FF4B72]'
                          : 'bg-[#BFE7EA]'
                      }`}
                    />
                    <span className="truncate">{displayName}</span>
                  </div>
                  {server.isFavorites ? (
                    <div className="text-[11px] text-[#A0A5AD] font-medium leading-tight mt-0.5">
                      <span className="text-[#FF4B72] font-semibold">{likedCount} lagu</span> tersimpan di playlist ini
                    </div>
                  ) : server.albumTitle ? (
                    <div className="text-[11px] text-[#A0A5AD] font-medium leading-tight mt-0.5">
                      <span className="text-[#BFE7EA] font-semibold">Album:</span> {server.albumTitle}
                      {server.year ? ` (${server.year})` : ''}
                    </div>
                  ) : null}
                  {server.artistName && (
                    <div className="text-[10px] text-[#71757E]">
                      Artis: {server.artistName}
                    </div>
                  )}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}

      <div className="w-8 h-[2px] bg-[#282B32] rounded-md my-1 flex-shrink-0" />

      {/* Reconnect / Sync Backend Bubble */}
      <div
        className="relative flex items-center justify-center w-full group cursor-pointer flex-shrink-0"
        onMouseEnter={() => setHoveredId('sync')}
        onMouseLeave={() => setHoveredId(null)}
        onClick={onRefreshBackend}
      >
        <div
          className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] bg-[#141619] group-hover:bg-[#1C1E22] text-[#BFE7EA] flex items-center justify-center transition-all duration-200 shadow-md border ${
            isBackendOnline ? 'border-[#282B32]' : 'border-[#FEE75C] text-[#FEE75C]'
          }`}
        >
          <Sparkles className="w-5 h-5" />
        </div>

        {hoveredId === 'sync' && (
          <div className="absolute left-[80px] bg-[#111215] border border-[#282B32] text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-2xl whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
            {isBackendOnline ? 'Go API Online (238 Tracks)' : 'Re-check Go Backend'}
          </div>
        )}
      </div>
    </nav>
  );
};
