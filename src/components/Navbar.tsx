/**
 * Navbar Component (Discord x Spotify Top Bar)
 * Deep obsidian dark surfaces with vibrant Ice Blue (#BFE7EA) and Kasatune Sunset accents:
 * - Kasatune brand pill with Ice Blue channel marker
 * - Discord-style search bar with Ctrl+K shortcut hint
 * - Go backend health status badge & settings modal
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  RefreshCw,
  Music2,
  Hash,
} from 'lucide-react';

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
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempClientId, setTempClientId] = useState(clientId);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSetClientId(tempClientId);
    setIsSettingsOpen(false);
  };

  const currentRedirectUri = window.location.origin + window.location.pathname;

  return (
    <header className="h-14 w-full bg-[#0B0C0E] border-b border-[#282B32] px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 select-none z-30">
      {/* Left: History Arrows (Desktop only) & Kasatune Brand */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div className="hidden md:flex items-center gap-1">
          <button
            className="w-7 h-7 rounded-md bg-[#141619] hover:bg-[#1C1E22] text-[#A0A5AD] hover:text-white flex items-center justify-center transition-colors border border-[#282B32]/60"
            title="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            className="w-7 h-7 rounded-md bg-[#141619] hover:bg-[#1C1E22] text-[#A0A5AD] hover:text-white flex items-center justify-center transition-colors border border-[#282B32]/60"
            title="Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Authentic Music Brand Logo (No AI Slop) */}
        <div className="flex items-center gap-2 md:gap-2.5">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#1DB954] flex items-center justify-center text-black shadow-sm flex-shrink-0">
            <Music2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm text-white tracking-tight leading-none">
              Kasatune
            </span>
            <span className="hidden md:inline text-[10px] text-[#949BA4] font-medium leading-tight pt-0.5">
              Music Studio
            </span>
          </div>
        </div>
      </div>

      {/* Mobile View Switcher (Visible on < md) */}
      <div className="flex md:hidden items-center p-0.5 rounded-lg bg-[#141619] border border-[#282B32] text-xs">
        <button
          onClick={() => onSelectMobileView('player')}
          className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
            mobileView === 'player' ? 'bg-[#282B32] text-white shadow-sm' : 'text-[#949BA4]'
          }`}
        >
          Lagu
        </button>
        <button
          onClick={() => onSelectMobileView('lyrics')}
          className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
            mobileView === 'lyrics' ? 'bg-[#282B32] text-white shadow-sm' : 'text-[#949BA4]'
          }`}
        >
          Lirik
        </button>
        <button
          onClick={() => onSelectMobileView('sidebar')}
          className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
            mobileView === 'sidebar' ? 'bg-[#282B32] text-white shadow-sm' : 'text-[#949BA4]'
          }`}
        >
          Koleksi
        </button>
      </div>

      {/* Center: Search Bar with clean minimalist styling (Desktop) */}
      <div className="hidden md:flex flex-1 max-w-md relative">
        <div className="w-full relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-[#949BA4]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search songs, artists, albums..."
            className="w-full h-8 pl-9 pr-14 rounded-md bg-[#141619] hover:bg-[#1C1E22] focus:bg-[#1C1E22] border border-[#282B32] focus:border-[#BFE7EA] text-xs text-white placeholder-[#656A74] focus:outline-none transition-colors"
          />
          <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-[#949BA4] bg-[#0B0C0E] border border-[#282B32] rounded">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right Controls: Desktop full status & settings, Mobile single sleek icon button */}
      <div className="hidden md:flex items-center gap-2">
        {/* Friend Live Status Pill (Simplified, No Neon AI Glare) */}
        <div
          onClick={onConnectFriendSpotify}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#141619] border border-[#282B32] hover:border-[#383C45] text-xs cursor-pointer hover:bg-[#1C1E22] transition-colors"
          title={
            isFriendConnected
              ? 'Friend Spotify is connected'
              : 'Click to connect Friend Spotify'
          }
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isFriendConnected ? 'bg-[#1DB954]' : 'bg-[#656A74]'
            }`}
          />
          <span className="font-semibold text-[11px] text-[#A0A5AD] truncate max-w-[130px]">
            {friendTrackTitle ? friendTrackTitle : 'Spotify Live'}
          </span>
        </div>

        {/* Backend Status Pill (Clean, No Glow) */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#141619] border border-[#282B32] text-xs cursor-pointer hover:bg-[#1C1E22] transition-colors"
          title="Click to re-ping Go Backend"
          onClick={onRefreshBackend}
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isBackendOnline ? 'bg-[#23A55A]' : 'bg-[#FEE75C]'
            }`}
          />
          <span className="font-semibold text-[11px] text-[#A0A5AD]">
            {isBackendOnline ? 'Go API Online' : 'Connecting'}
          </span>
          <RefreshCw
            className={`w-3 h-3 text-[#A0A5AD] ${isLoading ? 'animate-spin' : ''}`}
          />
        </div>

        {/* Settings Button (Desktop) */}
        {isAuthenticated ? (
          <button
            onClick={onLogout}
            className="px-2.5 py-1 rounded-md bg-[#1C1E22] hover:bg-[#ED4245] text-white text-xs font-semibold transition-colors border border-[#282B32]"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-2.5 py-1 rounded-md bg-[#141619] hover:bg-[#1C1E22] text-[#A0A5AD] hover:text-white border border-[#282B32] text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        )}
      </div>

      {/* Mobile Right: Single Sleek Status & Settings Icon Button */}
      <div className="flex md:hidden items-center flex-shrink-0">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-8 h-8 rounded-lg bg-[#141619] hover:bg-[#1C1E22] border border-[#282B32] flex items-center justify-center text-[#A0A5AD] hover:text-white transition-colors relative"
          title="Kasatune Settings & Connection"
        >
          <Settings className="w-4 h-4" />
          <span
            className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
              isBackendOnline ? 'bg-[#23A55A]' : 'bg-[#FEE75C]'
            }`}
          />
        </button>
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
