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
import { Music2, Disc, Sparkles } from 'lucide-react';

export type AlbumFilterType =
  | 'friend'
  | 'all'
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
  | 'RUNW';

interface DiscordServerRailProps {
  activeAlbum: AlbumFilterType;
  onSelectAlbum: (album: AlbumFilterType) => void;
  onRefreshBackend: () => void;
  isBackendOnline: boolean;
}

interface ServerItem {
  id: AlbumFilterType;
  name: string;
  year?: number;
  imageUrl?: string;
  isHome?: boolean;
  isSpotify?: boolean;
  categoryDivider?: string;
}

const SERVERS: ServerItem[] = [
  // 1. Friend Spotify Live
  {
    id: 'friend',
    name: "Teman (Spotify Live Sync)",
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/0a/a7/9f/0aa79f8a-101c-f475-c158-66e56d4a378a/JK_ZMCZ-15801.jpg/600x600bb.jpg',
    isSpotify: true,
  },

  // 2. All Songs Master
  {
    id: 'all',
    name: 'Semua Koleksi (All Songs)',
    isHome: true,
  },

  // 3. Radiohead Complete & 9 Studio Albums
  {
    id: 'radiohead',
    name: 'Radiohead (Semua Album)',
    imageUrl: '/covers/radiohead.jpg',
  },
  {
    id: 'Pablo Honey',
    name: 'Radiohead - Pablo Honey (1993)',
    year: 1993,
    imageUrl: '/covers/pablo_honey.jpg',
  },
  {
    id: 'The Bends',
    name: 'Radiohead - The Bends (1995)',
    year: 1995,
    imageUrl: '/covers/the_bends.jpg',
  },
  {
    id: 'OK Computer',
    name: 'Radiohead - OK Computer (1997)',
    year: 1997,
    imageUrl: '/covers/ok_computer.jpg',
  },
  {
    id: 'Kid A',
    name: 'Radiohead - Kid A (2000)',
    year: 2000,
    imageUrl: '/covers/kid_a.jpg',
  },
  {
    id: 'Amnesiac',
    name: 'Radiohead - Amnesiac (2001)',
    year: 2001,
    imageUrl: '/covers/amnesiac.jpg',
  },
  {
    id: 'Hail to the Thief',
    name: 'Radiohead - Hail to the Thief (2003)',
    year: 2003,
    imageUrl: '/covers/hail_to_the_thief.jpg',
  },
  {
    id: 'In Rainbows',
    name: 'Radiohead - In Rainbows (2007)',
    year: 2007,
    imageUrl: '/covers/in_rainbows.jpg',
  },
  {
    id: 'The King of Limbs',
    name: 'Radiohead - The King of Limbs (2011)',
    year: 2011,
    imageUrl: '/covers/the_king_of_limbs.jpg',
  },
  {
    id: 'A Moon Shaped Pool',
    name: 'Radiohead - A Moon Shaped Pool (2016)',
    year: 2016,
    imageUrl: '/covers/a_moon_shaped_pool.jpg',
  },

  // 4. New Requested Artists
  {
    id: 'jkt48',
    name: 'JKT48',
    imageUrl: '/covers/jkt48.jpg',
  },
  {
    id: 'leserafim',
    name: 'LE SSERAFIM',
    imageUrl: '/covers/leserafim.jpg',
  },
  {
    id: 'twice',
    name: 'TWICE',
    imageUrl: '/covers/twice.jpg',
  },
  {
    id: 'aespa',
    name: 'aespa',
    imageUrl: '/covers/aespa.jpg',
  },
  {
    id: 'h2h',
    name: 'Hearts2Hearts (H2H)',
    imageUrl: '/covers/h2h.jpg',
  },
  {
    id: 'RUNW',
    name: 'RUNW (Runway Hits)',
    imageUrl: '/covers/runw.jpg',
  },
];

export const DiscordServerRail: React.FC<DiscordServerRailProps> = ({
  activeAlbum,
  onSelectAlbum,
  onRefreshBackend,
  isBackendOnline,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <nav className="w-[72px] h-full bg-[#0B0C0E] border-r border-[#282B32] flex flex-col items-center py-3 gap-2 flex-shrink-0 select-none z-30 overflow-y-auto overflow-x-hidden custom-scrollbar">
      {SERVERS.map((server, index) => {
        const isActive = activeAlbum === server.id;
        const isHovered = hoveredId === server.id;

        return (
          <React.Fragment key={server.id}>
            {/* Divider after Friend Spotify */}
            {index === 1 && (
              <div className="w-8 h-[2px] bg-[#282B32] rounded-md my-1 flex-shrink-0" />
            )}
            {/* Divider after Radiohead Discography (before JKT48) */}
            {index === 12 && (
              <div className="w-8 h-[2px] bg-[#282B32] rounded-md my-1 flex-shrink-0" />
            )}

            <div
              className="relative flex items-center justify-center w-full group cursor-pointer flex-shrink-0"
              onMouseEnter={() => setHoveredId(server.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectAlbum(server.id)}
            >
              {/* Discord Pill Indicator (Left Edge) */}
              <div
                className={`absolute left-0 w-1 ${
                  server.isSpotify
                    ? 'bg-[#1DB954] shadow-[0_0_8px_#1DB954]'
                    : 'bg-[#BFE7EA] shadow-[0_0_8px_#BFE7EA]'
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
                className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 overflow-hidden shadow-md border ${
                  isActive
                    ? server.isSpotify
                      ? 'rounded-[16px] ring-2 ring-[#1DB954] border-transparent shadow-[0_0_14px_rgba(29,185,84,0.6)]'
                      : 'rounded-[16px] ring-2 ring-[#BFE7EA] border-transparent shadow-[0_0_14px_rgba(191,231,234,0.45)]'
                    : isHovered
                    ? 'rounded-[16px] bg-[#1C1E22] border-[#282B32]'
                    : 'rounded-[24px] bg-[#141619] border-[#282B32]/70'
                }`}
              >
                {server.isHome ? (
                  <div className="w-full h-full bg-[#1DB954] flex items-center justify-center text-black">
                    <Music2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                ) : server.imageUrl ? (
                  <>
                    <img
                      src={server.imageUrl}
                      alt={server.name}
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
                      <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#1DB954] border border-[#0B0C0E] shadow-[0_0_6px_#1DB954] z-20" />
                    )}
                  </>
                ) : (
                  <Disc className="w-5 h-5 text-[#A0A5AD]" />
                )}
              </div>

              {/* Discord Floating Tooltip */}
              {isHovered && (
                <div className="absolute left-[80px] bg-[#111215] border border-[#282B32] text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-2xl whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100 flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      server.isSpotify ? 'bg-[#1DB954]' : 'bg-[#BFE7EA]'
                    }`}
                  />
                  <span>{server.name}</span>
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
