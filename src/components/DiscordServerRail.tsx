/**
 * DiscordServerRail Component (Leftmost Discord Server Navigation Bar)
 * Deep obsidian dark surfaces with vibrant Ice Blue (#BFE7EA) active indicators:
 * - Kasatune Home Server Pill
 * - Official Radiohead Album Icons with Squircle Morphing on hover/active
 * - Discord Pill Indicator in Ice Blue (#BFE7EA)
 * - Discord Floating Tooltip on hover
 */

import React, { useState } from 'react';
import { Radio, Disc, Sparkles } from 'lucide-react';

export type AlbumFilterType = 'all' | 'Pablo Honey' | 'The Bends' | 'OK Computer';

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
}

const SERVERS: ServerItem[] = [
  {
    id: 'all',
    name: 'Kasatune Discography',
    isHome: true,
  },
  {
    id: 'Pablo Honey',
    name: 'Pablo Honey (1993)',
    year: 1993,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0f/Radiohead.pablohoney.albumart.jpg',
  },
  {
    id: 'The Bends',
    name: 'The Bends (1995)',
    year: 1995,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/5/55/Radioheadthebends.png',
  },
  {
    id: 'OK Computer',
    name: 'OK Computer (1997)',
    year: 1997,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png',
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
    <nav className="w-[72px] h-full bg-[#0B0C0E] border-r border-[#282B32] flex flex-col items-center py-3 gap-2 flex-shrink-0 select-none z-30">
      {SERVERS.map((server, index) => {
        const isActive = activeAlbum === server.id;
        const isHovered = hoveredId === server.id;

        return (
          <React.Fragment key={server.id}>
            {/* Divider after Kasatune Home Icon */}
            {index === 1 && (
              <div className="w-8 h-[2px] bg-[#282B32] rounded-full my-1" />
            )}

            <div
              className="relative flex items-center justify-center w-full group cursor-pointer"
              onMouseEnter={() => setHoveredId(server.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectAlbum(server.id)}
            >
              {/* Discord Pill Indicator (Left Edge) in vibrant Ice Blue */}
              <div
                className={`absolute left-0 w-1 bg-[#BFE7EA] rounded-r-full transition-all duration-200 shadow-[0_0_8px_#BFE7EA] ${
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
                    ? 'rounded-[16px] ring-2 ring-[#BFE7EA] border-transparent shadow-[0_0_14px_rgba(191,231,234,0.45)]'
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
                  <img
                    src={server.imageUrl}
                    alt={server.name}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Disc className="w-5 h-5 text-[#A0A5AD]" />
                )}
              </div>

              {/* Discord Floating Tooltip */}
              {isHovered && (
                <div className="absolute left-[80px] bg-[#111215] border border-[#282B32] text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-2xl whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BFE7EA]" />
                  <span>{server.name}</span>
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}

      <div className="w-8 h-[2px] bg-[#282B32] rounded-full my-1" />

      {/* Reconnect / Sync Backend Bubble */}
      <div
        className="relative flex items-center justify-center w-full group cursor-pointer"
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
            {isBackendOnline ? 'Go API Online (Click to Refresh)' : 'Re-check Go Backend'}
          </div>
        )}
      </div>
    </nav>
  );
};
