/**
 * TrackListSidebar Component (Discord Channel & Queue Drawer)
 * Deep obsidian dark surfaces with vibrant Ice Blue (#BFE7EA) channel indicators:
 * - Server title with verified badge
 * - Channel list (# all-songs, # pablo-honey, etc.)
 * - Instant play track items with glowing Ice Blue equalizer
 * - Discord User Voice Presence footer
 */

import React from 'react';
import {
  Hash,
  Volume2,
  Headphones,
  Mic,
  ChevronDown,
} from 'lucide-react';
import type { BackendRadioheadTrack } from '../api/backend';
import type { AlbumFilterType } from './DiscordServerRail';
import type { FriendPlaybackState } from '../hooks/useFriendSpotify';
import { FriendSpotifyCard } from './FriendSpotifyCard';

interface TrackListSidebarProps {
  tracks: BackendRadioheadTrack[];
  activeTrackId: string;
  onSelectTrack: (track: BackendRadioheadTrack) => void;
  isPlaying: boolean;
  searchFilter: string;
  activeAlbum: AlbumFilterType;
  onSelectAlbum: (album: AlbumFilterType) => void;
  friendPlayback?: FriendPlaybackState | null;
  friendLiveProgressMs?: number;
  isLoadingFriend?: boolean;
  isConnectingFriend?: boolean;
  isFriendSyncConnected?: boolean;
  onConnectFriendSpotify?: () => void;
  onRefreshFriendSpotify?: () => void;
  onListenAlong?: (trackTitle: string, progressMs: number) => void;
  onToggleFriendSync?: () => void;
}

export const TrackListSidebar: React.FC<TrackListSidebarProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  isPlaying,
  searchFilter,
  activeAlbum,
  friendPlayback = null,
  friendLiveProgressMs = 0,
  isLoadingFriend = false,
  isConnectingFriend = false,
  isFriendSyncConnected = true,
  onConnectFriendSpotify = () => {},
  onRefreshFriendSpotify = () => {},
  onListenAlong = () => {},
  onToggleFriendSync = () => {},
}) => {
  const filteredTracks = tracks.filter((t) => {
    const isFriendTrack =
      t.artist.toLowerCase().includes('liella') ||
      t.album.toLowerCase().includes('shine') ||
      t.album.toLowerCase().includes('mirai') ||
      t.album.toLowerCase().includes('overlord') ||
      t.album.toLowerCase().includes('hideri') ||
      t.album.toLowerCase().includes('book') ||
      t.album.toLowerCase().includes('負け犬') ||
      t.artist.toLowerCase() === 'oxt' ||
      t.artist.toLowerCase() === 'yorushika' ||
      t.artist.toLowerCase().includes('kanaria') ||
      t.artist.toLowerCase() === 'yoasobi' ||
      t.artist.toLowerCase() === 'eve' ||
      t.artist.toLowerCase().includes('roselia') ||
      t.title.toLowerCase().includes('proud of oneself');

    const matchesAlbum =
      activeAlbum === 'friend'
        ? isFriendTrack
        : activeAlbum === 'all'
        ? true
        : !isFriendTrack && t.album.toLowerCase() === activeAlbum.toLowerCase();

    const q = searchFilter.toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.mood.toLowerCase().includes(q);

    return matchesAlbum && matchesSearch;
  });

  return (
    <aside className="w-64 sm:w-72 h-full bg-[#111215] border-r border-[#282B32] flex flex-col overflow-hidden select-none flex-shrink-0">
      {/* Top Discord Server Title Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#282B32] bg-[#141619] hover:bg-[#1C1E22] transition-colors cursor-pointer shadow-sm">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-extrabold text-sm text-white tracking-tight truncate">
            {activeAlbum === 'friend'
              ? "Hideri's Spotify (Live)"
              : activeAlbum === 'all'
              ? 'Radiohead Masters'
              : activeAlbum}
          </span>
          <span
            className={`w-4 h-4 rounded-md text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
              activeAlbum === 'friend'
                ? 'bg-[#1DB954] text-black shadow-[0_0_8px_#1DB954]'
                : 'bg-[#BFE7EA] text-[#0B0C0E] shadow-[0_0_8px_#BFE7EA]'
            }`}
          >
            ✓
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-[#A0A5AD]" />
      </div>

      {/* Channel Category Header */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#656A74] px-1">
          <span>Channels &amp; Tracks</span>
          <span className="font-mono text-[10px] text-[#BFE7EA] font-semibold">
            {filteredTracks.length} ready
          </span>
        </div>
      </div>

      {/* Track List as Discord Channels */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 custom-scrollbar">
        {filteredTracks.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#656A74]">
            No tracks found in this category
          </div>
        ) : (
          filteredTracks.map((track) => {
            const isActive = track.id === activeTrackId;

            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className={`group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#1C1E22] text-white shadow-sm'
                    : 'hover:bg-[#18191D] text-[#A0A5AD] hover:text-[#F2F3F5]'
                }`}
              >
                {/* Channel Icon or Equalizer */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex-shrink-0 flex items-center justify-center">
                    {isActive && isPlaying ? (
                      <Volume2 className="w-4 h-4 text-[#BFE7EA] animate-pulse drop-shadow-[0_0_8px_#BFE7EA]" />
                    ) : (
                      <Hash
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-[#BFE7EA]' : 'text-[#656A74] group-hover:text-[#A0A5AD]'
                        }`}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex flex-col justify-center">
                    <p
                      className={`text-xs font-bold truncate leading-tight ${
                        isActive ? 'text-[#BFE7EA]' : 'text-[#E0E2E5]'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-[10px] text-[#656A74] truncate">
                      {track.album}
                    </p>
                  </div>
                </div>

                {/* Right Disc Indicator */}
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#BFE7EA] shadow-[0_0_8px_#BFE7EA] flex-shrink-0" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Real-time Friend Spotify Presence Card */}
      <FriendSpotifyCard
        playbackState={friendPlayback}
        liveProgressMs={friendLiveProgressMs}
        isLoading={isLoadingFriend}
        isConnecting={isConnectingFriend}
        isConnected={isFriendSyncConnected}
        onConnectSpotify={onConnectFriendSpotify}
        onRefresh={onRefreshFriendSpotify}
        onToggleConnect={onToggleFriendSync}
      />

      {/* Discord User Presence Footer */}
      <div className="h-14 px-3 bg-[#0B0C0E] border-t border-[#282B32] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#E89B5B] to-[#D46743] flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-sm">
            <span>RY</span>
            {/* Discord Online Green Dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#23A55A] border-2 border-[#0B0C0E]" />
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <span className="text-xs font-bold text-white truncate leading-tight">
              Radiohead Fan
            </span>
            <span className="text-[10px] text-[#BFE7EA] truncate leading-none pt-0.5 font-medium">
              Listening to Thom Yorke
            </span>
          </div>
        </div>

        {/* Discord Action Icons */}
        <div className="flex items-center text-[#A0A5AD]">
          <button
            className="p-1 hover:bg-[#1C1E22] hover:text-white rounded transition-colors"
            title="Microphone"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 hover:bg-[#1C1E22] hover:text-white rounded transition-colors"
            title="Headphones"
          >
            <Headphones className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
