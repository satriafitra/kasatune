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
    <div className="mx-2 mb-2 p-2.5 rounded-lg bg-[#0E1013] border border-[#282B32] shadow-md flex flex-col gap-2 transition-all select-none">
      {/* 1. Multi-Friend Switcher Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#1DB954]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#949BA4]">
              Pilih Teman (Live Sync)
            </span>
          </div>

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
                className={`p-2 rounded-lg border text-left transition-colors flex flex-col gap-1.5 relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#161B18] border-[#1DB954] ring-1 ring-[#1DB954]/50'
                    : 'bg-[#141619] border-[#282B32] hover:bg-[#1C1E22] hover:border-[#383C45]'
                }`}
                title={`Pilih ${f.name} (@${f.username}) - ${f.tag}`}
              >
                <div className="flex items-center justify-between">
                  <div className="relative flex-shrink-0">
                    <img
                      src={f.avatarUrl}
                      alt={f.name}
                      className="w-6 h-6 rounded-md object-cover bg-[#0B0C0E]"
                    />
                    {/* Live playing beacon */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0E1013] ${
                        isFriendPlaying ? 'bg-[#1DB954]' : 'bg-[#656A74]'
                      }`}
                    />
                  </div>

                  <span
                    className={`text-[8px] font-mono px-1 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isSelected
                        ? 'bg-[#1DB954] text-black'
                        : isFriendPlaying
                        ? 'bg-[#1DB954]/20 text-[#1DB954]'
                        : 'bg-[#282B32] text-[#949BA4]'
                    }`}
                  >
                    {isSelected ? 'AKTIF' : isFriendPlaying ? 'PLAY' : 'IDLE'}
                  </span>
                </div>

                <div className="min-w-0 w-full">
                  <p
                    className="text-xs font-semibold text-white truncate leading-tight"
                    title={f.name}
                  >
                    {f.name}
                  </p>
                  <p className="text-[10px] text-[#949BA4] truncate leading-tight pt-0.5">
                    {f.tag}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Switcher Segmented Control */}
      <div className="grid grid-cols-2 p-1 rounded-lg bg-[#0B0C0E] border border-[#282B32] text-xs font-medium gap-1">
        <button
          onClick={() => {
            if (!isConnected) onToggleConnect();
          }}
          className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            isConnected
              ? 'bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954] font-semibold'
              : 'text-[#949BA4] hover:text-white border border-transparent'
          }`}
          title="Sinkronkan pemutaran dengan lagu teman secara real-time"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-[#1DB954]' : 'bg-[#656A74]'
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
            className="w-full h-8 px-3 rounded-md bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            title="Sambungkan kembali ke Live Sync Spotify teman"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Sambungkan Kembali Live Sync</span>
          </button>
        </div>
      ) : (
        /* Connected Mode Card */
        <div className="p-2.5 rounded-lg bg-[#141619] border border-[#282B32]/80 flex flex-col gap-2">
          {/* Active Friend Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {activeAvatar ? (
                <img
                  src={activeAvatar}
                  alt={activeName}
                  className="w-7 h-7 rounded-lg object-cover border border-[#282B32] flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#5865F2] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {activeName.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex flex-col justify-center">
                <span className="text-[11px] font-bold text-white truncate leading-tight" title={activeName}>
                  {activeName}
                </span>
                <span className="text-[9px] text-[#A0A5AD] truncate leading-none pt-0.5">
                  {isPlaying ? 'Mendengarkan di Spotify' : 'Standby / Tidak memutar lagu'}
                </span>
              </div>
            </div>

            <span
              className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${
                isPlaying
                  ? 'bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40'
                  : 'bg-[#282B32] text-[#A0A5AD]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPlaying ? 'bg-[#1DB954] animate-ping' : 'bg-[#656A74]'
                }`}
              />
              <span>{isPlaying ? 'PLAYING' : 'STANDBY'}</span>
            </span>
          </div>

          {/* Condition 1: Friend Playing Song */}
          {isPlaying && track ? (
            <div className="pt-1 flex flex-col gap-1.5 border-t border-[#282B32]/50">
              <div className="flex items-center gap-2 min-w-0">
                {track.coverUrl && (
                  <div className="w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-md overflow-hidden bg-[#0B0C0E] border border-[#282B32] flex-shrink-0">
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
                  <p className="text-xs font-bold text-white truncate leading-tight hover:text-[#BFE7EA]">
                    {track.title}
                  </p>
                  <p className="text-[10px] text-[#A0A5AD] truncate">
                    {track.artist} &bull; {track.album}
                  </p>
                </div>
                {track.spotifyUrl && (
                  <a
                    href={track.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#656A74] hover:text-[#1DB954] p-1 transition-colors flex-shrink-0"
                    title="Open on Spotify"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Real-time Playtime Scrubber & Live Counter */}
              <div className="space-y-1 pt-0.5">
                <div className="w-full h-1 bg-[#282B32] rounded-md overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#1DB954] to-[#BFE7EA] transition-all duration-200"
                    style={{ width: `${progressRatio * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#656A74]">
                  <span className="text-[#BFE7EA] font-semibold">
                    {formatTime(liveProgressMs)}
                  </span>
                  <span>{formatTime(durationMs)}</span>
                </div>
              </div>

              {/* Live Connected Status Button */}
              <button
                onClick={onToggleConnect}
                className="w-full h-7 px-2 mt-0.5 rounded-md bg-[#1DB954]/15 border border-[#1DB954]/40 hover:bg-[#1DB954]/25 text-[#1DB954] text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                title="Klik untuk disconnect & beralih ke musik mandiri"
              >
                <CheckCircle2 className="w-3 h-3 text-[#1DB954]" />
                <span>Connected (Live Sync) &bull; Klik Disconnect</span>
              </button>
            </div>
          ) : (
            /* Condition 2: Friend Standby / Not Listening */
            <div className="pt-2 flex flex-col gap-2 border-t border-[#282B32]/50">
              <div className="flex items-start gap-2 text-[#A0A5AD]">
                <Moon className="w-4 h-4 text-[#E89B5B] flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 text-[10px] leading-snug">
                  <span className="text-white font-semibold">{activeName}</span> sedang tidak memutar lagu.
                  <span className="text-[#656A74] block pt-0.5">
                    Kasatune standby &amp; siap sinkron otomatis begitu lagu diputar.
                  </span>
                </div>
              </div>

              {/* Action Button: Putar Musik Sendiri (Radiohead / JKT48 / dll) */}
              <button
                onClick={onSwitchToMyMusic || onToggleConnect}
                className="w-full h-8 px-3 rounded-lg bg-gradient-to-r from-[#1C2541] to-[#203A43] hover:from-[#203A43] hover:to-[#2C5364] border border-[#BFE7EA]/40 text-[#BFE7EA] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md group active:scale-95"
                title="Beralih ke mode mandiri dan putar lagu dari koleksi kamu"
              >
                <Music2 className="w-3.5 h-3.5 text-[#BFE7EA] group-hover:scale-110 transition-transform" />
                <span>Putar Musik Sendiri (Radiohead / JKT48 / dll)</span>
              </button>

              {/* Disconnect Standby Button */}
              <button
                onClick={onToggleConnect}
                className="w-full h-7 px-2 rounded-md bg-[#141619] border border-[#282B32] hover:border-[#656A74] text-[#A0A5AD] hover:text-white text-[9.5px] font-medium flex items-center justify-center gap-1 transition-all"
                title="Disconnect dari sesi standby teman"
              >
                <X className="w-2.5 h-2.5 text-[#656A74]" />
                <span>Putuskan Sambungan (Disconnect)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
