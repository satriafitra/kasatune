/**
 * TrackListSidebar Component (Discord Channel & Spotify Library Hybrid)
 * Authentic Discord navigation integrated with Spotify library:
 * - Channel-style navigation (# 🎵 radiohead-tracks)
 * - Custom Kasatune palette accents (#FFEAD3, #BFE7EA, #E89B5B, #D46743)
 * - Discord User Presence Bar at bottom (Radiohead Listener with online dot)
 */

import React, { useState } from 'react';
import {
  Library,
  Volume2,
  Search,
  Hash,
  Headphones,
  Mic,
  Settings,
  Disc3,
} from 'lucide-react';
import type { BackendRadioheadTrack } from '../api/backend';

interface TrackListSidebarProps {
  tracks: BackendRadioheadTrack[];
  activeTrackId: string;
  onSelectTrack: (track: BackendRadioheadTrack) => void;
  isPlaying: boolean;
  searchFilter: string;
}

export const TrackListSidebar: React.FC<TrackListSidebarProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  isPlaying,
  searchFilter,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'albums' | 'songs'>('all');

  const filteredTracks = tracks.filter((t) => {
    const q = searchFilter.toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.mood.toLowerCase().includes(q);

    return matchesSearch;
  });

  return (
    <aside className="w-full h-full bg-[#2B2D31] rounded-lg border border-[#383A40]/60 flex flex-col overflow-hidden select-none shadow-sm">
      {/* Top Discord Channel Header */}
      <div className="p-3.5 pb-2 flex flex-col gap-2.5 border-b border-[#383A40]/40">
        <div className="flex items-center justify-between text-[#949BA4] hover:text-[#F2F3F5] transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-[#E89B5B]" />
            <span className="font-extrabold text-sm tracking-tight text-[#F2F3F5]">
              radiohead-library
            </span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#1E1F22] text-[#BFE7EA] border border-[#383A40]">
            {tracks.length} songs
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-gradient-to-r from-[#E89B5B] to-[#D46743] text-white shadow-sm'
                : 'bg-[#1E1F22] text-[#949BA4] hover:bg-[#35373C] hover:text-[#F2F3F5]'
            }`}
          >
            All Tracks
          </button>
          <button
            onClick={() => setActiveFilter('songs')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              activeFilter === 'songs'
                ? 'bg-gradient-to-r from-[#E89B5B] to-[#D46743] text-white shadow-sm'
                : 'bg-[#1E1F22] text-[#949BA4] hover:bg-[#35373C] hover:text-[#F2F3F5]'
            }`}
          >
            Studio Masters
          </button>
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
        {filteredTracks.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#949BA4]">
            No Radiohead tracks found
          </div>
        ) : (
          filteredTracks.map((track) => {
            const isActive = track.id === activeTrackId;

            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className={`group flex items-center justify-between gap-3 p-2 rounded-md cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#35373C] border-l-2 border-[#E89B5B] shadow-sm'
                    : 'hover:bg-[#313338] text-[#949BA4]'
                }`}
              >
                {/* Artwork & Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-10 h-10 rounded-md overflow-hidden bg-[#1E1F22] flex-shrink-0 border border-[#383A40]/50">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                    {isActive && isPlaying && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Volume2 className="w-4 h-4 text-[#BFE7EA] animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex flex-col justify-center">
                    <p
                      className={`text-xs font-bold truncate leading-tight ${
                        isActive ? 'text-[#FFEAD3]' : 'text-[#F2F3F5]'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-[11px] text-[#949BA4] truncate pt-0.5">
                      {track.album} &bull; {track.year}
                    </p>
                  </div>
                </div>

                {/* Right Status */}
                {isActive && (
                  <div className="flex-shrink-0 pr-1">
                    <span className="w-2 h-2 rounded-full bg-[#BFE7EA] block shadow-[0_0_8px_#BFE7EA]" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Discord User Presence Footer */}
      <div className="p-2.5 bg-[#232428] border-t border-[#383A40]/60 flex items-center justify-between">
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
          <button className="p-1 hover:bg-[#35373C] hover:text-[#F2F3F5] rounded transition-colors" title="Microphone">
            <Mic className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:bg-[#35373C] hover:text-[#F2F3F5] rounded transition-colors" title="Headphones">
            <Headphones className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
