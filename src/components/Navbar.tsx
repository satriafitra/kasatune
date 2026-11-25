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
    <header className="h-[52px] sm:h-14 w-full bg-[#0A0908] border-b border-white/[0.06] px-3.5 sm:px-5 flex items-center justify-between gap-3 select-none z-30 flex-shrink-0">
      {/* Left: Clean Kasatune Brand with Subtle Orange Dot */}
      <div className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer">
        <KasatuneLogoIcon size={26} />
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[15px] sm:text-sm text-[#FAF6F2] tracking-tight">
            Kasatune
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2B]" />
        </div>
      </div>

      {/* Mobile Right Controls: Clean Search & Settings ONLY */}
      <div className="flex md:hidden items-center gap-2">
        <button
          onClick={() => {
            setIsMobileSearchOpen((prev) => !prev);
            setTimeout(() => mobileInputRef.current?.focus(), 100);
          }}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
            isMobileSearchOpen
              ? 'bg-[#FF6B2B]/15 text-[#FF8A4C] border-[#FF6B2B]/40'
              : 'bg-[#151210] text-[#A8A099] border-white/[0.08] active:bg-white/10'
          }`}
          aria-label="Cari lagu"
        >
          {isMobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-9 h-9 rounded-xl bg-[#151210] active:bg-white/10 border border-white/[0.08] flex items-center justify-center text-[#A8A099] relative"
          aria-label="Pengaturan"
        >
          <Settings className="w-4 h-4" />
          <span
            className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${
              isBackendOnline ? 'bg-[#FF6B2B]' : 'bg-[#FFA14A]'
            }`}
          />
        </button>
      </div>

      {/* Center: Search Bar with Dropdown Popover (Desktop) */}
      <div className="hidden md:flex flex-1 max-w-lg relative z-50" ref={searchContainerRef}>
        <div className="w-full relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-[#8A817A] pointer-events-none" />
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
            className="w-full h-9 pl-9 pr-14 rounded-xl bg-[#151210] hover:bg-[#1B1816] focus:bg-[#1B1816] border border-white/[0.08] focus:border-[#FF6B2B]/60 text-xs text-[#FAF6F2] placeholder-[#756E68] focus:outline-none transition-colors"
          />

          {searchQuery ? (
            <button
              onClick={() => {
                onSearchChange('');
                setIsDropdownOpen(false);
              }}
              className="absolute right-8 text-[#8A817A] hover:text-white p-0.5 rounded transition-colors"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-[#8A817A] bg-[#0A0908] border border-white/[0.08] rounded-md pointer-events-none">
              Ctrl+K
            </kbd>
          )}
        </div>

        {/* Dropdown Menu Popover */}
        {isDropdownOpen && searchQuery.trim().length >= 1 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#12100E]/96 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-50 overflow-hidden max-h-[480px] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-2.5 border-b border-white/[0.07] bg-[#0C0A09]/95 flex items-center justify-between text-xs text-[#A8A099]">
                <div className="flex items-center gap-1.5 truncate">
                  <Search className="w-3.5 h-3.5 text-[#FF6B2B]" />
                  <span className="font-semibold text-[#FAF6F2] truncate">
                    "{searchQuery}"
                  </span>
                  <span className="text-[11px] text-[#756E68]">
                    &bull; {totalMatches} lagu ditemukan
                  </span>
                </div>
                {isLoadingLive && (
                  <div className="flex items-center gap-1.5 text-[10px] text-[#FFA14A] flex-shrink-0 font-medium">
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
                    <div className="px-2.5 pt-1.5 pb-1 text-[9px] font-extrabold uppercase tracking-wider text-[#8A817A] flex items-center justify-between">
                      <span>Koleksi Lagu ({localMatches.length})</span>
                      <span className="text-[#FFA14A] font-mono text-[9px]">LOKAL</span>
                    </div>
                    {localMatches.map((t) => {
                      const isActive = t.id === activeTrackId;
                      const isLiked = isLikedTrack ? isLikedTrack(t.id) : false;

                      return (
                        <div
                          key={t.id}
                          onClick={() => handleSelectSong(t)}
                          className={`group flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                            isActive
                              ? 'bg-[#FF6B2B]/15 border-[#FF6B2B]/40 text-white shadow-md'
                              : 'bg-[#161311] hover:bg-[#1E1A17] border-white/[0.05] hover:border-white/[0.12] text-[#A8A099] hover:text-[#FAF6F2]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg overflow-hidden flex-shrink-0 bg-[#0A0908] border border-white/[0.08] relative group-hover:border-[#FF6B2B]/40 shadow-sm">
                              <img
                                src={t.coverUrl}
                                alt={t.title}
                                className="w-full h-full object-cover block"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                {isActive && isPlaying ? (
                                  <Pause className="w-4 h-4 text-[#FF6B2B] fill-current" />
                                ) : (
                                  <Play className="w-4 h-4 text-[#FF6B2B] fill-current translate-x-0.5" />
                                )}
                              </div>
                            </div>

                            <div className="min-w-0 flex flex-col justify-center">
                              <p
                                className={`text-xs font-bold truncate leading-tight ${
                                  isActive ? 'text-[#FFA14A]' : 'text-[#FAF6F2]'
                                }`}
                              >
                                {t.title}
                              </p>
                              <p className="text-[11px] text-[#9E958D] truncate mt-0.5">
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
                                className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                                  isLiked
                                    ? 'text-[#FF6B2B]'
                                    : 'text-[#756E68] opacity-0 group-hover:opacity-100 hover:text-white'
                                }`}
                                title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#FF6B2B]' : ''}`} />
                              </button>
                            )}
                            <span className="text-[11px] font-mono text-[#8A817A]">
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
                    <div className="px-2.5 pb-1 text-[9px] font-extrabold uppercase tracking-wider text-[#FF8A4C] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-[#FF6B2B]" />
                        <span>Online Global (Real-time)</span>
                      </span>
                      <span className="text-[9px] font-mono text-[#8A817A]">
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
                          className={`group flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                            isActive
                              ? 'bg-[#FF6B2B]/15 border-[#FF6B2B]/45 text-white shadow-md'
                              : 'bg-[#161311] hover:bg-[#1E1A17] border-white/[0.05] hover:border-[#FF6B2B]/35 text-[#A8A099] hover:text-[#FAF6F2]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg overflow-hidden flex-shrink-0 bg-[#0A0908] border border-white/[0.08] relative group-hover:border-[#FF6B2B]/45 shadow-sm">
                              <img
                                src={t.coverUrl}
                                alt={t.title}
                                className="w-full h-full object-cover block"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Play className="w-4 h-4 text-[#FF6B2B] fill-current translate-x-0.5" />
                              </div>
                            </div>

                            <div className="min-w-0 flex flex-col justify-center">
                              <div className="flex items-center gap-1.5">
                                <p className={`text-xs font-bold truncate leading-tight ${isActive ? 'text-[#FFA14A]' : 'text-[#FAF6F2]'}`}>
                                  {t.title}
                                </p>
                                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#FF6B2B]/15 text-[#FF8A4C] border border-[#FF6B2B]/30 flex-shrink-0">
                                  LIVE
                                </span>
                              </div>
                              <p className="text-[11px] text-[#9E958D] truncate mt-0.5">
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
                                className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                                  isLiked
                                    ? 'text-[#FF6B2B]'
                                    : 'text-[#756E68] opacity-0 group-hover:opacity-100 hover:text-white'
                                }`}
                                title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#FF6B2B]' : ''}`} />
                              </button>
                            )}
                            <span className="text-[11px] font-mono text-[#8A817A]">
                              {formatDuration(t.durationMs)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {totalMatches === 0 && !isLoadingLive && (
                  <div className="py-10 px-4 text-center">
                    <p className="text-sm font-semibold text-[#FAF6F2] mb-1">
                      Tidak ada lagu ditemukan
                    </p>
                    <p className="text-xs text-[#756E68]">
                      Coba kata kunci judul lagu atau nama penyanyi lain.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-4 py-2 bg-[#0C0A09]/95 border-t border-white/[0.07] flex items-center justify-between text-[10px] text-[#756E68]">
                <span>Klik lagu untuk langsung memutar</span>
                <span>ESC untuk menutup</span>
              </div>
            </div>
        )}
      </div>

      {/* Mobile Search Overlay Drawer */}
      {isMobileSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="md:hidden fixed top-[52px] left-0 right-0 bg-[#12100E]/98 backdrop-blur-2xl border-b border-white/[0.09] p-3.5 z-50 shadow-[0_24px_60px_rgba(0,0,0,0.92)] animate-in slide-in-from-top-2 duration-150"
        >
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-[#8A817A] pointer-events-none" />
            <input
              ref={mobileInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari judul lagu atau artis..."
              className="w-full h-10 pl-9 pr-9 rounded-xl bg-[#1B1816] border border-white/[0.09] text-sm text-[#FAF6F2] placeholder-[#756E68] focus:outline-none focus:border-[#FF6B2B]/60"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 text-[#8A817A] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchQuery.trim().length >= 1 && (
            <div className="mt-2.5 bg-[#151210] border border-white/[0.08] rounded-2xl overflow-hidden max-h-[55dvh] overflow-y-auto custom-scrollbar p-1.5 space-y-1 shadow-2xl">
              {localMatches.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectSong(t)}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-xl active:bg-[#FF6B2B]/15 text-[#FAF6F2] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={t.coverUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-[#1D1A17]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate leading-tight">{t.title}</p>
                      <p className="text-[11px] text-[#9E958D] truncate mt-0.5">{t.artist}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#756E68] flex-shrink-0">
                    {formatDuration(t.durationMs)}
                  </span>
                </div>
              ))}

              {deduplicatedLiveMatches.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectSong(t)}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-xl active:bg-[#FF6B2B]/15 text-[#FAF6F2] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={t.coverUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-[#1D1A17]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate leading-tight">{t.title}</p>
                      <p className="text-[11px] text-[#9E958D] truncate mt-0.5">{t.artist}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#756E68] flex-shrink-0">
                    {formatDuration(t.durationMs)}
                  </span>
                </div>
              ))}

              {totalMatches === 0 && (
                <div className="py-6 text-center text-xs text-[#8A817A]">
                  {isLoadingLive ? 'Mencari...' : 'Tidak ada lagu ditemukan.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Right Controls: Live Sync & Settings (Desktop only) */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={onConnectFriendSpotify}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
            isFriendConnected
              ? 'bg-[#FF6B2B]/15 border-[#FF6B2B]/40 text-[#FF8A4C]'
              : 'bg-[#151210] border-white/[0.08] text-[#A8A099] hover:text-[#FAF6F2] hover:bg-[#1D1A17]'
          }`}
          title={isFriendConnected ? 'Friend Live Sync aktif' : 'Buka Live Sync Teman'}
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isFriendConnected ? 'bg-[#FF6B2B]' : 'bg-[#756E68]'
            }`}
          />
          <span className="truncate max-w-[130px]">
            {friendTrackTitle ? friendTrackTitle : 'Live Sync'}
          </span>
        </button>

        {isAuthenticated ? (
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl bg-[#1D1A17] hover:bg-[#E04F26] text-white text-xs font-medium transition-colors border border-white/[0.08]"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-[#151210] hover:bg-[#1D1A17] text-[#A8A099] hover:text-[#FAF6F2] border border-white/[0.08] transition-colors"
            title="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151210] border border-white/[0.09] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <h3 className="font-bold text-base text-[#FAF6F2]">Pengaturan Kasatune</h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-[#8A817A] hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#A8A099] uppercase font-bold text-[11px] mb-1.5">
                  Spotify Client ID (Opsional untuk Live Remote Polling)
                </label>
                <input
                  type="text"
                  value={tempClientId}
                  onChange={(e) => setTempClientId(e.target.value)}
                  placeholder="Paste Spotify Client ID..."
                  className="w-full p-2.5 rounded-xl bg-[#0A0908] border border-white/[0.08] text-[#FAF6F2] focus:outline-none focus:border-[#FF6B2B]/60"
                />
              </div>

              <div className="bg-[#0A0908] p-3 rounded-xl border border-white/[0.07] space-y-1 text-[#A8A099]">
                <p className="font-semibold text-[#FAF6F2]">Redirect URI:</p>
                <code className="text-[11px] text-[#FFA14A] block select-all break-all">
                  {currentRedirectUri}
                </code>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-[#A8A099] hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6B2B] to-[#FF8A3D] hover:brightness-110 text-[#0A0908] font-bold shadow-md"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
