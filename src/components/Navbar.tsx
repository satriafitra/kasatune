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
  ListPlus,
  LogOut,
} from 'lucide-react';
import { KasatuneLogoIcon } from './KasatuneLogo';
import type { BackendRadioheadTrack } from '../api/backend';
import type { AuthUser } from '../utils/authStore';
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
  mobileView?: 'player' | 'lyrics' | 'queue' | 'sidebar';
  onSelectMobileView?: (view: 'player' | 'lyrics' | 'queue' | 'sidebar') => void;
  tracks?: BackendRadioheadTrack[];
  liveTracks?: BackendRadioheadTrack[];
  isLoadingLive?: boolean;
  onSelectTrack?: (track: BackendRadioheadTrack) => void;
  activeTrackId?: string;
  isPlaying?: boolean;
  isLikedTrack?: (trackId: string) => boolean;
  onToggleLikeTrack?: (track: BackendRadioheadTrack) => void;
  onAddToQueue?: (track: BackendRadioheadTrack) => void;
  authUser?: AuthUser | null;
  onAccountLogout?: () => void;
  onGoHome?: () => void;
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
  onAddToQueue,
  authUser,
  onAccountLogout,
  onGoHome,
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
    <header className="h-[52px] sm:h-14 w-full bg-[#0B0B0C] border-b border-white/[0.06] px-3.5 sm:px-5 flex items-center justify-between gap-3 select-none z-30 flex-shrink-0">
      {/* Left: Clean Kasatune Brand (Clicks return to Home / Beranda) */}
      <div
        onClick={onGoHome}
        className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer"
        title="Beranda"
      >
        <KasatuneLogoIcon size={26} />
        <span className="font-bold text-[15px] sm:text-sm text-[#EEDFC7] tracking-tight">
          Kasatune
        </span>
      </div>

      {/* Mobile Right Controls: Clean Search & Settings */}
      <div className="flex md:hidden items-center gap-2">
        <button
          onClick={() => {
            setIsMobileSearchOpen((prev) => !prev);
            setTimeout(() => mobileInputRef.current?.focus(), 100);
          }}
          className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
            isMobileSearchOpen
              ? 'bg-[#53341A]/45 text-[#EEDFC7] border-[#CE7F20]/50'
              : 'bg-[#121213] text-[#9A9288] border-white/[0.08]'
          }`}
          aria-label="Cari lagu"
        >
          {isMobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-9 h-9 rounded-lg bg-[#121213] border border-white/[0.08] flex items-center justify-center text-[#9A9288]"
          aria-label="Pengaturan"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Search Bar (Desktop) */}
      <div className="hidden md:flex flex-1 max-w-lg relative z-50" ref={searchContainerRef}>
        <div className="w-full relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-[#68625B] pointer-events-none" />
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
            className="w-full h-9 pl-9 pr-14 rounded-lg bg-[#121213] border border-white/[0.08] focus:border-[#CE7F20] text-xs text-[#EEDFC7] placeholder-[#68625B] focus:outline-none"
          />

          {searchQuery ? (
            <button
              onClick={() => {
                onSearchChange('');
                setIsDropdownOpen(false);
              }}
              className="absolute right-8 text-[#9A9288] p-0.5 rounded"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-[#68625B] bg-[#0B0B0C] border border-white/[0.08] rounded pointer-events-none">
              Ctrl+K
            </kbd>
          )}
        </div>

        {/* Dropdown Menu Popover */}
        {isDropdownOpen && searchQuery.trim().length >= 1 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#121213] border border-white/[0.1] rounded-xl shadow-2xl z-50 overflow-hidden max-h-[480px] flex flex-col">
            <div className="px-4 py-2.5 border-b border-white/[0.07] bg-[#0E0E0F] flex items-center justify-between text-xs text-[#9A9288]">
              <div className="flex items-center gap-1.5 truncate">
                <Search className="w-3.5 h-3.5 text-[#CE7F20]" />
                <span className="font-semibold text-[#EEDFC7] truncate">
                  "{searchQuery}"
                </span>
                <span className="text-[11px] text-[#68625B]">
                  &bull; {totalMatches} lagu ditemukan
                </span>
              </div>
              {isLoadingLive && (
                <div className="flex items-center gap-1.5 text-[10px] text-[#CE7F20] flex-shrink-0 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Mencari online...</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {localMatches.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2.5 pt-1.5 pb-1 text-[9px] font-semibold uppercase tracking-wider text-[#68625B] flex items-center justify-between">
                    <span>Koleksi Lagu ({localMatches.length})</span>
                    <span className="text-[#CE7F20] font-mono text-[9px]">LOKAL</span>
                  </div>
                  {localMatches.map((t) => {
                    const isActive = t.id === activeTrackId;
                    const isLiked = isLikedTrack ? isLikedTrack(t.id) : false;

                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectSong(t)}
                        className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg cursor-pointer border ${
                          isActive
                            ? 'bg-[#53341A]/40 border-[#CE7F20]/40 text-[#EEDFC7]'
                            : 'bg-[#171719] border-white/[0.05] text-[#9A9288]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-[#0B0B0C] border border-white/[0.08]">
                            <img
                              src={t.coverUrl}
                              alt={t.title}
                              className="w-full h-full object-cover block"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>

                          <div className="min-w-0 flex flex-col justify-center">
                            <p className={`text-xs font-semibold truncate leading-tight ${isActive ? 'text-[#CE7F20]' : 'text-[#EEDFC7]'}`}>
                              {t.title}
                            </p>
                            <p className="text-[11px] text-[#9A9288] truncate mt-0.5">
                              {t.artist} &bull; {t.album}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {onAddToQueue && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToQueue(t);
                              }}
                              className="p-1.5 rounded text-[#68625B]"
                              title="Tambah ke antrian"
                            >
                              <ListPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onToggleLikeTrack && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleLikeTrack(t);
                              }}
                              className={`p-1.5 rounded ${isLiked ? 'text-[#CE7F20]' : 'text-[#68625B]'}`}
                              title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#CE7F20]' : ''}`} />
                            </button>
                          )}
                          <span className="text-[11px] font-mono text-[#68625B]">
                            {formatDuration(t.durationMs)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {deduplicatedLiveMatches.length > 0 && (
                <div className="pt-2 space-y-1">
                  <div className="px-2.5 pb-1 text-[9px] font-semibold uppercase tracking-wider text-[#607938] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-[#607938]" />
                      <span>Online Global</span>
                    </span>
                    <span className="text-[9px] font-mono text-[#68625B]">
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
                        className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg cursor-pointer border ${
                          isActive
                            ? 'bg-[#53341A]/40 border-[#CE7F20]/40 text-[#EEDFC7]'
                            : 'bg-[#171719] border-white/[0.05] text-[#9A9288]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-[#0B0B0C] border border-white/[0.08]">
                            <img
                              src={t.coverUrl}
                              alt={t.title}
                              className="w-full h-full object-cover block"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>

                          <div className="min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs font-semibold truncate leading-tight ${isActive ? 'text-[#CE7F20]' : 'text-[#EEDFC7]'}`}>
                                {t.title}
                              </p>
                              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#607938]/20 text-[#EEDFC7] border border-[#607938]/50 flex-shrink-0">
                                LIVE
                              </span>
                            </div>
                            <p className="text-[11px] text-[#9A9288] truncate mt-0.5">
                              {t.artist} &bull; {t.album}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {onAddToQueue && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToQueue(t);
                              }}
                              className="p-1.5 rounded text-[#68625B]"
                              title="Tambah ke antrian"
                            >
                              <ListPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onToggleLikeTrack && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleLikeTrack(t);
                              }}
                              className={`p-1.5 rounded ${isLiked ? 'text-[#CE7F20]' : 'text-[#68625B]'}`}
                              title={isLiked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#CE7F20]' : ''}`} />
                            </button>
                          )}
                          <span className="text-[11px] font-mono text-[#68625B]">
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
                  <p className="text-sm font-semibold text-[#EEDFC7] mb-1">
                    Tidak ada lagu ditemukan
                  </p>
                  <p className="text-xs text-[#68625B]">
                    Coba kata kunci judul lagu atau nama penyanyi lain.
                  </p>
                </div>
              )}
            </div>

            <div className="px-4 py-2 bg-[#0E0E0F] border-t border-white/[0.07] flex items-center justify-between text-[10px] text-[#68625B]">
              <span>Klik lagu untuk memutar</span>
              <span>ESC untuk menutup</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Search Overlay Drawer */}
      {isMobileSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="md:hidden fixed top-[52px] left-0 right-0 bg-[#121213] border-b border-white/[0.08] p-3.5 z-50 shadow-2xl"
        >
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-[#68625B] pointer-events-none" />
            <input
              ref={mobileInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari judul lagu atau artis..."
              className="w-full h-10 pl-9 pr-9 rounded-lg bg-[#19191B] border border-white/[0.08] text-sm text-[#EEDFC7] placeholder-[#68625B] focus:outline-none focus:border-[#CE7F20]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 text-[#9A9288] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchQuery.trim().length >= 1 && (
            <div className="mt-2.5 bg-[#171719] border border-white/[0.08] rounded-xl overflow-hidden max-h-[55dvh] overflow-y-auto custom-scrollbar p-1.5 space-y-1">
              {localMatches.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectSong(t)}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-lg text-[#EEDFC7] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={t.coverUrl}
                      alt=""
                      className="w-10 h-10 rounded object-cover flex-shrink-0 bg-[#0B0B0C]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate leading-tight">{t.title}</p>
                      <p className="text-[11px] text-[#9A9288] truncate mt-0.5">{t.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {onAddToQueue && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToQueue(t);
                        }}
                        className="p-1.5 rounded text-[#9A9288]"
                        title="Tambah ke antrian"
                        aria-label="Tambah ke antrian"
                      >
                        <ListPlus className="w-4 h-4" />
                      </button>
                    )}
                    <span className="text-[11px] font-mono text-[#68625B]">
                      {formatDuration(t.durationMs)}
                    </span>
                  </div>
                </div>
              ))}

              {deduplicatedLiveMatches.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectSong(t)}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-lg text-[#EEDFC7] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={t.coverUrl}
                      alt=""
                      className="w-10 h-10 rounded object-cover flex-shrink-0 bg-[#0B0B0C]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate leading-tight">{t.title}</p>
                      <p className="text-[11px] text-[#9A9288] truncate mt-0.5">{t.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {onAddToQueue && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToQueue(t);
                        }}
                        className="p-1.5 rounded text-[#9A9288]"
                        title="Tambah ke antrian"
                        aria-label="Tambah ke antrian"
                      >
                        <ListPlus className="w-4 h-4" />
                      </button>
                    )}
                    <span className="text-[11px] font-mono text-[#68625B]">
                      {formatDuration(t.durationMs)}
                    </span>
                  </div>
                </div>
              ))}

              {totalMatches === 0 && (
                <div className="py-6 text-center text-xs text-[#68625B]">
                  {isLoadingLive ? 'Mencari...' : 'Tidak ada lagu ditemukan.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Right Controls: Live Sync, Account & Settings (Desktop only) */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={onConnectFriendSpotify}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
            isFriendConnected
              ? 'bg-[#607938]/20 border-[#607938] text-[#EEDFC7]'
              : 'bg-[#121213] border-white/[0.08] text-[#9A9288]'
          }`}
          title={isFriendConnected ? 'Friend Live Sync aktif' : 'Buka Live Sync Teman'}
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isFriendConnected ? 'bg-[#607938]' : 'bg-[#68625B]'
            }`}
          />
          <span className="truncate max-w-[120px]">
            {friendTrackTitle ? friendTrackTitle : 'Live Sync'}
          </span>
        </button>

        {authUser && (
          <div className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg bg-[#121213] border border-white/[0.08]">
            <div className="w-6 h-6 rounded-md overflow-hidden bg-[#53341A] flex items-center justify-center flex-shrink-0">
              {authUser.avatarUrl ? (
                <img
                  src={authUser.avatarUrl}
                  alt={authUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-semibold text-[#EEDFC7] uppercase">
                  {authUser.name.slice(0, 2)}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-[#EEDFC7] max-w-[100px] truncate">
              {authUser.name}
            </span>
            {onAccountLogout && (
              <button
                onClick={onAccountLogout}
                className="p-1 rounded text-[#9A9288]"
                title={`Keluar (${authUser.email})`}
                aria-label="Keluar akun"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {isAuthenticated ? (
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg bg-[#19191B] text-[#EEDFC7] text-xs font-medium border border-white/[0.08]"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg bg-[#121213] text-[#9A9288] border border-white/[0.08]"
            title="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#121213] border border-white/[0.09] rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <h3 className="font-semibold text-base text-[#EEDFC7]">Pengaturan Kasatune</h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-[#9A9288] text-sm"
              >
                &times;
              </button>
            </div>

            {authUser && (
              <div className="p-3 rounded-lg bg-[#19191B] border border-white/[0.07] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#53341A] flex items-center justify-center flex-shrink-0">
                    {authUser.avatarUrl ? (
                      <img
                        src={authUser.avatarUrl}
                        alt={authUser.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-[#EEDFC7] uppercase">
                        {authUser.name.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#EEDFC7] truncate">{authUser.name}</p>
                    <p className="text-[11px] text-[#9A9288] truncate">{authUser.email}</p>
                  </div>
                </div>
                {onAccountLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onAccountLogout();
                    }}
                    className="h-8 px-3 rounded-lg border border-white/[0.1] text-xs font-medium text-[#EEDFC7] flex items-center gap-1.5 flex-shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[#CE7F20]" />
                    <span>Keluar</span>
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#9A9288] uppercase font-semibold text-[11px] mb-1.5">
                  Spotify Client ID (Opsional)
                </label>
                <input
                  type="text"
                  value={tempClientId}
                  onChange={(e) => setTempClientId(e.target.value)}
                  placeholder="Paste Spotify Client ID..."
                  className="w-full p-2.5 rounded-lg bg-[#0B0B0C] border border-white/[0.08] text-[#EEDFC7] focus:outline-none focus:border-[#CE7F20]"
                />
              </div>

              <div className="bg-[#0B0B0C] p-3 rounded-lg border border-white/[0.07] space-y-1 text-[#9A9288]">
                <p className="font-semibold text-[#EEDFC7]">Redirect URI:</p>
                <code className="text-[11px] text-[#CE7F20] block select-all break-all">
                  {currentRedirectUri}
                </code>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-[#9A9288]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#CE7F20] text-[#0B0B0C] font-semibold"
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
