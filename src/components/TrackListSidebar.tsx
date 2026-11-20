/**
 * TrackListSidebar Component (Spotify "Your Library" Left Sidebar)
 * Seamless, full-height library navigation displaying Radiohead discography.
 * Authentic Spotify desktop design without card borders.
 */

import React, { useState } from 'react';
import { Library, Volume2, Search } from 'lucide-react';
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
    <aside className="w-full h-full bg-[#121212] rounded-lg flex flex-col overflow-hidden select-none">
      {/* Top Library Header */}
      <div className="p-4 pb-2 flex flex-col gap-3">
        <div className="flex items-center justify-between text-[#B3B3B3] hover:text-white transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <Library className="w-6 h-6" />
            <span className="font-bold text-sm tracking-tight">Your Library</span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#242424] text-[#B3B3B3]">
            {tracks.length} tracks
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-white text-black'
                : 'bg-[#242424] text-white hover:bg-[#2A2A2A]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('songs')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              activeFilter === 'songs'
                ? 'bg-white text-black'
                : 'bg-[#242424] text-white hover:bg-[#2A2A2A]'
            }`}
          >
            Radiohead
          </button>
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {filteredTracks.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#B3B3B3]">
            No Radiohead tracks found
          </div>
        ) : (
          filteredTracks.map((track) => {
            const isActive = track.id === activeTrackId;

            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className={`group flex items-center justify-between gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                  isActive ? 'bg-[#242424]' : 'hover:bg-[#1A1A1A]'
                }`}
              >
                {/* Artwork & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded overflow-hidden bg-[#282828] flex-shrink-0">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                    {isActive && isPlaying && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Volume2 className="w-5 h-5 text-[#1DB954] animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isActive ? 'text-[#1DB954]' : 'text-white'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-xs text-[#B3B3B3] truncate">
                      Song &bull; Radiohead &bull; {track.album}
                    </p>
                  </div>
                </div>

                {/* Right Status */}
                {isActive && (
                  <div className="flex-shrink-0 pr-2">
                    <span className="w-2 h-2 rounded-full bg-[#1DB954] block shadow-[0_0_8px_#1DB954]" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
