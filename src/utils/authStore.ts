/**
 * Kasatune Account & Per-User Data Persistence Store
 * - Stores registered accounts (email+salted SHA-256 hash & Google OAuth accounts) persistently
 * - Synchronizes session with /api/auth HttpOnly cookie when backend is available
 * - Isolates each user's Pinned Artists, Favorites Playlist, and Queue under their account email
 */

import type { PinnedServerItem } from '../components/AddAlbumModal';
import type { BackendRadioheadTrack } from '../api/backend';

export const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '865404190630-312sv3qd1l2vdacj6qijpci25101pn7d.apps.googleusercontent.com';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'email' | 'google';
  createdAt: number;
}

interface StoredLocalAccount extends AuthUser {
  passwordHash?: string;
  salt?: string;
  lastLoginAt: number;
}

export interface UserAccountDataSnapshot {
  pinnedServers: PinnedServerItem[];
  manualQueue: BackendRadioheadTrack[];
  customPlaylist?: any;
  activeAlbum?: string;
  currentAlbumEntity?: PinnedServerItem | null;
  updatedAt: number;
}

const ACCOUNTS_KEY = 'kasatune_accounts_v1';
const ACTIVE_SESSION_KEY = 'kasatune_auth_session_v1';
const SESSION_COOKIE_MIRROR = 'kasatune_uid_v1';
const USER_DATA_PREFIX = 'kasatune_account_data_v1_';
const EVICTABLE_CACHE_KEYS = [
  'kasatune_online_tracks_cache_v3',
  'kasatune_lyrics_cache_v1',
  'kasatune_yt_fallback_cache_v1',
];

export function safeLocalSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    // QuotaExceededError recovery: evict large non-essential media/lyrics caches and retry
    try {
      for (const cacheKey of EVICTABLE_CACHE_KEYS) {
        localStorage.removeItem(cacheKey);
      }
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

function encodeCookiePayload(obj: AuthUser): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return encodeURIComponent(btoa(binary));
}

function decodeCookiePayload(encoded: string): AuthUser | null {
  try {
    const binary = atob(decodeURIComponent(encoded));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (parsed && parsed.email && parsed.id) return parsed as AuthUser;
  } catch {}
  return null;
}

function writeSessionCookieMirror(user: AuthUser | null) {
  if (typeof document === 'undefined') return;
  try {
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    if (user) {
      const val = encodeCookiePayload(user);
      document.cookie = `${SESSION_COOKIE_MIRROR}=${val}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
    } else {
      document.cookie = `${SESSION_COOKIE_MIRROR}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    }
  } catch {}
}

function readSessionCookieMirror(): AuthUser | null {
  if (typeof document === 'undefined' || !document.cookie) return null;
  try {
    const parts = document.cookie.split(';');
    for (const part of parts) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      const k = part.slice(0, idx).trim();
      if (k === SESSION_COOKIE_MIRROR) {
        return decodeCookiePayload(part.slice(idx + 1).trim());
      }
    }
  } catch {}
  return null;
}

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

function generateSalt(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback deterministic hash for non-secure contexts
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function readLocalAccounts(): Record<string, StoredLocalAccount> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return {};
}

function writeLocalAccounts(accounts: Record<string, StoredLocalAccount>) {
  safeLocalSet(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getSavedSessionUser(): AuthUser | null {
  // 1. Primary: localStorage
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email && parsed.id) return parsed;
    }
  } catch {}

  // 2. Fallback: sessionStorage mirror
  try {
    const raw = sessionStorage.getItem(ACTIVE_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email && parsed.id) {
        safeLocalSet(ACTIVE_SESSION_KEY, raw);
        return parsed;
      }
    }
  } catch {}

  // 3. Fallback: 30-day browser cookie mirror (immune to localStorage quota eviction)
  const fromCookie = readSessionCookieMirror();
  if (fromCookie) {
    const serialized = JSON.stringify(fromCookie);
    safeLocalSet(ACTIVE_SESSION_KEY, serialized);
    try {
      sessionStorage.setItem(ACTIVE_SESSION_KEY, serialized);
    } catch {}
    return fromCookie;
  }

  return null;
}

export function saveSessionUser(user: AuthUser | null) {
  if (user) {
    const serialized = JSON.stringify(user);
    safeLocalSet(ACTIVE_SESSION_KEY, serialized);
    try {
      sessionStorage.setItem(ACTIVE_SESSION_KEY, serialized);
    } catch {}
    writeSessionCookieMirror(user);
  } else {
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch {}
    try {
      sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch {}
    writeSessionCookieMirror(null);
  }
}

export function upsertLocalAccountRecord(user: AuthUser, passwordHash?: string, salt?: string) {
  const email = normalizeEmail(user.email);
  if (!email) return;
  const accounts = readLocalAccounts();
  const existing = accounts[email];
  accounts[email] = {
    ...existing,
    ...user,
    email,
    passwordHash: passwordHash ?? existing?.passwordHash,
    salt: salt ?? existing?.salt,
    createdAt: existing?.createdAt || user.createdAt || Date.now(),
    lastLoginAt: Date.now(),
  };
  writeLocalAccounts(accounts);
}

/**
 * Restores session from local storage or HttpOnly server cookie (e.g. after Google OAuth redirect).
 */
export async function restoreAuthSession(): Promise<AuthUser | null> {
  const localUser = getSavedSessionUser();
  try {
    const res = await fetch('/api/auth?action=me', { credentials: 'include' });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data?.user?.email) {
        const serverUser: AuthUser = data.user;
        upsertLocalAccountRecord(serverUser);
        saveSessionUser(serverUser);
        return serverUser;
      }
    }
  } catch {}

  if (localUser) {
    // Re-mirror across localStorage, sessionStorage & cookie so refresh stays rock-solid
    saveSessionUser(localUser);
  }
  return localUser;
}

export async function registerWithEmail(params: {
  name?: string;
  email: string;
  password: string;
}): Promise<{ user?: AuthUser; error?: string }> {
  const email = normalizeEmail(params.email);
  const password = params.password || '';
  const name = (params.name || '').trim() || email.split('@')[0] || 'Pengguna';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Masukkan alamat email yang valid.' };
  }
  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter.' };
  }

  const accounts = readLocalAccounts();
  if (accounts[email]) {
    return { error: 'Email ini sudah terdaftar. Silakan masuk.' };
  }

  const salt = generateSalt();
  const passwordHash = await sha256Hex(`${salt}:${password}`);
  const now = Date.now();
  const idHash = await sha256Hex(email);
  let user: AuthUser = {
    id: `usr_${idHash.slice(0, 16)}`,
    email,
    name,
    provider: 'email',
    createdAt: now,
  };

  // Sync registration with backend API (sets HttpOnly session cookie when on Vercel)
  try {
    const res = await fetch('/api/auth?action=register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => null);
    if (res.status === 409) {
      return { error: data?.error || 'Email sudah terdaftar. Silakan masuk.' };
    }
    if (res.ok && data?.user) {
      user = data.user;
    }
  } catch {}

  upsertLocalAccountRecord(user, passwordHash, salt);
  saveSessionUser(user);
  return { user };
}

export async function loginWithEmail(params: {
  email: string;
  password: string;
}): Promise<{ user?: AuthUser; error?: string }> {
  const email = normalizeEmail(params.email);
  const password = params.password || '';

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi.' };
  }

  const accounts = readLocalAccounts();
  const localAcc = accounts[email];

  if (localAcc) {
    if (localAcc.provider === 'google' && !localAcc.passwordHash) {
      return { error: 'Akun ini terdaftar dengan Google. Silakan klik Lanjutkan dengan Google.' };
    }
    const computed = await sha256Hex(`${localAcc.salt || ''}:${password}`);
    if (computed !== localAcc.passwordHash) {
      return { error: 'Password salah. Periksa kembali password kamu.' };
    }

    const user: AuthUser = {
      id: localAcc.id,
      email: localAcc.email,
      name: localAcc.name,
      avatarUrl: localAcc.avatarUrl,
      provider: 'email',
      createdAt: localAcc.createdAt,
    };

    // Sync signed HttpOnly session cookie on backend
    try {
      await fetch('/api/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name: user.name, clientVerified: true }),
      });
    } catch {}

    upsertLocalAccountRecord(user);
    saveSessionUser(user);
    return { user };
  }

  // Not found locally -> try server warm account store
  try {
    const res = await fetch('/api/auth?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.user) {
      const salt = generateSalt();
      const passwordHash = await sha256Hex(`${salt}:${password}`);
      upsertLocalAccountRecord(data.user, passwordHash, salt);
      saveSessionUser(data.user);
      return { user: data.user };
    }
    if (data?.error) {
      return { error: data.error };
    }
  } catch {}

  return { error: 'Email belum terdaftar. Silakan daftar terlebih dahulu.' };
}

export async function loginWithGoogleAccessToken(
  accessToken: string
): Promise<{ user?: AuthUser; error?: string }> {
  if (!accessToken) return { error: 'Token Google kosong.' };

  // 1. Prefer server-side verification (/api/auth?action=google-token)
  try {
    const res = await fetch('/api/auth?action=google-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ accessToken }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.user) {
      upsertLocalAccountRecord(data.user);
      saveSessionUser(data.user);
      return { user: data.user };
    }
    if (res.status >= 400 && res.status < 500 && data?.error) {
      return { error: data.error };
    }
  } catch {}

  // 2. Fallback direct Google userinfo (e.g. local Vite dev without /api/auth)
  try {
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) {
      return { error: 'Gagal memverifikasi akun Google.' };
    }
    const profile = await profileRes.json();
    const email = normalizeEmail(profile.email);
    if (!email) return { error: 'Email Google tidak ditemukan.' };
    const user: AuthUser = {
      id: `goog_${profile.sub || (await sha256Hex(email)).slice(0, 16)}`,
      email,
      name: profile.name || profile.given_name || email.split('@')[0],
      avatarUrl: profile.picture || undefined,
      provider: 'google',
      createdAt: Date.now(),
    };
    upsertLocalAccountRecord(user);
    saveSessionUser(user);
    return { user };
  } catch {
    return { error: 'Gagal terhubung ke Google. Periksa koneksi internet kamu.' };
  }
}

export async function logoutAccount(): Promise<void> {
  saveSessionUser(null);
  try {
    await fetch('/api/auth?action=logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {}
}

export function scopedStorageKey(accountEmail: string | null | undefined, baseKey: string): string {
  const email = normalizeEmail(accountEmail || '');
  return email ? `${baseKey}::${email}` : baseKey;
}

// Capture Google OAuth redirect hash ONCE at module load (immune to React 19 StrictMode double-mount!)
interface PendingGoogleHash {
  accessToken: string | null;
  error: string | null;
  state: string | null;
}

let capturedGoogleHash: PendingGoogleHash | null = null;
let googleCallbackPromise: Promise<{ user?: AuthUser; error?: string } | null> | null = null;

function readAndStripGoogleHash(): PendingGoogleHash | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawHash = window.location.hash ? window.location.hash.slice(1) : '';
    if (!rawHash) return null;
    const params = new URLSearchParams(rawHash);
    const accessToken = params.get('access_token');
    const error = params.get('error');
    const state = params.get('state');
    if (accessToken || error) {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search
      );
      return { accessToken, error, state };
    }
  } catch {}
  return null;
}

// Capture immediately at module load (immune to React 19 StrictMode double-mount!)
capturedGoogleHash = readAndStripGoogleHash();

export function hasPendingGoogleCallback(): boolean {
  if (!capturedGoogleHash) {
    const fresh = readAndStripGoogleHash();
    if (fresh) {
      capturedGoogleHash = fresh;
      googleCallbackPromise = null;
    }
  }
  return Boolean(capturedGoogleHash);
}

/**
 * Deduplicated singleton processor for Google OAuth redirect callback.
 * Safe under React StrictMode double-effects because every mount awaits the same promise.
 */
export function consumeGoogleOAuthCallback(): Promise<{ user?: AuthUser; error?: string } | null> {
  if (!hasPendingGoogleCallback() || !capturedGoogleHash) return Promise.resolve(null);
  if (googleCallbackPromise) return googleCallbackPromise;

  const payload = capturedGoogleHash;
  googleCallbackPromise = (async () => {
    const { accessToken, error } = payload;
    try {
      sessionStorage.removeItem('kasatune_google_oauth_state');
    } catch {}

    if (error) {
      return {
        error:
          error === 'access_denied'
            ? 'Login Google dibatalkan.'
            : `Login Google gagal (${error}).`,
      };
    }
    if (!accessToken) {
      return { error: 'Token akses Google tidak ditemukan.' };
    }
    return await loginWithGoogleAccessToken(accessToken);
  })().finally(() => {
    capturedGoogleHash = null;
  });

  return googleCallbackPromise;
}

// Per-account saved data isolation (Pinned Artists, Queue, Custom Playlist)
// Triple-layer durability: Quota-safe localStorage + IndexedDB Vault + /api/auth?action=user-data
const VAULT_DB_NAME = 'kasatune_user_vault_v1';
const VAULT_STORE_NAME = 'account_data';

function accountDataKey(email: string): string {
  return `${USER_DATA_PREFIX}${normalizeEmail(email)}`;
}

function openVaultDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(VAULT_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(VAULT_STORE_NAME)) {
          db.createObjectStore(VAULT_STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readVaultIdb(email: string): Promise<UserAccountDataSnapshot | null> {
  const norm = normalizeEmail(email);
  if (!norm) return null;
  const db = await openVaultDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(VAULT_STORE_NAME, 'readonly');
      const store = tx.objectStore(VAULT_STORE_NAME);
      const req = store.get(norm);
      req.onsuccess = () => {
        const val = req.result;
        if (val && typeof val === 'object') {
          resolve({
            pinnedServers: Array.isArray(val.pinnedServers) ? val.pinnedServers : [],
            manualQueue: Array.isArray(val.manualQueue) ? val.manualQueue : [],
            customPlaylist: val.customPlaylist,
            activeAlbum: val.activeAlbum,
            currentAlbumEntity: val.currentAlbumEntity,
            updatedAt: Number(val.updatedAt) || 0,
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function writeVaultIdb(email: string, snapshot: UserAccountDataSnapshot): Promise<void> {
  const norm = normalizeEmail(email);
  if (!norm) return;
  const db = await openVaultDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(VAULT_STORE_NAME, 'readwrite');
      tx.objectStore(VAULT_STORE_NAME).put(snapshot, norm);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function snapshotHasData(snap: UserAccountDataSnapshot | null | undefined): boolean {
  if (!snap) return false;
  const likedCount = Array.isArray(snap.customPlaylist?.likedTrackIds)
    ? snap.customPlaylist.likedTrackIds.length
    : 0;
  return snap.pinnedServers.length > 0 || snap.manualQueue.length > 0 || likedCount > 0;
}

export function loadAccountDataSnapshot(email: string): UserAccountDataSnapshot | null {
  try {
    const raw = localStorage.getItem(accountDataKey(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        pinnedServers: Array.isArray(parsed.pinnedServers) ? parsed.pinnedServers : [],
        manualQueue: Array.isArray(parsed.manualQueue) ? parsed.manualQueue : [],
        customPlaylist: parsed.customPlaylist,
        activeAlbum: parsed.activeAlbum,
        currentAlbumEntity: parsed.currentAlbumEntity,
        updatedAt: Number(parsed.updatedAt) || 0,
      };
    }
  } catch {}
  return null;
}

export function saveAccountDataSnapshot(email: string, snapshot: UserAccountDataSnapshot) {
  const norm = normalizeEmail(email);
  if (!norm) return;
  const normalized: UserAccountDataSnapshot = {
    pinnedServers: Array.isArray(snapshot.pinnedServers) ? snapshot.pinnedServers : [],
    manualQueue: Array.isArray(snapshot.manualQueue) ? snapshot.manualQueue.slice(0, 100) : [],
    customPlaylist: snapshot.customPlaylist,
    activeAlbum: snapshot.activeAlbum,
    currentAlbumEntity: snapshot.currentAlbumEntity,
    updatedAt: Number(snapshot.updatedAt) || Date.now(),
  };

  // 1. Synchronous quota-safe localStorage
  safeLocalSet(accountDataKey(norm), JSON.stringify(normalized));

  // 2. Durable IndexedDB Vault (hundreds of MB, immune to 5MB localStorage limit)
  writeVaultIdb(norm, normalized).catch(() => {});

  // 3. Server-side per-account vault (survives browser cache clear / relogin)
  try {
    fetch('/api/auth?action=user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify({ email: norm, snapshot: normalized }),
    }).catch(() => {});
  } catch {}
}

export async function hydrateAccountDataSnapshot(
  email: string
): Promise<UserAccountDataSnapshot | null> {
  const norm = normalizeEmail(email);
  if (!norm) return null;

  const localSnap = loadAccountDataSnapshot(norm);

  const [idbSnap, serverSnap] = await Promise.all([
    readVaultIdb(norm).catch(() => null),
    (async (): Promise<UserAccountDataSnapshot | null> => {
      try {
        const res = await fetch(
          `/api/auth?action=user-data&email=${encodeURIComponent(norm)}`,
          { credentials: 'include' }
        );
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const json = await res.json();
          const d = json?.data;
          if (d && typeof d === 'object') {
            return {
              pinnedServers: Array.isArray(d.pinnedServers) ? d.pinnedServers : [],
              manualQueue: Array.isArray(d.manualQueue) ? d.manualQueue : [],
              customPlaylist: d.customPlaylist,
              activeAlbum: d.activeAlbum,
              currentAlbumEntity: d.currentAlbumEntity,
              updatedAt: Number(d.updatedAt) || 0,
            };
          }
        }
      } catch {}
      return null;
    })(),
  ]);

  const candidates = [localSnap, idbSnap, serverSnap].filter(
    (s): s is UserAccountDataSnapshot => Boolean(s)
  );
  if (candidates.length === 0) return null;

  // Prefer the newest snapshot; if timestamps tie or one is empty fallback, prefer populated one
  candidates.sort((a, b) => {
    const diff = (b.updatedAt || 0) - (a.updatedAt || 0);
    if (diff !== 0) return diff;
    return Number(snapshotHasData(b)) - Number(snapshotHasData(a));
  });

  let best = candidates[0];
  // Never lose data to a freshly-created empty default snapshot if an older vault has saved data
  if (!snapshotHasData(best)) {
    const populated = candidates.find((c) => snapshotHasData(c));
    if (populated && (!best.updatedAt || best.updatedAt <= populated.updatedAt)) {
      best = populated;
    }
  }

  // Heal localStorage & IndexedDB with the winning snapshot
  safeLocalSet(accountDataKey(norm), JSON.stringify(best));
  writeVaultIdb(norm, best).catch(() => {});

  return best;
}
