/**
 * DiscordServerRail Component (Leftmost Discord Server Navigation Bar)
 * Features:
 * - Kasatune Brand / Home Icon
 * - Custom Playlist / Favorites (KASONGS)
 * - User-Customized Pinned Albums & Artists (Empty by default, managed via [+] button)
 * - [+] Button to open AddAlbumModal catalog
 * - Friend Spotify Presence (Visible only when connected)
 */

import React, { useState } from 'react';
import { Plus, X, Heart, Disc, Radio } from 'lucide-react';
import type { CustomPlaylistData } from '../hooks/useCustomPlaylist';
import { AddAlbumModal, CATALOG_ALBUMS, type PinnedServerItem } from './AddAlbumModal';

export type AlbumFilterType =
  | 'friend'
  | 'all'
  | 'favorites'
  | 'sheilaon7'
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
  | 'akumanoko'
  | string;

interface DiscordServerRailProps {
  activeAlbum: AlbumFilterType;
  onSelectAlbum: (album: AlbumFilterType, serverItem?: PinnedServerItem) => void;
  onRefreshBackend?: () => void;
  isBackendOnline?: boolean;
  customPlaylist?: CustomPlaylistData;
  likedCount?: number;
  isFriendConnected?: boolean;
}

export const DiscordServerRail: React.FC<DiscordServerRailProps> = ({
  activeAlbum,
  onSelectAlbum,
  customPlaylist,
  likedCount = 0,
  isFriendConnected = false,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // User-customized pinned albums list (Empty by default per user request)
  const [pinnedServers, setPinnedServers] = useState<PinnedServerItem[]>(() => {
    try {
      localStorage.removeItem('kasatune_pinned_servers');
      const saved = localStorage.getItem('kasatune_pinned_servers_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => {
            if (typeof item === 'string') {
              const found = CATALOG_ALBUMS.find((c) => c.id === item);
              return (
                found || {
                  id: item,
                  name: item,
                  artist: item,
                  albumTitle: item,
                  imageUrl: '/covers/radiohead.jpg',
                }
              );
            }
            return item;
          });
        }
      }
    } catch {}
    return []; // Empty by default
  });

  const handleTogglePin = (server: PinnedServerItem) => {
    setPinnedServers((prev) => {
      const exists = prev.some((s) => s.id === server.id);
      const next = exists ? prev.filter((s) => s.id !== server.id) : [...prev, server];
      try {
        localStorage.setItem('kasatune_pinned_servers_v3', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSelectAndPin = (server: PinnedServerItem) => {
    setPinnedServers((prev) => {
      if (!prev.some((s) => s.id === server.id)) {
        const next = [...prev, server];
        try {
          localStorage.setItem('kasatune_pinned_servers_v3', JSON.stringify(next));
        } catch {}
        return next;
      }
      return prev;
    });
    onSelectAlbum(server.id as AlbumFilterType, server);
    setIsAddModalOpen(false);
  };

  const playlistName = customPlaylist?.name || 'Playlist Favorit Saya';
  const playlistCover =
    customPlaylist?.coverUrl ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

  return (
    <>
      <nav className="w-[72px] h-full bg-[#0B0C0E] border-r border-[#282B32] flex flex-col items-center py-3 gap-2 flex-shrink-0 select-none z-30 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* 1. Friend Spotify Server (ONLY VISIBLE WHEN CONNECTED) */}
        {isFriendConnected && (
          <>
            <div
              className="relative flex items-center justify-center w-full group cursor-pointer flex-shrink-0"
              onMouseEnter={() => setHoveredId('friend')}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectAlbum('friend')}
            >
              <div
                className={`absolute left-0 w-1 bg-[#1DB954] rounded-r-md transition-all duration-200 ${
                  activeAlbum === 'friend'
                    ? 'h-10 opacity-100'
                    : hoveredId === 'friend'
                    ? 'h-5 opacity-80'
                    : 'h-0 opacity-0'
                }`}
              />

              <div
                className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 overflow-hidden border ${
                  activeAlbum === 'friend'
                    ? 'rounded-[16px] ring-2 ring-[#1DB954] border-transparent'
                    : hoveredId === 'friend'
                    ? 'rounded-[16px] bg-[#1C1E22] border-[#282B32]'
                    : 'rounded-[24px] bg-[#141619] border-[#282B32]/70'
                }`}
              >
                <img
                  src="https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/0a/a7/9f/0aa79f8a-101c-f475-c158-66e56d4a378a/JK_ZMCZ-15801.jpg/600x600bb.jpg"
                  alt="Friend Live"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#1DB954] border border-[#0B0C0E] z-20" />
              </div>

              {hoveredId === 'friend' && (
                <div className="absolute left-[80px] bg-[#111215] border border-[#282B32] text-white text-xs px-3 py-2 rounded-lg shadow-2xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 min-w-[170px] whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#1DB954] flex-shrink-0" />
                    <span>Teman (Spotify Live)</span>
                  </div>
                  <div className="text-[11px] text-[#A0A5AD] font-medium leading-tight mt-0.5">
                    Live Sync aktif &amp; terhubung
                  </div>
                </div>
              )}
            </div>

            <div className="w-8 h-[2px] bg-[#282B32] rounded-md my-0.5 flex-shrink-0" />
          </>
        )}

        {/* 2. Kasatune Brand Logo Home Tile */}
        <div
          className="relative flex items-center justify-center w-full group cursor-pointer flex-shrink-0"
          onMouseEnter={() => setHoveredId('home')}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => {
            if (pinnedServers.length > 0) {
              onSelectAlbum(pinnedServers[0].id as AlbumFilterType, pinnedServers[0]);
            } else {
              onSelectAlbum('favorites');
            }
          }}
        >
          <div
            className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 overflow-hidden bg-white shadow-sm border border-white/20 ${
              hoveredId === 'home' ? 'rounded-[16px] scale-105' : 'rounded-[24px]'
            }`}
          >
            <img
              src="/kasatune-logo.jpg"
              alt="Kasatune"
              className="w-full h-full object-contain p-1 select-none"
            />
          </div>

          {hoveredId === 'home' && (
            <div className="absolute left-[80px] bg-[#111215] border border-[#282B32] text-white text-xs px-3 py-2 rounded-lg shadow-2xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 min-w-[140px] whitespace-nowrap">
              <span className="font-bold text-white text-xs">Kasatune Studio</span>
              <span className="text-[11px] text-[#A0A5AD]">Beranda Musik</span>
            </div>
          )}
        </div>

        <div className="w-8 h-[2px] bg-[#282B32] rounded-md my-0.5 flex-shrink-0" />

        {/* 3. Custom Playlist / Favorites (KASONGS) */}
        <div
          className="relative flex items-center justify-center w-full group cursor-pointer flex-shrink-0"
          onMouseEnter={() => setHoveredId('favorites')}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => onSelectAlbum('favorites')}
        >
          {/* Active / Hover Pill Indicator */}
          <div
            className={`absolute left-0 w-1 bg-[#FF4B72] rounded-r-md transition-all duration-200 ${
              activeAlbum === 'favorites'
                ? 'h-10 opacity-100'
                : hoveredId === 'favorites'
                ? 'h-5 opacity-80'
                : 'h-0 opacity-0'
            }`}
          />

          <div
            className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 overflow-hidden border ${
              activeAlbum === 'favorites'
                ? 'rounded-[16px] ring-2 ring-[#FF4B72] border-transparent'
                : hoveredId === 'favorites'
                ? 'rounded-[16px] bg-[#1C1E22] border-[#282B32]'
                : 'rounded-[24px] bg-[#141619] border-[#282B32]/70'
            }`}
          >
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FF4B72]/20 via-[#141619] to-[#1DB954]/20 group">
              <img
                src={playlistCover}
                alt={playlistName}
                className="w-full h-full object-cover relative z-10"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
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
          </div>

          {hoveredId === 'favorites' && (
            <div className="absolute left-[80px] bg-[#111215] border border-[#282B32] text-white text-xs px-3 py-2 rounded-lg shadow-2xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 min-w-[170px] whitespace-nowrap">
              <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                <span className="w-2 h-2 rounded-full bg-[#FF4B72] flex-shrink-0" />
                <span className="truncate">{playlistName}</span>
              </div>
              <div className="text-[11px] text-[#A0A5AD] font-medium leading-tight mt-0.5">
                <span className="text-[#FF4B72] font-semibold">{likedCount} lagu</span> tersimpan di playlist ini
              </div>
            </div>
          )}
        </div>

        <div className="w-8 h-[2px] bg-[#282B32] rounded-md my-0.5 flex-shrink-0" />

        {/* 4. User-Pinned Albums List (Empty by default) */}
        {pinnedServers.map((server) => {
          const isActive = activeAlbum === server.id;
          const isHovered = hoveredId === server.id;

          return (
            <div
              key={server.id}
              className="relative flex items-center justify-center w-full group cursor-pointer flex-shrink-0"
              onMouseEnter={() => setHoveredId(server.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectAlbum(server.id, server)}
            >
              {/* Discord Pill Indicator */}
              <div
                className={`absolute left-0 w-1 bg-[#BFE7EA] rounded-r-md transition-all duration-200 ${
                  isActive
                    ? 'h-10 opacity-100'
                    : isHovered
                    ? 'h-5 opacity-80'
                    : 'h-0 opacity-0'
                }`}
              />

              {/* Album Squircle Icon */}
              <div
                className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 overflow-hidden border ${
                  isActive
                    ? 'rounded-[16px] ring-2 ring-[#BFE7EA] border-transparent'
                    : isHovered
                    ? 'rounded-[16px] bg-[#1C1E22] border-[#282B32]'
                    : 'rounded-[24px] bg-[#141619] border-[#282B32]/70'
                }`}
              >
                <img
                  src={server.imageUrl}
                  alt={server.name}
                  className="w-full h-full object-cover relative z-10"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white/90 uppercase select-none pointer-events-none bg-[#1C1E22]">
                  {server.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3)}
                </div>

                {/* Unpin 'X' Button on hover */}
                {isHovered && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePin(server);
                    }}
                    className="absolute top-0.5 right-0.5 z-30 w-4 h-4 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-md"
                    title="Lepas dari sidebar"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              {/* Floating Tooltip */}
              {isHovered && (
                <div className="absolute left-[80px] bg-[#111215] border border-[#282B32] text-white text-xs px-3 py-2 rounded-lg shadow-2xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 min-w-[170px] max-w-[280px]">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#BFE7EA] flex-shrink-0" />
                    <span className="truncate">{server.name}</span>
                  </div>
                  <div className="text-[11px] text-[#A0A5AD] font-medium leading-tight mt-0.5">
                    <span className="text-[#BFE7EA] font-semibold">Album:</span> {server.albumTitle}
                    {server.year ? ` (${server.year})` : ''}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 5. Add Album / Artist Button [+] */}
        <div
          className="relative flex items-center justify-center w-full group cursor-pointer flex-shrink-0 mt-1"
          onMouseEnter={() => setHoveredId('add_server')}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => setIsAddModalOpen(true)}
        >
          <div className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] bg-[#141619] group-hover:bg-[#1DB954] text-[#1DB954] group-hover:text-black border border-dashed border-[#282B32] group-hover:border-transparent flex items-center justify-center transition-all duration-200 shadow-sm">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>

          {hoveredId === 'add_server' && (
            <div className="absolute left-[80px] bg-[#111215] border border-[#282B32] text-white text-xs px-3 py-2 rounded-lg shadow-2xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 min-w-[160px] whitespace-nowrap">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#1DB954]" />
                <span>Tambah Album / Artis</span>
              </span>
              <span className="text-[10px] text-[#A0A5AD]">
                Cari album &amp; artis online secara global
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* Add Album Modal */}
      <AddAlbumModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        pinnedServers={pinnedServers}
        onTogglePin={handleTogglePin}
        onSelectAndPin={handleSelectAndPin}
      />
    </>
  );
};
