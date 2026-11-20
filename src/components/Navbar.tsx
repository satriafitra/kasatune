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
  Radio,
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
    <header className="h-14 w-full bg-[#0B0C0E] border-b border-[#282B32] px-4 flex items-center justify-between gap-4 select-none z-30">
      {/* Left: History Arrows & Kasatune Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
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

        {/* Brand Pill */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E89B5B] to-[#D46743] flex items-center justify-center text-white shadow-[0_2px_12px_rgba(212,103,67,0.45)]">
            <Radio className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-sm text-white tracking-tight">
            Kasatune
          </span>

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-[#BFE7EA] bg-[#141619] border border-[#282B32] px-2 py-0.5 rounded-md shadow-sm">
            <Hash className="w-3 h-3 text-[#BFE7EA]" />
            <span>radiohead-masters</span>
          </div>
        </div>
      </div>

      {/* Center: Search Bar with vibrant Ice Blue search icon */}
      <div className="flex-1 max-w-md relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-[#BFE7EA]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Radiohead songs, albums..."
            className="w-full h-8 pl-9 pr-14 rounded-md bg-[#141619] hover:bg-[#1C1E22] focus:bg-[#1C1E22] border border-[#282B32] focus:border-[#BFE7EA] text-xs text-white placeholder-[#656A74] focus:outline-none focus:ring-1 focus:ring-[#BFE7EA]/50 transition-all shadow-inner"
          />
          <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-[#BFE7EA] bg-[#0B0C0E] border border-[#282B32] rounded shadow-sm">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right: Go Backend Status & Account Controls */}
      <div className="flex items-center gap-2.5">
        {/* Backend Status Pill */}
        <div
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#141619] border border-[#282B32] text-xs cursor-pointer hover:bg-[#1C1E22] transition-colors"
          title="Click to re-ping Go Backend"
          onClick={onRefreshBackend}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendOnline
                ? 'bg-[#23A55A] shadow-[0_0_8px_#23A55A]'
                : 'bg-[#FEE75C] shadow-[0_0_8px_#FEE75C]'
            }`}
          />
          <span className="font-semibold text-[11px] text-[#A0A5AD] hidden sm:inline">
            {isBackendOnline ? 'Go API Online' : 'Connecting'}
          </span>
          <RefreshCw
            className={`w-3 h-3 text-[#BFE7EA] ${isLoading ? 'animate-spin' : ''}`}
          />
        </div>

        {/* Settings Button */}
        {isAuthenticated ? (
          <button
            onClick={onLogout}
            className="px-3 py-1 rounded-md bg-[#1C1E22] hover:bg-[#ED4245] text-white text-xs font-semibold transition-colors border border-[#282B32]"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1 rounded-md bg-[#141619] hover:bg-[#1C1E22] text-[#BFE7EA] border border-[#282B32] hover:border-[#BFE7EA] text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
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
