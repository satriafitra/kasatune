/**
 * Multi-Layer Media & Lyrics Cache + Background Prefetcher
 * Makes rapid & random (shuffle) track switching near-instant:
 * - In-memory LRU Blob URL cache (instant 0ms playback & scrubbing)
 * - Persistent Browser Cache Storage API ('kasatune-audio-v1') across reloads
 * - Persistent Lyrics cache ('kasatune_lyrics_cache_v1') for instant synced lyrics
 * - Persistent YouTube fallback videoIds cache ('kasatune_yt_vid_cache_v1')
 * - Deduplicated background Range-stitching fetcher (compatible with Vercel 4MB chunk cap)
 */

import { fetchLyrics } from '../api/lrclib';
import type { LyricLine } from './lrcParser';
import { parseLrc } from './lrcParser';

const AUDIO_CACHE_NAME = 'kasatune-audio-v1';
const MAX_RAM_BLOBS = 16;
const MAX_PERSISTENT_AUDIO = 24;
const MAX_AUDIO_BYTES = 14 * 1024 * 1024; // Safety cap: 14MB per track
const LYRICS_STORAGE_KEY = 'kasatune_lyrics_cache_v1';
const YT_FALLBACK_STORAGE_KEY = 'kasatune_yt_vid_cache_v1';
const MAX_LYRICS_ENTRIES = 140;
const MAX_YT_ENTRIES = 120;

export interface CachedLyricsEntry {
  syncedLyrics: string | null;
  plainLyrics: string | null;
  ts: number;
}

// 1. RAM Blob URL LRU Cache (key = normalized streamUrl)
const ramBlobCache = new Map<string, string>();
const inFlightAudio = new Map<string, Promise<string | null>>();
const cachedStatusListeners = new Set<() => void>();

function notifyCacheListeners() {
  cachedStatusListeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

export function subscribeMediaCache(listener: () => void): () => void {
  cachedStatusListeners.add(listener);
  return () => {
    cachedStatusListeners.delete(listener);
  };
}

export function normalizeAudioCacheKey(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('blob:')) return trimmed;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://kasatune.vercel.app';
    const u = new URL(trimmed, base);
    if (u.pathname === '/api/stream') {
      const artist = (u.searchParams.get('artist') || '').trim().toLowerCase();
      const title = (u.searchParams.get('title') || '').trim().toLowerCase();
      const q = (u.searchParams.get('q') || '').trim().toLowerCase();
      const id = (u.searchParams.get('id') || '').trim();
      if (id) return `${base}/api/stream?id=${encodeURIComponent(id)}`;
      if (artist || title) {
        return `${base}/api/stream?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`;
      }
      if (q) return `${base}/api/stream?q=${encodeURIComponent(q)}`;
    }
    return u.toString();
  } catch {
    return trimmed;
  }
}

function setRamBlob(key: string, blobUrl: string) {
  if (ramBlobCache.has(key)) {
    const prev = ramBlobCache.get(key);
    ramBlobCache.delete(key);
    if (prev && prev !== blobUrl) {
      try {
        URL.revokeObjectURL(prev);
      } catch {}
    }
  }
  ramBlobCache.set(key, blobUrl);
  while (ramBlobCache.size > MAX_RAM_BLOBS) {
    const oldestKey = ramBlobCache.keys().next().value;
    if (!oldestKey) break;
    const oldestUrl = ramBlobCache.get(oldestKey);
    ramBlobCache.delete(oldestKey);
    if (oldestUrl) {
      try {
        URL.revokeObjectURL(oldestUrl);
      } catch {}
    }
  }
  notifyCacheListeners();
}

export function isAudioInRamCache(url: string): boolean {
  const key = normalizeAudioCacheKey(url);
  return Boolean(key && ramBlobCache.has(key));
}

export function getSyncCachedAudioUrl(url: string): string | null {
  const key = normalizeAudioCacheKey(url);
  if (!key) return null;
  const hit = ramBlobCache.get(key);
  if (!hit) return null;
  // Touch LRU
  ramBlobCache.delete(key);
  ramBlobCache.set(key, hit);
  return hit;
}

export async function getCachedAudioUrl(url: string): Promise<string | null> {
  const syncHit = getSyncCachedAudioUrl(url);
  if (syncHit) return syncHit;

  const key = normalizeAudioCacheKey(url);
  if (!key || typeof window === 'undefined' || !('caches' in window)) return null;

  try {
    const cache = await window.caches.open(AUDIO_CACHE_NAME);
    const match = await cache.match(key);
    if (!match) return null;
    const blob = await match.blob();
    if (!blob || blob.size < 4096) return null;
    const blobUrl = URL.createObjectURL(blob);
    setRamBlob(key, blobUrl);
    return blobUrl;
  } catch {
    return null;
  }
}

async function persistAudioBlob(key: string, blob: Blob, mimeType: string) {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await window.caches.open(AUDIO_CACHE_NAME);
    const response = new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': mimeType || blob.type || 'audio/mpeg',
        'Content-Length': String(blob.size),
        'X-Kasatune-Cached-At': String(Date.now()),
      },
    });
    await cache.put(key, response);

    // Prune oldest entries if exceeding MAX_PERSISTENT_AUDIO
    const keys = await cache.keys();
    if (keys.length > MAX_PERSISTENT_AUDIO) {
      const overflow = keys.length - MAX_PERSISTENT_AUDIO;
      for (let i = 0; i < overflow; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch {}
}

/**
 * Fetches full audio bytes cleanly (handling Vercel 4MB HTTP 206 Range chunks)
 * and stores in both Cache Storage and RAM Blob URL cache.
 */
async function downloadFullAudioBlob(
  url: string,
  signal?: AbortSignal
): Promise<{ blob: Blob; mimeType: string } | null> {
  const firstRes = await fetch(url, {
    headers: { Range: 'bytes=0-3999999' },
    signal,
  });

  if (!firstRes.ok) {
    // If server returned fallback YouTube videoIds JSON on 404, cache them for instant YT fallback!
    if (url.includes('/api/stream')) {
      try {
        const payload = await firstRes.json();
        const ids: string[] = Array.isArray(payload?.videoIds) && payload.videoIds.length > 0
          ? payload.videoIds
          : payload?.videoId
          ? [payload.videoId]
          : [];
        if (ids.length > 0) {
          setCachedYtFallback(url, ids);
        }
      } catch {}
    }
    return null;
  }

  const mimeType = firstRes.headers.get('content-type') || 'audio/mp4';
  if (mimeType.includes('application/json') || mimeType.includes('text/html')) {
    return null;
  }

  const firstChunk = new Uint8Array(await firstRes.arrayBuffer());
  if (firstChunk.byteLength < 4096) return null;

  const contentRange = firstRes.headers.get('content-range');
  if (firstRes.status === 200 || !contentRange) {
    return { blob: new Blob([firstChunk], { type: mimeType }), mimeType };
  }

  // Parse Content-Range: bytes start-end/total
  const m = /bytes\s+(\d+)-(\d+)\/(\d+)/i.exec(contentRange);
  if (!m) {
    return { blob: new Blob([firstChunk], { type: mimeType }), mimeType };
  }

  const end = parseInt(m[2], 10);
  const total = parseInt(m[3], 10);
  if (!Number.isFinite(total) || total <= 0 || end + 1 >= total) {
    return { blob: new Blob([firstChunk], { type: mimeType }), mimeType };
  }
  if (total > MAX_AUDIO_BYTES) {
    return null;
  }

  const chunks: Uint8Array[] = [firstChunk];
  let offset = end + 1;
  let guard = 0;

  while (offset < total && guard < 12) {
    guard++;
    if (signal?.aborted) return null;
    const reqEnd = Math.min(total - 1, offset + 3999999);
    const nextRes = await fetch(url, {
      headers: { Range: `bytes=${offset}-${reqEnd}` },
      signal,
    });
    if (!nextRes.ok) return null;
    const part = new Uint8Array(await nextRes.arrayBuffer());
    if (part.byteLength === 0) break;
    chunks.push(part);
    offset += part.byteLength;
  }

  if (offset < total) return null;

  const totalBytes = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const combined = new Uint8Array(totalBytes);
  let pos = 0;
  for (const c of chunks) {
    combined.set(c, pos);
    pos += c.byteLength;
  }

  return { blob: new Blob([combined], { type: mimeType }), mimeType };
}

export function prefetchAudioTrack(url: string, signal?: AbortSignal): Promise<string | null> {
  const key = normalizeAudioCacheKey(url);
  if (!key || url.startsWith('blob:')) return Promise.resolve(url || null);

  const ramHit = getSyncCachedAudioUrl(url);
  if (ramHit) return Promise.resolve(ramHit);

  const existing = inFlightAudio.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const diskHit = await getCachedAudioUrl(url);
      if (diskHit) return diskHit;

      const downloaded = await downloadFullAudioBlob(url, signal);
      if (!downloaded) return null;

      const blobUrl = URL.createObjectURL(downloaded.blob);
      setRamBlob(key, blobUrl);
      await persistAudioBlob(key, downloaded.blob, downloaded.mimeType);
      return blobUrl;
    } catch {
      return null;
    } finally {
      inFlightAudio.delete(key);
    }
  })();

  inFlightAudio.set(key, promise);
  return promise;
}

// 2. YouTube Fallback videoIds Cache (instant fallback without re-probing 404 /api/stream)
let ytFallbackMap: Record<string, { ids: string[]; ts: number }> | null = null;

function loadYtFallbackMap(): Record<string, { ids: string[]; ts: number }> {
  if (ytFallbackMap) return ytFallbackMap;
  try {
    const raw = localStorage.getItem(YT_FALLBACK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        ytFallbackMap = parsed;
        return ytFallbackMap!;
      }
    }
  } catch {}
  ytFallbackMap = {};
  return ytFallbackMap;
}

export function getCachedYtFallback(url: string): string[] | null {
  const key = normalizeAudioCacheKey(url);
  if (!key) return null;
  const map = loadYtFallbackMap();
  const entry = map[key];
  if (!entry || !Array.isArray(entry.ids) || entry.ids.length === 0) return null;
  // Valid for 24h
  if (Date.now() - entry.ts > 24 * 60 * 60 * 1000) {
    delete map[key];
    return null;
  }
  return entry.ids;
}

export function setCachedYtFallback(url: string, ids: string[]) {
  const key = normalizeAudioCacheKey(url);
  if (!key || !ids.length) return;
  const map = loadYtFallbackMap();
  map[key] = { ids, ts: Date.now() };
  const keys = Object.keys(map);
  if (keys.length > MAX_YT_ENTRIES) {
    keys.sort((a, b) => (map[a].ts || 0) - (map[b].ts || 0));
    for (let i = 0; i < keys.length - MAX_YT_ENTRIES; i++) {
      delete map[keys[i]];
    }
  }
  try {
    localStorage.setItem(YT_FALLBACK_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

// 3. Lyrics Cache (RAM + localStorage) for instant synced lyrics on track switch
let lyricsCacheMap: Record<string, CachedLyricsEntry> | null = null;
const inFlightLyrics = new Map<string, Promise<CachedLyricsEntry | null>>();

function makeLyricsKey(artist: string, title: string): string {
  const a = (artist || '').toLowerCase().trim();
  const t = (title || '').toLowerCase().trim();
  return `${a}::${t}`;
}

function loadLyricsCacheMap(): Record<string, CachedLyricsEntry> {
  if (lyricsCacheMap) return lyricsCacheMap;
  try {
    const raw = localStorage.getItem(LYRICS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        lyricsCacheMap = parsed;
        return lyricsCacheMap!;
      }
    }
  } catch {}
  lyricsCacheMap = {};
  return lyricsCacheMap;
}

export function getCachedLyrics(artist: string, title: string): CachedLyricsEntry | null {
  const key = makeLyricsKey(artist, title);
  const map = loadLyricsCacheMap();
  return map[key] || null;
}

export function setCachedLyrics(
  artist: string,
  title: string,
  syncedLyrics: string | null,
  plainLyrics: string | null
) {
  const key = makeLyricsKey(artist, title);
  const map = loadLyricsCacheMap();
  map[key] = { syncedLyrics, plainLyrics, ts: Date.now() };
  const keys = Object.keys(map);
  if (keys.length > MAX_LYRICS_ENTRIES) {
    keys.sort((a, b) => (map[a].ts || 0) - (map[b].ts || 0));
    for (let i = 0; i < keys.length - MAX_LYRICS_ENTRIES; i++) {
      delete map[keys[i]];
    }
  }
  try {
    localStorage.setItem(LYRICS_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export async function prefetchTrackLyrics(
  title: string,
  artist: string,
  durationMs?: number
): Promise<{ lyrics: LyricLine[]; plainLyrics: string | null }> {
  const hit = getCachedLyrics(artist, title);
  if (hit) {
    return {
      lyrics: hit.syncedLyrics ? parseLrc(hit.syncedLyrics) : [],
      plainLyrics: hit.syncedLyrics ? null : hit.plainLyrics,
    };
  }

  const key = makeLyricsKey(artist, title);
  let pending = inFlightLyrics.get(key);
  if (!pending) {
    pending = fetchLyrics(title, artist, durationMs)
      .then((res) => {
        const entry: CachedLyricsEntry = {
          syncedLyrics: res.syncedLyrics || null,
          plainLyrics: res.plainLyrics || null,
          ts: Date.now(),
        };
        setCachedLyrics(artist, title, entry.syncedLyrics, entry.plainLyrics);
        return entry;
      })
      .catch(() => null)
      .finally(() => {
        inFlightLyrics.delete(key);
      });
    inFlightLyrics.set(key, pending);
  }

  const entry = await pending;
  if (!entry) return { lyrics: [], plainLyrics: null };
  return {
    lyrics: entry.syncedLyrics ? parseLrc(entry.syncedLyrics) : [],
    plainLyrics: entry.syncedLyrics ? null : entry.plainLyrics,
  };
}
