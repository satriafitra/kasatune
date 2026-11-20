/**
 * FriendSpotifyCard Component (Discord Spotify Rich Presence & Real-Time Sync Hub)
 * Pure passive listener view: displays friend's live Spotify playback in real time.
 * Supports:
 * 1. Discord Live Presence (via Lanyard WebSocket - 100% Free & Automatic, no Spotify Premium required!)
 * 2. Spotify OAuth Web API
 */

import React, { useState } from 'react';
import { ExternalLink, Sparkles, RefreshCw, CheckCircle2, MessageSquare, Check, X } from 'lucide-react';
import type { FriendPlaybackState } from '../hooks/useFriendSpotify';
import { formatTime } from '../utils/lrcParser';

interface FriendSpotifyCardProps {
  playbackState: FriendPlaybackState | null;
  liveProgressMs: number;
  isLoading: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  discordUserId?: string;
  onSetDiscordUserId?: (id: string) => void;
  onConnectSpotify: () => void;
  onRefresh: () => void;
  onToggleConnect: () => void;
}

export const FriendSpotifyCard: React.FC<FriendSpotifyCardProps> = ({
  playbackState,
  liveProgressMs,
  isLoading,
  isConnecting,
  isConnected,
  discordUserId = '',
  onSetDiscordUserId = () => {},
  onConnectSpotify,
  onRefresh,
  onToggleConnect,
}) => {
  const [isEditingDiscord, setIsEditingDiscord] = useState(false);
  const [inputDiscordId, setInputDiscordId] = useState(discordUserId);

  const track = playbackState?.track;
  const isPlaying = Boolean(playbackState?.isPlaying);
  const durationMs = track?.durationMs || 296000;
  const progressRatio = Math.max(0, Math.min(1, liveProgressMs / durationMs));

  const handleSaveDiscordId = () => {
    onSetDiscordUserId(inputDiscordId);
    setIsEditingDiscord(false);
  };

  return (
    <div className="mx-2 mb-2 p-3 rounded-lg bg-[#0E1013] border border-[#282B32] shadow-md flex flex-col gap-2.5 transition-all select-none">
      {/* Top Header: Discord Activity Title & Spotify Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Spotify Activity Indicator */}
          <span className="relative flex h-2 w-2">
            {isPlaying && isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DB954] opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                !isConnected
                  ? 'bg-[#656A74]'
                  : isPlaying
                  ? 'bg-[#1DB954]'
                  : 'bg-[#E89B5B]'
              }`}
            />
          </span>
          <span
            className={`text-[10px] font-black uppercase tracking-wider ${
              !isConnected
                ? 'text-[#656A74]'
                : isPlaying
                ? 'text-[#1DB954]'
                : 'text-[#E89B5B]'
            }`}
          >
            {!isConnected
              ? 'Spotify Disconnected'
              : isPlaying
              ? 'Friend Playing'
              : 'Friend Paused'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            className="p-1 rounded text-[#656A74] hover:text-white hover:bg-[#1C1E22] transition-colors"
            title="Refresh friend session"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <span
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
              !isConnected
                ? 'bg-[#282B32] text-[#A0A5AD]'
                : isPlaying
                ? 'bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40'
                : 'bg-[#E89B5B]/20 text-[#E89B5B] border border-[#E89B5B]/40'
            }`}
          >
            {!isConnected ? 'OFFLINE' : isPlaying ? 'PLAYING' : 'PAUSED'}
          </span>
        </div>
      </div>

      {/* Friend Profile & Playback Device */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative w-7 h-7 rounded-lg bg-[#141619] border border-[#282B32] flex items-center justify-center text-xs font-black text-[#1DB954] flex-shrink-0">
            <span>SP</span>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0B0C0E] ${
                !isConnected
                  ? 'bg-[#656A74]'
                  : isPlaying
                  ? 'bg-[#1DB954]'
                  : 'bg-[#E89B5B]'
              }`}
            />
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <span className="text-[11px] font-bold text-white truncate leading-tight">
              {playbackState?.friendName || 'deriana_'}
            </span>
            <span className="text-[10px] text-[#A0A5AD] truncate leading-none pt-0.5">
              {!isConnected
                ? 'Sync Disconnected'
                : isPlaying
                ? `Listening on ${playbackState?.deviceName || 'Spotify'}`
                : `Paused on ${playbackState?.deviceName || 'Spotify'}`}
            </span>
          </div>
        </div>

        {/* Discord ID Config Button */}
        <button
          onClick={() => setIsEditingDiscord((p) => !p)}
          className={`px-1.5 py-0.5 rounded text-[9px] font-medium border transition-colors flex items-center gap-1 ${
            discordUserId
              ? 'bg-[#5865F2]/20 border-[#5865F2]/40 text-[#7983F5]'
              : 'bg-[#1C1E22] border-[#282B32] text-[#A0A5AD] hover:text-white'
          }`}
          title="Sinkronkan otomatis via Discord (Tanpa perlu Spotify Premium)"
        >
          <MessageSquare className="w-2.5 h-2.5" />
          <span>{discordUserId ? 'Discord Sync' : '+ Discord ID'}</span>
        </button>
      </div>

      {/* Discord User ID Config Form */}
      {isEditingDiscord && (
        <div className="p-2 rounded bg-[#141619] border border-[#5865F2]/40 flex flex-col gap-1.5 text-[10px]">
          <div className="text-[#A0A5AD] leading-tight">
            Masukkan <b>Discord User ID</b> teman kamu agar lagu otomatis berganti setiap detik:
          </div>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={inputDiscordId}
              onChange={(e) => setInputDiscordId(e.target.value)}
              placeholder="Contoh: 482970591234567890"
              className="flex-1 bg-[#0E1013] border border-[#282B32] rounded px-2 py-1 text-white text-[11px] font-mono outline-none focus:border-[#5865F2]"
            />
            <button
              onClick={handleSaveDiscordId}
              className="px-2 py-1 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded font-bold transition-colors flex items-center"
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
          <div className="text-[9px] text-[#656A74]">
            *Teman kamu harus join server <b>discord.gg/lanyard</b> sekali saja.
          </div>
        </div>
      )}

      {/* Currently Playing Track Box */}
      {track ? (
        <div className="p-2 rounded-md bg-[#141619] border border-[#282B32]/70 flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {track.coverUrl && (
              <div className="w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-md overflow-hidden bg-[#0B0C0E] border border-[#282B32] flex-shrink-0">
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  crossOrigin="anonymous"
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
                className={`h-full transition-all duration-200 ${
                  !isConnected
                    ? 'bg-[#656A74]'
                    : isPlaying
                    ? 'bg-gradient-to-r from-[#1DB954] to-[#BFE7EA]'
                    : 'bg-[#E89B5B]'
                }`}
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#656A74]">
              <span className={!isConnected ? 'text-[#656A74]' : isPlaying ? 'text-[#BFE7EA] font-semibold' : 'text-[#E89B5B] font-semibold'}>
                {formatTime(liveProgressMs)}
              </span>
              <span>{formatTime(durationMs)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 text-center text-xs text-[#656A74] bg-[#141619] rounded-md">
          No song detected from friend
        </div>
      )}

      {/* Primary Connection State Button */}
      <div className="pt-0.5">
        {isConnected ? (
          <button
            onClick={onToggleConnect}
            className="w-full h-8 px-3 rounded-lg bg-[#1DB954]/20 border border-[#1DB954]/50 hover:bg-[#1DB954]/30 text-[#1DB954] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm group"
            title="Sesi Spotify teman tersambung secara real-time. Klik untuk disconnect."
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1DB954] group-hover:scale-110 transition-transform" />
            <span>Connected (Live Sync)</span>
          </button>
        ) : (
          <button
            onClick={onConnectSpotify}
            disabled={isConnecting}
            className="w-full h-8 px-3 rounded-lg bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            title="Sambungkan ke akun Spotify teman"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>{isConnecting ? 'Connecting...' : 'Connect to Friend'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
