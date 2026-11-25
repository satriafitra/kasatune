/**
 * useCustomPlaylist Hook
 * Manages the user's custom favorites playlist, liked song states, and persistence via localStorage.
 * 
 * Features:
 * - Persistent custom playlist metadata: name, description, cover image
 * - Track favoriting / heart toggle on any song (local or real-time online)
 * - Automatic persistence in localStorage across page reloads
 * - Dynamic list of liked tracks with full playback compatibility
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { BackendRadioheadTrack } from '../api/backend';

export interface CustomPlaylistData {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  likedTrackIds: string[];
  savedOnlineTracks: Record<string, BackendRadioheadTrack>;
  updatedAt: number;
}

const STORAGE_KEY = 'kasatune_user_custom_playlist';

const DEFAULT_PLAYLIST: CustomPlaylistData = {
  id: 'my-playlist',
  name: 'Lagu Favorit Saya',
  description: 'Daftar lagu favorit pilihan saya di Kasatune.',
  coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  likedTrackIds: [],
  savedOnlineTracks: {},
  updatedAt: Date.now(),
};

export function useCustomPlaylist(allLibraryTracks: BackendRadioheadTrack[], accountKey?: string | null) {
  const storageKey = accountKey
    ? `${STORAGE_KEY}_${accountKey.trim().toLowerCase()}`
    : STORAGE_KEY;

  const readPlaylistForKey = useCallback((key: string): CustomPlaylistData => {
    try {
      const saved = localStorage.getItem(key) || (key !== STORAGE_KEY ? localStorage.getItem(STORAGE_KEY) : null);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PLAYLIST,
          ...parsed,
          likedTrackIds: Array.isArray(parsed.likedTrackIds) ? parsed.likedTrackIds : [],
          savedOnlineTracks: parsed.savedOnlineTracks || {},
        };
      }
    } catch (e) {
      console.warn('Failed to parse saved custom playlist:', e);
    }
    return DEFAULT_PLAYLIST;
  }, []);

  const [playlist, setPlaylist] = useState<CustomPlaylistData>(() => readPlaylistForKey(storageKey));

  // Reload playlist when switching accounts
  useEffect(() => {
    setPlaylist(readPlaylistForKey(storageKey));
  }, [storageKey, readPlaylistForKey]);

  // Save to localStorage whenever playlist state changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(playlist));
    } catch (e) {
      console.warn('Failed to save custom playlist to localStorage:', e);
    }
  }, [playlist, storageKey]);

  // Check if a track is liked
  const isLiked = useCallback(
    (trackId: string): boolean => {
      return playlist.likedTrackIds.includes(trackId);
    },
    [playlist.likedTrackIds]
  );

  // Toggle like status on a track
  const toggleLike = useCallback((track: BackendRadioheadTrack) => {
    if (!track || !track.id) return;

    setPlaylist((prev) => {
      const alreadyLiked = prev.likedTrackIds.includes(track.id);
      let updatedIds: string[];
      let updatedSavedOnline = { ...prev.savedOnlineTracks };

      if (alreadyLiked) {
        // Remove from liked
        updatedIds = prev.likedTrackIds.filter((id) => id !== track.id);
      } else {
        // Add to liked (at the top of the list)
        updatedIds = [track.id, ...prev.likedTrackIds];
        // If it's a live/scraped track not in static local DB, cache the full object
        if (track.category === 'online' || track.category === 'scraped' || !allLibraryTracks.some((t) => t.id === track.id)) {
          updatedSavedOnline[track.id] = track;
        }
      }

      return {
        ...prev,
        likedTrackIds: updatedIds,
        savedOnlineTracks: updatedSavedOnline,
        updatedAt: Date.now(),
      };
    });
  }, [allLibraryTracks]);

  // Update custom playlist metadata (name, description, coverUrl)
  const updatePlaylist = useCallback(
    (updates: { name: string; description?: string; coverUrl?: string }) => {
      setPlaylist((prev) => ({
        ...prev,
        name: updates.name.trim() || prev.name,
        description: updates.description !== undefined ? updates.description.trim() : prev.description,
        coverUrl: updates.coverUrl?.trim() || prev.coverUrl,
        updatedAt: Date.now(),
      }));
    },
    []
  );

  // Map of all available tracks (static + saved online tracks)
  const allTracksMap = useMemo(() => {
    const map = new Map<string, BackendRadioheadTrack>();
    allLibraryTracks.forEach((t) => map.set(t.id, t));
    Object.values(playlist.savedOnlineTracks).forEach((t) => map.set(t.id, t));
    return map;
  }, [allLibraryTracks, playlist.savedOnlineTracks]);

  // Ordered list of liked tracks
  const likedTracks = useMemo(() => {
    return playlist.likedTrackIds
      .map((id) => allTracksMap.get(id))
      .filter((t): t is BackendRadioheadTrack => t !== undefined);
  }, [playlist.likedTrackIds, allTracksMap]);

  return {
    playlist,
    likedTracks,
    likedTrackIds: playlist.likedTrackIds,
    isLiked,
    toggleLike,
    updatePlaylist,
    allTracksMap,
  };
}
