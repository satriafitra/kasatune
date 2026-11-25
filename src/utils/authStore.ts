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
  updatedAt: number;
}

const ACCOUNTS_KEY = 'kasatune_accounts_v1';
const ACTIVE_SESSION_KEY = 'kasatune_auth_session_v1';
const USER_DATA_PREFIX = 'kasatune_account_data_v1_';

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
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {}
}

export function getSavedSessionUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.email && parsed.id) return parsed;
  } catch {}
  return null;
}

export function saveSessionUser(user: AuthUser | null) {
  try {
    if (user) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch {}
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
    if (res.ok) {
      const data = await res.json();
      if (data?.user?.email) {
        const serverUser: AuthUser = data.user;
        upsertLocalAccountRecord(serverUser);
        saveSessionUser(serverUser);
        return serverUser;
      }
    }
  } catch {}
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
function accountDataKey(email: string): string {
  return `${USER_DATA_PREFIX}${normalizeEmail(email)}`;
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
        updatedAt: parsed.updatedAt || Date.now(),
      };
    }
  } catch {}
  return null;
}

export function saveAccountDataSnapshot(email: string, snapshot: UserAccountDataSnapshot) {
  if (!email) return;
  try {
    localStorage.setItem(accountDataKey(email), JSON.stringify(snapshot));
  } catch {}
}
