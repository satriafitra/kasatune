/**
 * TrackListSidebar Component (Discord Channel & Queue Drawer)
 * Authentic Discord Channel navigation:
 * - Server title with verified badge
 * - Channel list (# all-songs, # pablo-honey, etc.)
 * - Instant play track items
 * - Discord User Voice Presence footer
 */

import React from 'react';
import {
  Hash,
  Volume2,
  Headphones,
  Mic,
  Music2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import type { BackendRadioheadTrack } from '../api/backend';
import type { AlbumFilterType } from './DiscordServerRail';

interface TrackListSidebarProps {
  tracks: BackendRadioheadTrack[];
  activeTrackId: string;
  onSelectTrack: (track: BackendRadioheadTrack) => void;
  isPlaying: boolean;
  searchFilter: string;
  activeAlbum: AlbumFilterType;
  onSelectAlbum: (album: AlbumFilterType) => void;
}

export const TrackListSidebar: React.FC<TrackListSidebarProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  isPlaying,
  searchFilter,
  activeAlbum,
  onSelectAlbum,
}) => {
  const filteredTracks = tracks.filter((t) => {
    const matchesAlbum = activeAlbum === 'all' || t.album.toLowerCase() === activeAlbum.toLowerCase();
    const q = searchFilter.toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.mood.toLowerCase().includes(q);

    return matchesAlbum && matchesSearch;
  });

  return (
    <aside className="w-64 sm:w-72 h-full bg-[#2B2D31] border-r border-[#383A40]/60 flex flex-col overflow-hidden select-none flex-shrink-0">
      {/* Top Discord Server Title Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#1E1F22] hover:bg-[#35373C] transition-colors cursor-pointer shadow-sm">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-extrabold text-sm text-[#F2F3F5] tracking-tight truncate">
            {activeAlbum === 'all' ? 'Radiohead Masters' : activeAlbum}
          </span>
          <span className="w-3.5 h-3.5 rounded-full bg-[#BFE7EA] text-black text-[9px] font-black flex items-center justify-center flex-shrink-0">
            ✓
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-[#949BA4]" />
      </div>

      {/* Channel Category Header */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#949BA4] px-1">
          <span>Channels &amp; Tracks</span>
          <span className="font-mono text-[10px] text-[#BFE7EA]">
            {filteredTracks.length} ready
          </span>
        </div>
      </div>

      {/* Track List as Discord Channels */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 custom-scrollbar">
        {filteredTracks.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#949BA4]">
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
                    ? 'bg-[#35373C] text-[#F2F3F5] shadow-sm'
                    : 'hover:bg-[#313338] text-[#949BA4] hover:text-[#DBDEE1]'
                }`}
              >
                {/* Channel Icon or Equalizer */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex-shrink-0 flex items-center justify-center">
                    {isActive && isPlaying ? (
                      <Volume2 className="w-4 h-4 text-[#BFE7EA] animate-pulse" />
                    ) : (
                      <Hash
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-[#E89B5B]' : 'text-[#80848E] group-hover:text-[#949BA4]'
                        }`}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex flex-col justify-center">
                    <p
                      className={`text-xs font-bold truncate leading-tight ${
                        isActive ? 'text-[#FFEAD3]' : 'text-[#DBDEE1]'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-[10px] text-[#949BA4] truncate">
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

      {/* Discord User Presence Footer */}
      <div className="h-14 px-3 bg-[#232428] border-t border-[#1E1F22] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#E89B5B] to-[#BFE7EA] flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
            <span>RY</span>
            {/* Discord Online Green Dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#23A55A] border-2 border-[#232428]" />
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <span className="text-xs font-bold text-[#F2F3F5] truncate leading-tight">
              Radiohead Fan
            </span>
            <span className="text-[10px] text-[#949BA4] truncate leading-none pt-0.5">
              Listening to Thom Yorke
            </span>
          </div>
        </div>

        {/* Discord Action Icons */}
        <div className="flex items-center text-[#949BA4]">
          <button
            className="p-1 hover:bg-[#35373C] hover:text-[#F2F3F5] rounded transition-colors"
            title="Microphone"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 hover:bg-[#35373C] hover:text-[#F2F3F5] rounded transition-colors"
            title="Headphones"
          >
            <Headphones className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
