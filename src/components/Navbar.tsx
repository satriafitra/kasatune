/**
 * Navbar Component (Discord x Spotify Top Bar)
 * Deep obsidian dark surfaces with vibrant Ice Blue (#BFE7EA) and Kasatune Sunset accents:
 * - Kasatune brand pill with Ice Blue channel marker
 * - Discord-style search bar with Ctrl+K shortcut hint
 * - Go backend health status badge & settings modal
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Settings,
  Music2,
  X,
  Play,
  Pause,
  Volume2,
  Heart,
  Globe,
  Loader2,
} from 'lucide-react';
import { KasatuneLogoIcon } from './KasatuneLogo';
import type { BackendRadioheadTrack } from '../api/backend';
import { isSameTrack } from '../api/liveSearch';

interface NavbarProps {
  isBackendOnline: boolean;
  onRefreshBackend: () => void;
  clientId: string;
  onSetClientId: (id: string) => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  friendTrackTitle?: string;
  isFriendConnected?: boolean;
  onConnectFriendSpotify?: () => void;
  mobileView?: 'player' | 'lyrics' | 'sidebar';
  onSelectMobileView?: (view: 'player' | 'lyrics' | 'sidebar') => void;
  tracks?: BackendRadioheadTrack[];
  liveTracks?: BackendRadioheadTrack[];
  isLoadingLive?: boolean;
  onSelectTrack?: (track: BackendRadioheadTrack) => void;
  activeTrackId?: string;
  isPlaying?: boolean;
  isLikedTrack?: (trackId: string) => boolean;
  onToggleLikeTrack?: (track: BackendRadioheadTrack) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isBackendOnline,
  onRefreshBackend,
  clientId,
  onSetClientId,
  isAuthenticated,
  onLogin,
  onLogout,
  isLoading,
  searchQuery,
  onSearchChange,
  friendTrackTitle,
  isFriendConnected = false,
  onConnectFriendSpotify = () => {},
  mobileView = 'player',
  onSelectMobileView = () => {},
  tracks = [],
  liveTracks = [],
  isLoadingLive = false,
  onSelectTrack,
  activeTrackId,
  isPlaying = false,
  isLikedTrack,
  onToggleLikeTrack,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempClientId, setTempClientId] = useState(clientId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target) &&
        (!mobileSearchRef.current || !mobileSearchRef.current.contains(target))
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Ctrl+K / Cmd+K and Escape keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsDropdownOpen(true);
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsMobileSearchOpen(false);
        searchInputRef.current?.blur();
        mobileInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter local library tracks matching search query
  const localMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) return [];
    const isVanderSearch = q.includes('vander') || q.includes('vender');

    return (tracks || [])
      .filter((t) => {
        return (
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          (t.album && t.album.toLowerCase().includes(q)) ||
          (isVanderSearch &&
            (t.category === 'vander' ||
              t.artist.toLowerCase().includes('vander') ||
              t.artist.toLowerCase().includes('vender')))
        );
      })
      .slice(0, 15);
  }, [tracks, searchQuery]);

  // Real-time online matches, deduplicated against local library matches
  const deduplicatedLiveMatches = useMemo(() => {
    const localIds = new Set(localMatches.map((t) => t.id));
    return (liveTracks || []).filter((lt) => !localIds.has(lt.id)).slice(0, 15);
  }, [liveTracks, localMatches]);

  const totalMatches = localMatches.length + deduplicatedLiveMatches.length;

  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '3:45';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleSelectSong = (track: BackendRadioheadTrack) => {
    onSelectTrack?.(track);
    setIsDropdownOpen(false);
    setIsMobileSearchOpen(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSetClientId(tempClientId);
    setIsSettingsOpen(false);
  };

  const currentRedirectUri = window.location.origin + window.location.pathname;

  return (
    <header className="h-[52px] sm:h-14 w-full bg-[#0B0C0E] border-b border-white/[0.06] px-3.5 sm:px-5 flex items-center justify-between gap-3 select-none z-30 flex-shrink-0">
      {/* Left: Clean Kasatune Brand */}
      <div className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer">
        <KasatuneLogoIcon size={26} />
        <span className="font-bold text-[15px] sm:text-sm text-white tracking-tight">
          Kasatune
        </span>
      </div>

      {/* Mobile Right Controls: Clean Search & Settings ONLY (Navigation lives in native Bottom Tab Bar) */}
      <div className="flex md:hidden items-center gap-2">
        <button
          onClick={() => {
            setIsMobileSearchOpen((prev) => !prev);
            setTimeout(() => mobileInputRef.current?.focus(), 100);
          }}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
            isMobileSearchOpen
              ? 'bg-white/10 text-white border-white/25'
              : 'bg-[#141619] text-[#A0A5AD] border-white/[0.08] active:bg-white/10'
          }`}
          aria-label="Cari lagu"
        >
          {isMobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-9 h-9 rounded-full bg-[#141619] active:bg-white/10 border border-white/[0.08] flex items-center justify-center text-[#A0A5AD] relative"
          aria-label="Pengaturan"
        >
          <Settings className="w-4 h-4" />
          <span
            className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${
              isBackendOnline ? 'bg-[#1DB954]' : 'bg-[#FEE75C]'
            }`}
          />
        </button>
      </div>

      {/* Center: Search Bar with Dropdown Popover (Desktop) */}
      <div className="hidden md:flex flex-1 max-w-lg relative z-50" ref={searchContainerRef}>
        <div className="w-full relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-[#949BA4] pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim().length >= 1) {
                setIsDropdownOpen(true);
              }
            }}
            placeholder="Cari lagu, artis, atau album..."
            className="w-full h-8 pl-9 pr-14 rounded-md bg-[#141619] hover:bg-[#1C1E22] focus:bg-[#1C1E22] border border-[#282B32] focus:border-[#BFE7EA] text-xs text-white placeholder-[#656A74] focus:outline-none transition-colors"
          />

          {searchQuery ? (
            <button
              onClick={() => {
                onSearchChange('');
                setIsDropdownOpen(false);
              }}
              className="absolute right-8 text-[#949BA4] hover:text-white p-0.5 rounded transition-colors"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-[#949BA4] bg-[#0B0C0E] border border-[#282B32] rounded pointer-events-none">
              Ctrl+K
            </kbd>
          )}
        </div>

        {/* Dropdown Menu Popover (Self-contained dark frosted blur without dimming the page) */}
        {isDropdownOpen && searchQuery.trim().length >= 1 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0C0E]/95 backdrop-blur-2xl border border-[#32363E] rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] ring-1 ring-black/80 z-50 overflow-hidden max-h-[480px] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Dropdown Header Info */}
            <div className="px-4 py-2.5 border-b border-[#282B32] bg-[#07080A]/95 flex items-center justify-between text-xs text-[#A0A5AD]">
                <div className="flex items-center gap-1.5 truncate">
                  <Search className="w-3.5 h-3.5 text-[#BFE7EA]" />
                  <span className="font-semibold text-white truncate">
                    "{searchQuery}"
                  </span>
                  <span className="text-[11px] text-[#656A74]">
                    &bull; {totalMatches} lagu ditemukan
                  </span>
                </div>
                {isLoadingLive && (
                  <div className="flex items-center gap-1.5 text-[10px] text-[#1DB954] flex-shrink-0 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Mencari online...</span>
                  </div>
                )}
              </div>

              {/* Dropdown Scrollable Results */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar bg-transparent">
                {/* 1. Local Library Results */}
                {localMatches.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2.5 pt-1.5 pb-1 text-[9px] font-extrabold uppercase tracking-wider text-[#949BA4] flex items-center justify-between">
                      <span>Koleksi Lagu ({localMatches.length})</span>
                      <span className="text-[#BFE7EA] font-mono text-[9px]">LOKAL</span>
                    </div>
                    {localMatches.map((t) => {
                      const isActive = t.id === activeTrackId;
                      const isLiked = isLikedTrack ? isLikedTrack(t.id) : false;

                      return (
                        <div
                          key={t.id}
                          onClick={() => handleSelectSong(t)}
                          className={`group flex items-center justify-between gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all border ${
                            isActive
                              ? 'bg-[#1C1E22] border-[#BFE7EA]/40 text-white shadow-md'
                              : 'bg-[#111317] hover:bg-[#181A20] border-[#1F2228] hover:border-[#383C45] text-[#A0A5AD] hover:text-[#F2F3F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Thumbnail */}
                            <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-md overflow-hidden flex-shrink-0 bg-[#0B0C0E] border border-[#282B32] relative group-hover:border-[#BFE7EA]/50 shadow-sm">
                              <img
                                src={t.coverUrl}
                                alt={t.title}
                                className="w-full h-full object-cover block"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                              {/* Hover Play/Pause overlay */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                {isActive && isPlaying ? (
                                  <Pause className="w-4 h-4 text-white fill-current" />
                                ) : (
                                  <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />
                                )}
                              </div>
                            </div>

                            <div className="min-w-0 flex flex-col justify-center">
                              <p
                                className={`text-xs font-bold truncate leading-tight ${
                                  isActive ? 'text-[#BFE7EA]' : 'text-white'
                                }`}
                              >
                                {t.title}
                              </p>
                              <p className="text-[11px] text-[#A0A5AD] truncate mt-0.5">
                                {t.artist} &bull; {t.album}
                              </p>
                            </div>
                          </div>

                          {/* Right: Heart + Duration */}
                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            {onToggleLikeTrack && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleLikeTrack(t);
                                }}
                                className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
                                  isLiked
                                    ? 'text-[#FF4B72]'
                                    : 'text-[#656A74] opacity-0 group-hover:opacity-100 hover:text-white'
                                }`}
                                title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#FF4B72]' : ''}`} />
                              </button>
                            )}
                            <span className="text-[11px] font-mono text-[#8C929C]">
                              {formatDuration(t.durationMs)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Online Real-Time Discovery Results */}
                {deduplicatedLiveMatches.length > 0 && (
                  <div className="pt-2 space-y-1">
                    <div className="px-2.5 pb-1 text-[9px] font-extrabold uppercase tracking-wider text-[#1DB954] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-[#1DB954]" />
                        <span>Online Global (Real-time)</span>
                      </span>
                      <span className="text-[9px] font-mono text-[#949BA4]">
                        {deduplicatedLiveMatches.length} lagu
                      </span>
                    </div>

                    {deduplicatedLiveMatches.map((t) => {
                      const isActive = t.id === activeTrackId || isSameTrack(t, tracks.find((lt) => lt.id === activeTrackId));
                      const isLiked = isLikedTrack ? isLikedTrack(t.id) : false;

                      return (
                        <div
                          key={t.id}
                          onClick={() => handleSelectSong(t)}
                          className={`group flex items-center justify-between gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all border ${
                            isActive
                              ? 'bg-[#1C1E22] border-[#1DB954]/50 text-white shadow-md'
                              : 'bg-[#111317] hover:bg-[#181A20] border-[#1F2228] hover:border-[#1DB954]/40 text-[#A0A5AD] hover:text-[#F2F3F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-md overflow-hidden flex-shrink-0 bg-[#0B0C0E] border border-[#282B32] relative group-hover:border-[#1DB954]/50 shadow-sm">
                              <img
                                src={t.coverUrl}
                                alt={t.title}
                                className="w-full h-full object-cover block"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />
                              </div>
                            </div>

                            <div className="min-w-0 flex flex-col justify-center">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-white truncate leading-tight">
                                  {t.title}
                                </p>
                                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 flex-shrink-0">
                                  LIVE
                                </span>
                              </div>
                              <p className="text-[11px] text-[#A0A5AD] truncate mt-0.5">
                                {t.artist} &bull; {t.album}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            {onToggleLikeTrack && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleLikeTrack(t);
                                }}
                                className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
                                  isLiked
                                    ? 'text-[#FF4B72]'
                                    : 'text-[#656A74] opacity-0 group-hover:opacity-100 hover:text-white'
                                }`}
                                title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#FF4B72]' : ''}`} />
                              </button>
                            )}
                            <span className="text-[11px] font-mono text-[#8C929C]">
                              {formatDuration(t.durationMs)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {totalMatches === 0 && !isLoadingLive && (
                  <div className="py-10 px-4 text-center">
                    <p className="text-sm font-semibold text-white mb-1">
                      Tidak ada lagu ditemukan
                    </p>
                    <p className="text-xs text-[#71757E]">
                      Coba kata kunci judul lagu atau nama penyanyi lain.
                    </p>
                  </div>
                )}
              </div>

              {/* Dropdown Footer Tip */}
              <div className="px-4 py-2 bg-[#07080A]/95 border-t border-[#282B32] flex items-center justify-between text-[10px] text-[#71757E]">
                <span>Klik lagu untuk langsung memutar</span>
                <span>ESC untuk menutup</span>
              </div>
            </div>
        )}
      </div>

      {/* Mobile Search Overlay Drawer (Visible when isMobileSearchOpen on < md) */}
      {isMobileSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="md:hidden fixed top-[52px] left-0 right-0 bg-[#101216]/98 backdrop-blur-2xl border-b border-white/10 p-3.5 z-50 shadow-[0_24px_60px_rgba(0,0,0,0.92)] animate-in slide-in-from-top-2 duration-150"
        >
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-[#7A8089] pointer-events-none" />
            <input
              ref={mobileInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari judul lagu atau artis..."
              className="w-full h-10 pl-9 pr-9 rounded-xl bg-[#191B20] border border-white/10 text-sm text-white placeholder-[#6B717B] focus:outline-none focus:border-white/25"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 text-[#949BA4] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchQuery.trim().length >= 1 && (
            <div className="mt-2.5 bg-[#121418] border border-white/[0.08] rounded-xl overflow-hidden max-h-[55dvh] overflow-y-auto custom-scrollbar p-1.5 space-y-1 shadow-2xl">
              {localMatches.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectSong(t)}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-lg active:bg-white/[0.08] text-white cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={t.coverUrl}
                      alt=""
                      className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-[#181A1F]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate leading-tight">{t.title}</p>
                      <p className="text-[11px] text-[#949BA4] truncate mt-0.5">{t.artist}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#7A8089] flex-shrink-0">
                    {formatDuration(t.durationMs)}
                  </span>
                </div>
              ))}

              {deduplicatedLiveMatches.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectSong(t)}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-lg active:bg-white/[0.08] text-white cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={t.coverUrl}
                      alt=""
                      className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-[#181A1F]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate leading-tight">{t.title}</p>
                      <p className="text-[11px] text-[#949BA4] truncate mt-0.5">{t.artist}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#7A8089] flex-shrink-0">
                    {formatDuration(t.durationMs)}
                  </span>
                </div>
              ))}

              {totalMatches === 0 && (
                <div className="py-6 text-center text-xs text-[#7A8089]">
                  {isLoadingLive ? 'Mencari...' : 'Tidak ada lagu ditemukan.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Right Controls: Simplified Friend Sync & Settings (Desktop only) */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={onConnectFriendSpotify}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            isFriendConnected
              ? 'bg-[#1DB954]/15 border-[#1DB954]/40 text-[#1DB954]'
              : 'bg-[#141619] border-[#282B32] text-[#A0A5AD] hover:text-white hover:bg-[#1C1E22]'
          }`}
          title={isFriendConnected ? 'Friend Live Sync aktif' : 'Buka Live Sync Teman'}
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isFriendConnected ? 'bg-[#1DB954]' : 'bg-[#656A74]'
            }`}
          />
          <span className="truncate max-w-[130px]">
            {friendTrackTitle ? friendTrackTitle : 'Live Sync'}
          </span>
        </button>

        {isAuthenticated ? (
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-full bg-[#1C1E22] hover:bg-[#ED4245] text-white text-xs font-medium transition-colors border border-[#282B32]"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full bg-[#141619] hover:bg-[#1C1E22] text-[#A0A5AD] hover:text-white border border-[#282B32] transition-colors"
            title="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Settings Modal (Deep Obsidian Style) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141619] border border-[#282B32] rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#282B32] pb-3">
              <h3 className="font-bold text-base text-white">Kasatune Settings</h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-[#656A74] hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#A0A5AD] uppercase font-bold text-[11px] mb-1.5">
                  Spotify Client ID (Optional for Live Remote Polling)
                </label>
                <input
                  type="text"
                  value={tempClientId}
                  onChange={(e) => setTempClientId(e.target.value)}
                  placeholder="Paste Spotify Client ID..."
                  className="w-full p-2.5 rounded-md bg-[#0B0C0E] border border-[#282B32] text-white focus:outline-none focus:border-[#BFE7EA]"
                />
              </div>

              <div className="bg-[#0B0C0E] p-3 rounded-md border border-[#282B32] space-y-1 text-[#A0A5AD]">
                <p className="font-semibold text-white">Redirect URI:</p>
                <code className="text-[11px] text-[#BFE7EA] block select-all break-all">
                  {currentRedirectUri}
                </code>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3 py-1.5 rounded-md text-white hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-gradient-to-r from-[#E89B5B] to-[#D46743] hover:opacity-95 text-white font-semibold shadow-md"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
