/**
 * Navbar Component (Spotify Desktop Top Bar)
 * Seamless top navigation with history arrows, search input, Go backend status pill, and controls.
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Settings, RefreshCw, CheckCircle2, Radio } from 'lucide-react';

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
    <header className="h-14 w-full bg-[#000000] px-4 flex items-center justify-between gap-4 select-none z-30">
      {/* Left: Spotify History Arrows & Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <button
            className="w-8 h-8 rounded-full bg-[#0A0A0A] text-[#B3B3B3] hover:text-white flex items-center justify-center transition-colors"
            title="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="w-8 h-8 rounded-full bg-[#0A0A0A] text-[#B3B3B3] hover:text-white flex items-center justify-center transition-colors"
            title="Forward"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Pill */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-7 h-7 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-black">
            <Radio className="w-4 h-4 fill-black stroke-black" />
          </div>
          <span className="font-extrabold text-sm text-white tracking-tight hidden sm:inline">
            Webtify
          </span>
          <span className="text-[10px] font-bold text-[#1DB954] uppercase tracking-wider bg-[#1f1f1f] px-2 py-0.5 rounded-full hidden md:inline">
            Radiohead
          </span>
        </div>
      </div>

      {/* Center: Spotify Search Bar */}
      <div className="flex-1 max-w-md relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-[#B3B3B3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="What Radiohead song do you want to play?"
            className="w-full h-10 pl-10 pr-4 rounded-full bg-[#1F1F1F] hover:bg-[#282828] focus:bg-[#282828] text-xs text-white placeholder-[#B3B3B3] focus:outline-none focus:ring-2 focus:ring-white transition-all"
          />
        </div>
      </div>

      {/* Right: Go Backend Status & Account Controls */}
      <div className="flex items-center gap-2.5">
        {/* Backend Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1F1F1F] text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendOnline ? 'bg-[#1DB954] shadow-[0_0_8px_#1DB954]' : 'bg-[#FEE75C]'
            }`}
          />
          <span className="text-[#B3B3B3] font-semibold text-[11px] hidden sm:inline">
            {isBackendOnline ? 'Go API :8080' : 'Offline Mode'}
          </span>
        </div>

        {/* Sync/Scrape Button */}
        <button
          onClick={onRefreshBackend}
          disabled={isLoading}
          className="p-2 rounded-full bg-[#1F1F1F] hover:bg-[#282828] text-[#B3B3B3] hover:text-white transition-colors"
          title="Sync latest tracks from Go Backend"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#1DB954]' : ''}`} />
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-full bg-[#1F1F1F] hover:bg-[#282828] text-[#B3B3B3] hover:text-white transition-colors"
          title="Spotify Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Spotify Connect / Logout Button */}
        {isAuthenticated ? (
          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 rounded-full bg-[#1F1F1F] hover:bg-[#282828] text-xs font-bold text-white transition-all"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={onLogin}
            className="px-4 py-1.5 rounded-full bg-white hover:scale-105 active:scale-95 text-black text-xs font-bold transition-all shadow-md"
          >
            Log in
          </button>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#242424] rounded-2xl shadow-2xl p-6 text-white border border-[#333]">
            <div className="flex items-center justify-between pb-3 border-b border-[#333]">
              <h3 className="font-bold text-sm">Spotify Settings</h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-[#B3B3B3] hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                  Spotify Client ID (Optional)
                </label>
                <input
                  type="text"
                  value={tempClientId}
                  onChange={(e) => setTempClientId(e.target.value)}
                  placeholder="Paste your Spotify Client ID..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#121212] border border-[#333] text-xs text-white focus:outline-none focus:border-[#1DB954]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                  Redirect URI
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentRedirectUri}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#121212] border border-[#333] text-xs text-[#B3B3B3] font-mono select-all"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-full bg-[#1F1F1F] hover:bg-[#282828] text-xs font-bold text-[#B3B3B3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1DB954] hover:bg-[#1ED760] text-xs font-bold text-black flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
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
