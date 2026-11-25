/**
 * FriendSpotifyCard Component (Discord Spotify Rich Presence & Multi-Friend Switcher)
 * Features:
 * - Multi-Friend Selector: Instant 1-click switching between Friend A (JuraganBengkel), Friend B (Len), Friend C (NeoNekooo), or custom Discord ID
 * - Real-time Live Status: Pulsing green dot for friends actively listening to Spotify, gray for idle
 * - Mode Switcher: Smooth toggle between [🟢 Live Sync Teman] and [🎧 Mode Mandiri (Bebas Putar Musik)]
 * - Standby State: Clear message + 1-click [🎧 Putar Musik Sendiri] to listen to Radiohead / other artists freely
 * - Disconnected Mode: Clean stage with 1-click [🟢 Sambungkan Kembali Live Sync]
 */

import React, { useState } from 'react';
import {
  ExternalLink,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  MessageSquare,
  Check,
  X,
  Radio,
  Music2,
  Moon,
  Headphones,
  ChevronDown,
} from 'lucide-react';
import type { FriendPlaybackState, FriendLiveInfo } from '../hooks/useFriendSpotify';
import { KNOWN_FRIENDS } from '../hooks/useFriendSpotify';
import { formatTime } from '../utils/lrcParser';

interface FriendSpotifyCardProps {
  playbackState: FriendPlaybackState | null;
  liveProgressMs: number;
  isLoading: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  discordUserId?: string;
  friendsLiveMap?: Record<string, FriendLiveInfo>;
  onSetDiscordUserId?: (id: string) => void;
  onConnectSpotify: () => void;
  onRefresh: () => void;
  onToggleConnect: () => void;
  onSwitchToMyMusic?: () => void;
}

export const FriendSpotifyCard: React.FC<FriendSpotifyCardProps> = ({
  playbackState,
  liveProgressMs,
  isLoading,
  isConnecting,
  isConnected,
  discordUserId = '519781597155950602',
  friendsLiveMap = {},
  onSetDiscordUserId = () => {},
  onConnectSpotify,
  onRefresh,
  onToggleConnect,
  onSwitchToMyMusic,
}) => {
  const [isEditingDiscord, setIsEditingDiscord] = useState(false);
  const [inputDiscordId, setInputDiscordId] = useState(discordUserId);
  const [isSliderOpen, setIsSliderOpen] = useState(false); // Default TUTUP sesuai permintaan user

  const track = playbackState?.track;
  const isPlaying = Boolean(playbackState?.isPlaying && track);
  const durationMs = track?.durationMs || 296000;
  const progressRatio = Math.max(0, Math.min(1, liveProgressMs / durationMs));

  const handleSaveDiscordId = () => {
    onSetDiscordUserId(inputDiscordId);
    setIsEditingDiscord(false);
  };

  const handleSelectPreset = (id: string) => {
    setInputDiscordId(id);
    onSetDiscordUserId(id);
  };

  // Find active friend preset info if available
  const activePreset = KNOWN_FRIENDS.find((f) => f.id === discordUserId);
  const activeAvatar = playbackState?.avatarUrl || activePreset?.avatarUrl;
  const activeName = playbackState?.friendName || activePreset?.name || 'Teman';

  return (
    <div className="mx-3 mb-2 rounded-xl bg-[#110F0E] border border-white/[0.07] shadow-md select-none transition-all overflow-hidden flex flex-col">
      {/* Show/Hide Collapsible Slider Toggle Header (Default Closed) */}
      <div
        onClick={() => setIsSliderOpen((v) => !v)}
        className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex-shrink-0">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-[#FF6B2B]' : 'text-[#8A817A]'}`} />
            {isConnected && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#FF6B2B] animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="text-xs font-bold text-[#FAF6F2] truncate group-hover:text-[#FFA14A] transition-colors">
              Pilih Teman (Live Sync)
            </span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                isConnected
                  ? 'bg-[#FF6B2B]/15 text-[#FF8A4C] border border-[#FF6B2B]/35'
                  : 'bg-[#1D1A17] text-[#8A817A] border border-white/[0.07]'
              }`}
            >
              {isConnected ? 'LIVE' : 'STANDBY'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[#8C929C] group-hover:text-white transition-colors">
          <span className="text-[10px] font-medium">
            {isSliderOpen ? 'Tutup' : 'Buka'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
              isSliderOpen ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </div>
      </div>

      {/* Collapsible Slider Body */}
      {isSliderOpen && (
        <div className="p-2.5 pt-1.5 border-t border-[#1F2228] flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* 1. Multi-Friend Switcher Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#949BA4]">
                Pilihan Akun Teman
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={onRefresh}
                  className="p-1 rounded text-[#949BA4] hover:text-white hover:bg-[#1C1E22] transition-colors"
                  title="Refresh Lanyard session"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={() => setIsEditingDiscord((p) => !p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors flex items-center gap-1 ${
                    isEditingDiscord
                      ? 'bg-[#5865F2] border-[#5865F2] text-white'
                      : 'bg-[#1C1E22] border-[#282B32] text-[#949BA4] hover:text-white'
                  }`}
                  title="Masukkan Discord User ID kustom"
                >
                  <MessageSquare className="w-2.5 h-2.5" />
                  <span>+ Custom ID</span>
                </button>
              </div>
            </div>

        {/* Friend Selector Tabs - Clean Responsive Cards with full readable names */}
        <div className="grid grid-cols-3 gap-1.5">
          {KNOWN_FRIENDS.map((f) => {
            const isSelected = discordUserId === f.id;
            const live = friendsLiveMap[f.id];
            const isFriendPlaying = Boolean(live?.isListening);

            return (
              <button
                key={f.id}
                onClick={() => handleSelectPreset(f.id)}
                className={`p-2 rounded-xl border text-left transition-colors flex flex-col gap-1.5 relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#FF6B2B]/15 border-[#FF6B2B] ring-1 ring-[#FF6B2B]/40'
                    : 'bg-[#171412] border-white/[0.07] hover:bg-[#1E1A17] hover:border-white/[0.15]'
                }`}
                title={`Pilih ${f.name} (@${f.username}) - ${f.tag}`}
              >
                <div className="flex items-center justify-between">
                  <div className="relative flex-shrink-0">
                    <img
                      src={f.avatarUrl}
                      alt={f.name}
                      className="w-6 h-6 rounded-md object-cover bg-[#0A0908]"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#110F0E] ${
                        isFriendPlaying ? 'bg-[#FF6B2B]' : 'bg-[#756E68]'
                      }`}
                    />
                  </div>

                  <span
                    className={`text-[8px] font-mono px-1 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isSelected
                        ? 'bg-[#FF6B2B] text-[#0A0908]'
                        : isFriendPlaying
                        ? 'bg-[#FF6B2B]/20 text-[#FF8A4C]'
                        : 'bg-[#26221F] text-[#9E958D]'
                    }`}
                  >
                    {isSelected ? 'AKTIF' : isFriendPlaying ? 'PLAY' : 'IDLE'}
                  </span>
                </div>

                <div className="min-w-0 w-full">
                  <p
                    className="text-xs font-semibold text-[#FAF6F2] truncate leading-tight"
                    title={f.name}
                  >
                    {f.name}
                  </p>
                  <p className="text-[10px] text-[#9E958D] truncate leading-tight pt-0.5">
                    {f.tag}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Switcher Segmented Control */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0A0908] border border-white/[0.07] text-xs font-medium gap-1">
        <button
          onClick={() => {
            if (!isConnected) onToggleConnect();
          }}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            isConnected
              ? 'bg-[#FF6B2B]/15 border border-[#FF6B2B]/35 text-[#FF8A4C] font-semibold'
              : 'text-[#9E958D] hover:text-white border border-transparent'
          }`}
          title="Sinkronkan pemutaran dengan lagu teman secara real-time"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-[#FF6B2B]' : 'bg-[#756E68]'
            }`}
          />
          <span>Live Sync Teman</span>
        </button>

        <button
          onClick={() => {
            if (isConnected) onToggleConnect();
          }}
          className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            !isConnected
              ? 'bg-[#282B32] border border-[#3E4249] text-white font-semibold'
              : 'text-[#949BA4] hover:text-white border border-transparent'
          }`}
          title="Bebas memutar musik sendiri tanpa sinkronisasi teman"
        >
          <Headphones className="w-3.5 h-3.5 text-[#949BA4]" />
          <span>Mode Mandiri</span>
        </button>
      </div>

      {/* Custom Discord User ID Form */}
      {isEditingDiscord && (
        <div className="p-2.5 rounded-lg bg-[#141619] border border-[#5865F2]/40 flex flex-col gap-2 text-xs">
          <div className="text-[#949BA4] leading-tight">
            Masukkan <b>Discord User ID</b> teman baru kamu:
          </div>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={inputDiscordId}
              onChange={(e) => setInputDiscordId(e.target.value)}
              placeholder="Contoh: 519781597155950602"
              className="flex-1 bg-[#0E1013] border border-[#282B32] rounded px-2.5 py-1 text-white text-xs font-mono outline-none focus:border-[#5865F2]"
            />
            <button
              onClick={handleSaveDiscordId}
              className="px-2.5 py-1 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded font-bold transition-colors flex items-center"
              title="Simpan ID"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsEditingDiscord(false)}
              className="p-1 text-[#656A74] hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="text-[10px] text-[#656A74]">
            *Teman kamu harus join server <b>discord.gg/lanyard</b> sekali saja.
          </div>
        </div>
      )}

      {/* 2. State Cards (Disconnected / Playing / Standby) */}
      {!isConnected ? (
        /* Disconnected / Autonomous Mode Card */
        <div className="p-3 rounded-lg bg-[#141619] border border-[#282B32] flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#1C1E22] border border-[#282B32] flex items-center justify-center text-[#949BA4] flex-shrink-0 mt-0.5">
              <Headphones className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Mode Mandiri Aktif</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#282B32] text-[#949BA4] font-semibold">
                  STANDALONE
                </span>
              </div>
              <p className="text-xs text-[#949BA4] leading-relaxed pt-1">
                Kamu bebas memutar Radiohead &amp; album artis lain tanpa terikat playlist teman.
              </p>
            </div>
          </div>

          <button
            onClick={onToggleConnect}
            className="w-full h-8 px-3 rounded-xl bg-gradient-to-r from-[#FF6B2B] to-[#FF8A3D] hover:brightness-110 text-[#0A0908] text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            title="Sambungkan kembali ke Live Sync teman"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Sambungkan Kembali Live Sync</span>
          </button>
        </div>
      ) : (
        /* Connected Mode Card */
        <div className="p-2.5 rounded-xl bg-[#171412] border border-white/[0.07] flex flex-col gap-2">
          {/* Active Friend Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {activeAvatar ? (
                <img
                  src={activeAvatar}
                  alt={activeName}
                  className="w-7 h-7 rounded-lg object-cover border border-white/[0.08] flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#FF6B2B] flex items-center justify-center text-xs font-bold text-[#0A0908] flex-shrink-0">
                  {activeName.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex flex-col justify-center">
                <span className="text-[11px] font-bold text-[#FAF6F2] truncate leading-tight" title={activeName}>
                  {activeName}
                </span>
                <span className="text-[9px] text-[#9E958D] truncate leading-none pt-0.5">
                  {isPlaying ? 'Mendengarkan di Spotify' : 'Standby / Tidak memutar lagu'}
                </span>
              </div>
            </div>

            <span
              className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${
                isPlaying
                  ? 'bg-[#FF6B2B]/15 text-[#FF8A4C] border border-[#FF6B2B]/35'
                  : 'bg-[#26221F] text-[#9E958D]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPlaying ? 'bg-[#FF6B2B] animate-ping' : 'bg-[#756E68]'
                }`}
              />
              <span>{isPlaying ? 'PLAYING' : 'STANDBY'}</span>
            </span>
          </div>

          {/* Condition 1: Friend Playing Song */}
          {isPlaying && track ? (
            <div className="pt-1 flex flex-col gap-1.5 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 min-w-0">
                {track.coverUrl && (
                  <div className="w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-lg overflow-hidden bg-[#0A0908] border border-white/[0.08] flex-shrink-0">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                      className="w-full h-full object-cover block"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#FAF6F2] truncate leading-tight hover:text-[#FFA14A]">
                    {track.title}
                  </p>
                  <p className="text-[10px] text-[#9E958D] truncate">
                    {track.artist} &bull; {track.album}
                  </p>
                </div>
                {track.spotifyUrl && (
                  <a
                    href={track.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#756E68] hover:text-[#FF6B2B] p-1 transition-colors flex-shrink-0"
                    title="Open on Spotify"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="space-y-1 pt-0.5">
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF6B2B] to-[#FFA14A] transition-all duration-200"
                    style={{ width: `${progressRatio * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#756E68]">
                  <span className="text-[#FFA14A] font-semibold">
                    {formatTime(liveProgressMs)}
                  </span>
                  <span>{formatTime(durationMs)}</span>
                </div>
              </div>

              <button
                onClick={onToggleConnect}
                className="w-full h-7 px-2 mt-0.5 rounded-lg bg-[#FF6B2B]/15 border border-[#FF6B2B]/35 hover:bg-[#FF6B2B]/25 text-[#FF8A4C] text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                title="Klik untuk disconnect & beralih ke musik mandiri"
              >
                <CheckCircle2 className="w-3 h-3 text-[#FF6B2B]" />
                <span>Connected (Live Sync) &bull; Klik Disconnect</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 flex flex-col gap-2 border-t border-white/[0.06]">
              <div className="flex items-start gap-2 text-[#A8A099]">
                <Moon className="w-4 h-4 text-[#FFA14A] flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 text-[10px] leading-snug">
                  <span className="text-[#FAF6F2] font-semibold">{activeName}</span> sedang tidak memutar lagu.
                  <span className="text-[#756E68] block pt-0.5">
                    Kasatune standby &amp; siap sinkron otomatis begitu lagu diputar.
                  </span>
                </div>
              </div>

              <button
                onClick={onSwitchToMyMusic || onToggleConnect}
                className="w-full h-8 px-3 rounded-xl bg-[#FF6B2B]/15 hover:bg-[#FF6B2B]/25 border border-[#FF6B2B]/35 text-[#FFA14A] text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                title="Beralih ke mode mandiri dan putar lagu dari koleksi kamu"
              >
                <Music2 className="w-3.5 h-3.5 text-[#FF6B2B]" />
                <span>Putar Musik Sendiri</span>
              </button>

              <button
                onClick={onToggleConnect}
                className="w-full h-7 px-2 rounded-lg bg-[#151210] border border-white/[0.07] hover:border-white/20 text-[#A8A099] hover:text-white text-[9.5px] font-medium flex items-center justify-center gap-1 transition-all"
                title="Disconnect dari sesi standby teman"
              >
                <X className="w-2.5 h-2.5 text-[#756E68]" />
                <span>Putuskan Sambungan (Disconnect)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )}
</div>
  );
};
