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
import { Radio, Disc, Sparkles } from 'lucide-react';

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
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/07/60/ba/0760ba0f-148c-b18f-d0ff-169ee96f3af5/634904078164.png/600x600bb.jpg',
  },
  {
    id: 'Pablo Honey',
    name: 'Radiohead - Pablo Honey (1993)',
    year: 1993,
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/78/a4/ec/78a4ec7b-c6d6-c9c8-441b-660486e56a89/634904077969.png/600x600bb.jpg',
  },
  {
    id: 'The Bends',
    name: 'Radiohead - The Bends (1995)',
    year: 1995,
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/1b/a9/5c/1ba95cac-b245-d386-63fb-6b857aa9dce8/634904078065.png/600x600bb.jpg',
  },
  {
    id: 'OK Computer',
    name: 'Radiohead - OK Computer (1997)',
    year: 1997,
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/07/60/ba/0760ba0f-148c-b18f-d0ff-169ee96f3af5/634904078164.png/600x600bb.jpg',
  },
  {
    id: 'Kid A',
    name: 'Radiohead - Kid A (2000)',
    year: 2000,
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/bd/8e/13/bd8e1358-b367-a689-cb84-cebd0b067dc4/634904078263.png/600x600bb.jpg',
  },
  {
    id: 'Amnesiac',
    name: 'Radiohead - Amnesiac (2001)',
    year: 2001,
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/43/d8/ec/43d8ec17-0e96-dba9-21d9-4cdf9d98f2bf/634904078362.png/600x600bb.jpg',
  },
  {
    id: 'Hail to the Thief',
    name: 'Radiohead - Hail to the Thief (2003)',
    year: 2003,
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/3c/95/1d/3c951d73-f6c6-12dd-34b4-cc95f63e210c/634904078560.png/600x600bb.jpg',
  },
  {
    id: 'In Rainbows',
    name: 'Radiohead - In Rainbows (2007)',
    year: 2007,
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/dd/50/c7/dd50c790-99ac-d3d0-5ab8-e3891fb8fd52/634904032463.png/600x600bb.jpg',
  },
  {
    id: 'The King of Limbs',
    name: 'Radiohead - The King of Limbs (2011)',
    year: 2011,
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/af/b6/7b/afb67b4e-6cf8-10b3-31f1-1389e301166d/634904078768.png/600x600bb.jpg',
  },
  {
    id: 'A Moon Shaped Pool',
    name: 'Radiohead - A Moon Shaped Pool (2016)',
    year: 2016,
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b7/f2/5d/b7f25d91-4320-47c8-146a-6f84d5bc7e78/cover.jpg/600x600bb.jpg',
  },

  // 4. New Requested Artists
  {
    id: 'jkt48',
    name: 'JKT48',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/92/ca/f4/92caf4e4-a9e4-e88d-77dc-428132d5f95d/cover.jpg/600x600bb.jpg',
  },
  {
    id: 'leserafim',
    name: 'LE SSERAFIM',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e5/23/e8/e523e80f-90e6-ee3d-24e0-7ee429d2bf73/196922904664_Cover.jpg/600x600bb.jpg',
  },
  {
    id: 'twice',
    name: 'TWICE',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8e/3c/6f/8e3c6f96-52c6-3023-7fa3-69a4c84705a6/196922998632_Cover.jpg/600x600bb.jpg',
  },
  {
    id: 'aespa',
    name: 'aespa',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/21/df/f2/21dff2f8-b3f8-6536-f00a-b31c5ee9a691/888735957819.png/600x600bb.jpg',
  },
  {
    id: 'h2h',
    name: 'Hearts2Hearts (H2H)',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/55/b2/16/55b2169a-eab0-38e9-8df725f8f2d6/888735954603.png/600x600bb.jpg',
  },
  {
    id: 'RUNW',
    name: 'RUNW (Runway Hits)',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/40/7d/f5/407df595-1203-41db-9e84-9d303b5d43ca/26UMGIM41541.rgb.jpg/600x600bb.jpg',
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
                  <div className="w-full h-full bg-gradient-to-br from-[#E89B5B] to-[#D46743] flex items-center justify-center text-white">
                    <Radio className="w-6 h-6 stroke-[2.5]" />
                  </div>
                ) : server.imageUrl ? (
                  <>
                    <img
                      src={server.imageUrl}
                      alt={server.name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                    {server.isSpotify && (
                      <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#1DB954] border border-[#0B0C0E] shadow-[0_0_6px_#1DB954]" />
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
