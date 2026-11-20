/**
 * FriendSpotifyCard Component (Discord Spotify Rich Presence & Real-Time Playtime Hub)
 * Real-time detection of friend's live Spotify playback with synchronized playtime slider & live play/pause sync.
 */

import React from 'react';
import { Headphones, ExternalLink, Sparkles, RefreshCw, Play, Pause } from 'lucide-react';
import type { FriendPlaybackState } from '../hooks/useFriendSpotify';
import { formatTime } from '../utils/lrcParser';

interface FriendSpotifyCardProps {
  playbackState: FriendPlaybackState | null;
  liveProgressMs: number;
  isLoading: boolean;
  isConnecting: boolean;
  onConnectSpotify: () => void;
  onRefresh: () => void;
  onListenAlong: (trackTitle: string, progressMs: number) => void;
  onToggleFriendPlay?: () => void;
}

export const FriendSpotifyCard: React.FC<FriendSpotifyCardProps> = ({
  playbackState,
  liveProgressMs,
  isLoading,
  isConnecting,
  onConnectSpotify,
  onRefresh,
  onListenAlong,
  onToggleFriendPlay,
}) => {
  const track = playbackState?.track;
  const isConnected = Boolean(playbackState?.isConnected);
  const isPlaying = Boolean(playbackState?.isPlaying);
  const durationMs = track?.durationMs || 266870;
  const progressRatio = Math.max(0, Math.min(1, liveProgressMs / durationMs));

  return (
    <div className="mx-2 mb-2 p-3 rounded-lg bg-[#0E1013] border border-[#282B32] shadow-md flex flex-col gap-2.5 transition-all select-none">
      {/* Top Header: Discord Activity Title & Spotify Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Spotify Green Pulsing Activity Dot */}
          <span className="relative flex h-2 w-2">
            {isPlaying && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DB954] opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isPlaying ? 'bg-[#1DB954]' : 'bg-[#E89B5B]'
              }`}
            />
          </span>
          <span
            className={`text-[10px] font-black uppercase tracking-wider ${
              isPlaying ? 'text-[#1DB954]' : 'text-[#E89B5B]'
            }`}
          >
            {isPlaying ? 'Spotify Live (Playing)' : 'Spotify Live (Paused)'}
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
              isPlaying
                ? 'bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40'
                : 'bg-[#E89B5B]/20 text-[#E89B5B] border border-[#E89B5B]/40'
            }`}
          >
            {isPlaying ? 'ACTIVE' : 'PAUSED'}
          </span>
        </div>
      </div>

      {/* Friend Profile & Playback Target */}
      <div className="flex items-center gap-2">
        <div className="relative w-7 h-7 rounded-lg bg-[#141619] border border-[#282B32] flex items-center justify-center text-xs font-black text-[#1DB954] flex-shrink-0">
          <span>SP</span>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0B0C0E] ${
              isPlaying ? 'bg-[#1DB954]' : 'bg-[#E89B5B]'
            }`}
          />
        </div>

        <div className="min-w-0 flex flex-col justify-center">
          <span className="text-[11px] font-bold text-white truncate leading-tight">
            {playbackState?.friendName || 'Hideri'}
          </span>
          <span className="text-[10px] text-[#A0A5AD] truncate leading-none pt-0.5">
            {isPlaying ? `Listening to ${track?.artist || 'Music'}` : 'Paused on Spotify (Desktop)'}
          </span>
        </div>
      </div>

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
                  isPlaying
                    ? 'bg-gradient-to-r from-[#1DB954] to-[#BFE7EA]'
                    : 'bg-[#E89B5B]'
                }`}
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#656A74]">
              <span className={isPlaying ? 'text-[#BFE7EA] font-semibold' : 'text-[#E89B5B] font-semibold'}>
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

      {/* Action Buttons: Play/Pause Toggle + Listen Along */}
      <div className="flex items-center gap-1.5 pt-0.5">
        {onToggleFriendPlay && (
          <button
            onClick={onToggleFriendPlay}
            className={`h-7 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm border ${
              isPlaying
                ? 'bg-[#1C1E22] text-[#BFE7EA] border-[#282B32] hover:bg-[#282B32]'
                : 'bg-[#1DB954] text-black border-transparent hover:bg-[#1ed760]'
            }`}
            title={isPlaying ? "Simulate Friend Pause" : "Simulate Friend Play"}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>
        )}

        {track && (
          <button
            onClick={() => onListenAlong(track.title, liveProgressMs)}
            className="flex-1 h-7 px-2 rounded-lg bg-[#1C1E22] hover:bg-[#1DB954] text-white hover:text-black text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm border border-[#282B32] hover:border-transparent group"
            title="Listen along with friend at this exact playtime"
          >
            <Headphones className="w-3 h-3 group-hover:scale-110 transition-transform" />
            <span>Sync Player</span>
          </button>
        )}

        {!isConnected && (
          <button
            onClick={onConnectSpotify}
            disabled={isConnecting}
            className="h-7 px-2 rounded-lg bg-gradient-to-r from-[#E89B5B] to-[#D46743] hover:from-[#f0a667] hover:to-[#df734f] text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-sm flex-shrink-0"
            title="Connect Spotify Developer App"
          >
            <Sparkles className="w-3 h-3" />
            <span>{isConnecting ? '...' : 'OAuth'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
