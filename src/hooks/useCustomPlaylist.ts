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
import { safeLocalSet } from '../utils/authStore';

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
    ? `${STORAGE_KEY}::${accountKey.trim().toLowerCase()}`
    : STORAGE_KEY;

  const readPlaylistForKey = useCallback((key: string): CustomPlaylistData => {
    try {
      // Strictly isolated per account: NEVER inherit legacy/other-account global playlist!
      const saved = localStorage.getItem(key);
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
    return { ...DEFAULT_PLAYLIST, updatedAt: Date.now() };
  }, []);

  const [playlist, setPlaylist] = useState<CustomPlaylistData>(() => readPlaylistForKey(storageKey));

  // Reload playlist when switching accounts
  useEffect(() => {
    setPlaylist(readPlaylistForKey(storageKey));
  }, [storageKey, readPlaylistForKey]);

  const hydratePlaylist = useCallback(
    (incoming: Partial<CustomPlaylistData> | null | undefined) => {
      if (!incoming || typeof incoming !== 'object') return;
      const merged: CustomPlaylistData = {
        ...DEFAULT_PLAYLIST,
        ...incoming,
        likedTrackIds: Array.isArray(incoming.likedTrackIds) ? incoming.likedTrackIds : [],
        savedOnlineTracks: incoming.savedOnlineTracks || {},
        updatedAt: Number(incoming.updatedAt) || Date.now(),
      };
      setPlaylist(merged);
      safeLocalSet(storageKey, JSON.stringify(merged));
    },
    [storageKey]
  );

  // Check if a track is liked
  const isLiked = useCallback(
    (trackId: string): boolean => {
      return playlist.likedTrackIds.includes(trackId);
    },
    [playlist.likedTrackIds]
  );

  // Toggle like status on a track (persists synchronously via quota-safe safeLocalSet!)
  const toggleLike = useCallback((track: BackendRadioheadTrack) => {
    if (!track || !track.id) return;

    setPlaylist((prev) => {
      const alreadyLiked = prev.likedTrackIds.includes(track.id);
      let updatedIds: string[];
      const updatedSavedOnline = { ...prev.savedOnlineTracks };

      if (alreadyLiked) {
        updatedIds = prev.likedTrackIds.filter((id) => id !== track.id);
      } else {
        updatedIds = [track.id, ...prev.likedTrackIds];
        if (track.category === 'online' || track.category === 'scraped' || !allLibraryTracks.some((t) => t.id === track.id)) {
          updatedSavedOnline[track.id] = track;
        }
      }

      const next: CustomPlaylistData = {
        ...prev,
        likedTrackIds: updatedIds,
        savedOnlineTracks: updatedSavedOnline,
        updatedAt: Date.now(),
      };
      safeLocalSet(storageKey, JSON.stringify(next));
      return next;
    });
  }, [allLibraryTracks, storageKey]);

  // Update custom playlist metadata (name, description, coverUrl)
  const updatePlaylist = useCallback(
    (updates: { name: string; description?: string; coverUrl?: string }) => {
      setPlaylist((prev) => {
        const next: CustomPlaylistData = {
          ...prev,
          name: updates.name.trim() || prev.name,
          description: updates.description !== undefined ? updates.description.trim() : prev.description,
          coverUrl: updates.coverUrl?.trim() || prev.coverUrl,
          updatedAt: Date.now(),
        };
        safeLocalSet(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [storageKey]
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
    hydratePlaylist,
    allTracksMap,
  };
}
