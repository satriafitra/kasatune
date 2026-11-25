/**
 * DiscordServerRail Component -> Kasatune Editorial Library Sidebar (Desktop)
 * Clean, calm, rounded-2xl warm-obsidian library card distinct from Spotify/Discord icon rails:
 * - Favorit Saya & Live Sync quick links
 * - Saved Artists list with rounded-xl square thumbnails and inline "+ Tambah" trigger
 */

import React, { useState } from 'react';
import { Plus, X, Heart, Radio } from 'lucide-react';
import type { CustomPlaylistData } from '../hooks/useCustomPlaylist';
import { isValidImageUrl } from '../api/liveSearch';
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
  pinnedServers?: PinnedServerItem[];
  onTogglePin?: (server: PinnedServerItem) => void;
  onSelectAndPin?: (server: PinnedServerItem) => void;
  isAddModalOpenExternal?: boolean;
  onSetAddModalOpenExternal?: (open: boolean) => void;
}

export const DiscordServerRail: React.FC<DiscordServerRailProps> = ({
  activeAlbum,
  onSelectAlbum,
  customPlaylist,
  likedCount = 0,
  isFriendConnected = false,
  pinnedServers: controlledPinned,
  onTogglePin: controlledTogglePin,
  onSelectAndPin: controlledSelectAndPin,
  isAddModalOpenExternal,
  onSetAddModalOpenExternal,
}) => {
  const [internalAddModalOpen, setInternalAddModalOpen] = useState(false);

  const isAddModalOpen = isAddModalOpenExternal !== undefined ? isAddModalOpenExternal : internalAddModalOpen;
  const setIsAddModalOpen = onSetAddModalOpenExternal || setInternalAddModalOpen;

  const [internalPinnedServers, setInternalPinnedServers] = useState<PinnedServerItem[]>(() => {
    try {
      const saved = localStorage.getItem('kasatune_pinned_artists_v4');
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
                  albumTitle: 'Popular Hits',
                  imageUrl: '/covers/radiohead.jpg',
                  type: 'artist',
                }
              );
            }
            return item;
          });
        }
      }
    } catch {}
    return [];
  });

  const pinnedServers = controlledPinned ?? internalPinnedServers;

  const handleTogglePin = (server: PinnedServerItem) => {
    if (controlledTogglePin) {
      controlledTogglePin(server);
      return;
    }
    setInternalPinnedServers((prev) => {
      const exists = prev.some((s) => s.id === server.id);
      const next = exists ? prev.filter((s) => s.id !== server.id) : [...prev, server];
      try {
        localStorage.setItem('kasatune_pinned_artists_v4', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSelectAndPin = (server: PinnedServerItem) => {
    if (controlledSelectAndPin) {
      controlledSelectAndPin(server);
      setIsAddModalOpen(false);
      return;
    }
    setInternalPinnedServers((prev) => {
      if (!prev.some((s) => s.id === server.id)) {
        const next = [...prev, server];
        try {
          localStorage.setItem('kasatune_pinned_artists_v4', JSON.stringify(next));
        } catch {}
        return next;
      }
      return prev;
    });
    onSelectAlbum(server.id as AlbumFilterType, server);
    setIsAddModalOpen(false);
  };

  const playlistName =
    !customPlaylist?.name || customPlaylist.name === 'Lagu Favorit Saya'
      ? 'Favorit Saya'
      : customPlaylist.name;

  return (
    <>
      <nav className="w-[222px] xl:w-[238px] h-full bg-[#131110] border border-white/[0.07] rounded-2xl flex flex-col overflow-hidden select-none z-30">
        {/* Top Library Shortcuts */}
        <div className="p-2.5 space-y-1 border-b border-white/[0.06] flex-shrink-0">
          <button
            type="button"
            onClick={() => onSelectAlbum('favorites')}
            className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2.5 text-left transition-all border ${
              activeAlbum === 'favorites'
                ? 'bg-[#FF6B2B]/15 border-[#FF6B2B]/35 text-[#FAF6F2]'
                : 'bg-transparent border-transparent hover:bg-white/[0.04] text-[#A8A099] hover:text-[#FAF6F2]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activeAlbum === 'favorites'
                    ? 'bg-[#FF6B2B] text-[#0A0908]'
                    : 'bg-[#1D1A17] text-[#FF8A4C]'
                }`}
              >
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <span className="text-xs font-semibold truncate">{playlistName}</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                activeAlbum === 'favorites'
                  ? 'bg-[#FF6B2B]/20 text-[#FFA14A]'
                  : 'bg-white/[0.05] text-[#756E68]'
              }`}
            >
              {likedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectAlbum('friend')}
            className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2.5 text-left transition-all border ${
              activeAlbum === 'friend'
                ? 'bg-[#FF6B2B]/15 border-[#FF6B2B]/35 text-[#FAF6F2]'
                : 'bg-transparent border-transparent hover:bg-white/[0.04] text-[#A8A099] hover:text-[#FAF6F2]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isFriendConnected
                    ? 'bg-[#FF6B2B]/20 text-[#FF8A4C]'
                    : 'bg-[#1D1A17] text-[#8A817A]'
                }`}
              >
                <Radio className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate leading-tight">Live Sync</p>
                <p className="text-[10px] text-[#756E68] truncate">
                  {isFriendConnected ? 'Terhubung' : 'Mode Mandiri'}
                </p>
              </div>
            </div>
            {isFriendConnected && (
              <span className="w-2 h-2 rounded-full bg-[#FF6B2B] flex-shrink-0 animate-pulse" />
            )}
          </button>
        </div>

        {/* Saved Artists Header */}
        <div className="px-3.5 pt-3 pb-2 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#756E68]">
            Artis ({pinnedServers.length})
          </span>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-6 px-2 rounded-lg bg-[#FF6B2B]/15 hover:bg-[#FF6B2B]/25 text-[#FF8A4C] border border-[#FF6B2B]/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
            title="Tambah artis ke koleksi"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>Tambah</span>
          </button>
        </div>

        {/* Saved Artists Scrollable List */}
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1 custom-scrollbar">
          {pinnedServers.length === 0 ? (
            <div className="mx-1 mt-1 p-4 rounded-xl bg-[#1A1715]/70 border border-dashed border-white/[0.08] text-center space-y-2.5">
              <p className="text-[11px] text-[#8A817A] leading-relaxed">
                Simpan artis favorit agar mudah diakses kapan saja.
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="w-full h-8 rounded-lg bg-[#FF6B2B] hover:bg-[#FF7E45] text-[#0A0908] text-xs font-bold transition-colors"
              >
                Cari Artis
              </button>
            </div>
          ) : (
            pinnedServers.map((server) => {
              const isActive = activeAlbum === server.id;
              return (
                <div
                  key={server.id}
                  onClick={() => onSelectAlbum(server.id, server)}
                  className={`group relative px-2.5 py-2 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-[#FF6B2B]/15 border-[#FF6B2B]/30 text-[#FAF6F2]'
                      : 'bg-transparent border-transparent hover:bg-white/[0.04] text-[#B8B0A8] hover:text-[#FAF6F2]'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#FF6B2B]" />
                  )}

                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#1D1A17] border border-white/[0.07] flex-shrink-0 relative flex items-center justify-center">
                      <span className="text-[10px] font-bold text-[#A8A099] uppercase select-none">
                        {server.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3) || '♪'}
                      </span>
                      {isValidImageUrl(server.imageUrl) && (
                        <img
                          src={server.imageUrl}
                          alt={server.name}
                          className="w-full h-full object-cover absolute inset-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate leading-tight ${
                          isActive ? 'text-[#FFA14A]' : 'text-[#FAF6F2]'
                        }`}
                      >
                        {server.name}
                      </p>
                      <p className="text-[10px] text-[#756E68] truncate mt-0.5">Artis</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePin(server);
                    }}
                    className="p-1 rounded-md text-[#756E68] opacity-0 group-hover:opacity-100 hover:text-[#FF6B2B] hover:bg-white/[0.06] transition-all flex-shrink-0"
                    title="Hapus dari koleksi"
                    aria-label="Hapus artis"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </nav>

      {/* Fallback standalone modal when DiscordServerRail is used without root modal control */}
      {isAddModalOpenExternal === undefined && (
        <AddAlbumModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          pinnedServers={pinnedServers}
          onTogglePin={handleTogglePin}
          onSelectAndPin={handleSelectAndPin}
        />
      )}
    </>
  );
};
