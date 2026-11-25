/**
 * DiscordServerRail Component -> Simple Modern Dark Library Sidebar (Desktop)
 * Deep dark matte (#121213) with #CE7F20, #EEDFC7, #607938, #53341A accents.
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
      <nav className="w-[216px] xl:w-[232px] h-full bg-[#121213] border border-white/[0.07] rounded-xl flex flex-col overflow-hidden select-none z-30">
        {/* Top Library Shortcuts */}
        <div className="p-2.5 space-y-1 border-b border-white/[0.06] flex-shrink-0">
          <button
            type="button"
            onClick={() => onSelectAlbum('favorites')}
            className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between gap-2.5 text-left ${
              activeAlbum === 'favorites'
                ? 'bg-[#53341A]/45 text-[#EEDFC7]'
                : 'text-[#9A9288]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Heart className={`w-4 h-4 flex-shrink-0 ${activeAlbum === 'favorites' ? 'text-[#CE7F20] fill-[#CE7F20]' : 'text-[#CE7F20]'}`} />
              <span className="text-xs font-medium truncate">{playlistName}</span>
            </div>
            <span className="text-[11px] font-mono text-[#9A9288] flex-shrink-0">
              {likedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectAlbum('friend')}
            className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between gap-2.5 text-left ${
              activeAlbum === 'friend'
                ? 'bg-[#53341A]/45 text-[#EEDFC7]'
                : 'text-[#9A9288]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Radio className={`w-4 h-4 flex-shrink-0 ${isFriendConnected ? 'text-[#607938]' : 'text-[#68625B]'}`} />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate leading-tight">Live Sync</p>
                <p className="text-[10px] text-[#68625B] truncate">
                  {isFriendConnected ? 'Terhubung' : 'Mode Mandiri'}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Saved Artists Header */}
        <div className="px-3.5 pt-3 pb-2 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#68625B]">
            Artis ({pinnedServers.length})
          </span>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-6 px-2 rounded bg-[#CE7F20] text-[#0B0B0C] text-[11px] font-semibold flex items-center gap-1"
            title="Tambah artis ke koleksi"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>Tambah</span>
          </button>
        </div>

        {/* Saved Artists Scrollable List */}
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1 custom-scrollbar">
          {pinnedServers.length === 0 ? (
            <div className="mx-1 mt-1 p-4 rounded-lg bg-[#18181A] border border-white/[0.06] text-center space-y-2.5">
              <p className="text-[11px] text-[#9A9288] leading-relaxed">
                Belum ada artis tersimpan.
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="w-full h-8 rounded-lg bg-[#CE7F20] text-[#0B0B0C] text-xs font-semibold"
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
                  className={`px-2.5 py-2 rounded-lg flex items-center justify-between gap-2.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#53341A]/45 text-[#EEDFC7]'
                      : 'text-[#9A9288]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded overflow-hidden bg-[#19191B] border border-white/[0.07] flex-shrink-0 relative flex items-center justify-center">
                      <span className="text-[10px] font-semibold text-[#9A9288] uppercase select-none">
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
                        className={`text-xs font-medium truncate leading-tight ${
                          isActive ? 'text-[#EEDFC7]' : 'text-[#EEDFC7]/80'
                        }`}
                      >
                        {server.name}
                      </p>
                      <p className="text-[10px] text-[#68625B] truncate mt-0.5">Artis</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePin(server);
                    }}
                    className="p-1 rounded text-[#68625B] flex-shrink-0"
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
