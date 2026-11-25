import crypto from 'node:crypto';

const DEFAULT_GOOGLE_CLIENT_ID =
  '865404190630-312sv3qd1l2vdacj6qijpci25101pn7d.apps.googleusercontent.com';

const SESSION_COOKIE = 'kasatune_session';
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'email' | 'google';
  createdAt: number;
}

interface StoredServerAccount {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'email' | 'google';
  passwordHash?: string;
  salt?: string;
  createdAt: number;
  lastLoginAt: number;
}

// Warm in-memory account store (paired with signed HttpOnly cookie & optional KV/DB)
const warmAccounts = new Map<string, StoredServerAccount>();

function getGoogleClientId(): string {
  return (process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID).trim();
}

function getGoogleClientSecret(): string {
  return (process.env.GOOGLE_CLIENT_SECRET || '').trim();
}

function getSessionSecret(): string {
  return (
    process.env.AUTH_SESSION_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    `kasatune-session-${getGoogleClientId()}`
  );
}

function signSessionToken(user: AuthUserPayload): string {
  const payload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string | undefined): AuthUserPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  const expected = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  try {
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!parsed?.email || !parsed?.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.name,
      avatarUrl: parsed.avatarUrl,
      provider: parsed.provider === 'google' ? 'google' : 'email',
      createdAt: parsed.createdAt || Date.now(),
    };
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function setSessionCookie(req: any, res: any, user: AuthUserPayload) {
  const token = signSessionToken(user);
  const proto = req.headers?.['x-forwarded-proto'] || (req.socket?.encrypted ? 'https' : 'http');
  const isSecure = proto === 'https';
  const cookie = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SEC}`,
    isSecure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
  res.setHeader('Set-Cookie', cookie);
}

function clearSessionCookie(res: any) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

function getBaseOrigin(req: any): string {
  const proto = req.headers?.['x-forwarded-proto'] || 'https';
  const host = req.headers?.['x-forwarded-host'] || req.headers?.host || 'kasatune.vercel.app';
  return `${proto}://${host}`;
}

async function readJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function sendJson(res: any, status: number, payload: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: any, res: any) {
  const urlObj = new URL(req.url || '/api/auth', getBaseOrigin(req));
  const action = (urlObj.searchParams.get('action') || '').toLowerCase();

  try {
    // 1. Check current signed session cookie
    if (req.method === 'GET' && action === 'me') {
      const cookies = parseCookies(req.headers?.cookie);
      const user = verifySessionToken(cookies[SESSION_COOKIE]);
      return sendJson(res, 200, {
        user,
        googleClientId: getGoogleClientId(),
        hasServerGoogleOAuth: Boolean(getGoogleClientSecret()),
      });
    }

    // 2. Logout
    if (req.method === 'POST' && action === 'logout') {
      clearSessionCookie(res);
      return sendJson(res, 200, { ok: true });
    }

    // 3. Email & Password Register
    if (req.method === 'POST' && action === 'register') {
      const body = await readJsonBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const name = String(body.name || '').trim() || email.split('@')[0] || 'Pengguna';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson(res, 400, { error: 'Format email tidak valid.' });
      }
      if (password.length < 6) {
        return sendJson(res, 400, { error: 'Password minimal 6 karakter.' });
      }

      const existing = warmAccounts.get(email);
      if (existing) {
        return sendJson(res, 409, { error: 'Email sudah terdaftar. Silakan masuk.' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const now = Date.now();
      const account: StoredServerAccount = {
        id: `usr_${crypto.createHash('sha256').update(email).digest('hex').slice(0, 16)}`,
        email,
        name,
        provider: 'email',
        passwordHash: hashPassword(password, salt),
        salt,
        createdAt: now,
        lastLoginAt: now,
      };
      warmAccounts.set(email, account);

      const user: AuthUserPayload = {
        id: account.id,
        email: account.email,
        name: account.name,
        provider: 'email',
        createdAt: account.createdAt,
      };
      setSessionCookie(req, res, user);
      return sendJson(res, 201, { user });
    }

    // 4. Email & Password Login
    if (req.method === 'POST' && action === 'login') {
      const body = await readJsonBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const nameHint = String(body.name || '').trim();
      const clientVerified = Boolean(body.clientVerified);

      if (!email || !password) {
        return sendJson(res, 400, { error: 'Email dan password wajib diisi.' });
      }

      const existing = warmAccounts.get(email);
      if (existing) {
        if (existing.provider === 'google' && !existing.passwordHash) {
          return sendJson(res, 400, {
            error: 'Akun ini terdaftar lewat Google. Silakan masuk dengan Google.',
          });
        }
        const computed = hashPassword(password, existing.salt || '');
        if (computed !== existing.passwordHash) {
          return sendJson(res, 401, { error: 'Email atau password salah.' });
        }
        existing.lastLoginAt = Date.now();
        const user: AuthUserPayload = {
          id: existing.id,
          email: existing.email,
          name: existing.name,
          avatarUrl: existing.avatarUrl,
          provider: 'email',
          createdAt: existing.createdAt,
        };
        setSessionCookie(req, res, user);
        return sendJson(res, 200, { user });
      }

      // If serverless instance cold-started and client verified against persisted local registry,
      // re-hydrate the warm session cookie seamlessly.
      if (clientVerified) {
        const salt = crypto.randomBytes(16).toString('hex');
        const now = Date.now();
        const account: StoredServerAccount = {
          id: `usr_${crypto.createHash('sha256').update(email).digest('hex').slice(0, 16)}`,
          email,
          name: nameHint || email.split('@')[0] || 'Pengguna',
          provider: 'email',
          passwordHash: hashPassword(password, salt),
          salt,
          createdAt: now,
          lastLoginAt: now,
        };
        warmAccounts.set(email, account);
        const user: AuthUserPayload = {
          id: account.id,
          email: account.email,
          name: account.name,
          provider: 'email',
          createdAt: account.createdAt,
        };
        setSessionCookie(req, res, user);
        return sendJson(res, 200, { user });
      }

      return sendJson(res, 404, { error: 'Akun belum terdaftar. Silakan daftar terlebih dahulu.' });
    }

    // 5. Google OAuth Token Verification (from Google Identity Services popup)
    if (req.method === 'POST' && action === 'google-token') {
      const body = await readJsonBody(req);
      const accessToken = String(body.accessToken || '').trim();
      const credential = String(body.credential || '').trim();

      let email = '';
      let name = '';
      let avatarUrl = '';
      let sub = '';

      if (credential) {
        const infoRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );
        if (!infoRes.ok) {
          return sendJson(res, 401, { error: 'Token Google tidak valid.' });
        }
        const info: any = await infoRes.json();
        if (info.aud !== getGoogleClientId()) {
          return sendJson(res, 401, { error: 'Client ID Google tidak cocok.' });
        }
        email = String(info.email || '').toLowerCase();
        name = String(info.name || info.given_name || email.split('@')[0]);
        avatarUrl = String(info.picture || '');
        sub = String(info.sub || '');
      } else if (accessToken) {
        // Verify audience via tokeninfo first
        const tInfoRes = await fetch(
          `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
        );
        if (!tInfoRes.ok) {
          return sendJson(res, 401, { error: 'Sesi Google tidak valid atau kedaluwarsa.' });
        }
        const tInfo: any = await tInfoRes.json();
        if (tInfo.aud && tInfo.aud !== getGoogleClientId() && tInfo.azp !== getGoogleClientId()) {
          return sendJson(res, 401, { error: 'Client ID Google tidak sesuai.' });
        }

        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!profileRes.ok) {
          return sendJson(res, 401, { error: 'Gagal mengambil profil akun Google.' });
        }
        const profile: any = await profileRes.json();
        email = String(profile.email || '').toLowerCase();
        name = String(profile.name || profile.given_name || email.split('@')[0]);
        avatarUrl = String(profile.picture || '');
        sub = String(profile.sub || '');
      } else {
        return sendJson(res, 400, { error: 'Token Google tidak ditemukan.' });
      }

      if (!email) {
        return sendJson(res, 400, { error: 'Email akun Google tidak tersedia.' });
      }

      const now = Date.now();
      const existing = warmAccounts.get(email);
      const user: AuthUserPayload = {
        id: existing?.id || `goog_${sub || crypto.createHash('sha256').update(email).digest('hex').slice(0, 16)}`,
        email,
        name: name || existing?.name || email.split('@')[0],
        avatarUrl: avatarUrl || existing?.avatarUrl,
        provider: 'google',
        createdAt: existing?.createdAt || now,
      };
      warmAccounts.set(email, {
        ...user,
        lastLoginAt: now,
      });

      setSessionCookie(req, res, user);
      return sendJson(res, 200, { user });
    }

    // 6. Server-side Google OAuth Authorization Code Redirect Flow
    if (req.method === 'GET' && action === 'google-start') {
      const origin = getBaseOrigin(req);
      const redirectUri = `${origin}/api/auth?action=google-callback`;
      const state = crypto.randomBytes(12).toString('hex');
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', getGoogleClientId());
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('prompt', 'select_account');
      authUrl.searchParams.set('state', state);

      res.statusCode = 302;
      res.setHeader('Location', authUrl.toString());
      res.end();
      return;
    }

    // 7. Server-side Google OAuth Callback (exchanges code using GOOGLE_CLIENT_SECRET)
    if (req.method === 'GET' && action === 'google-callback') {
      const code = urlObj.searchParams.get('code');
      const error = urlObj.searchParams.get('error');
      const origin = getBaseOrigin(req);

      if (error || !code) {
        res.statusCode = 302;
        res.setHeader('Location', `${origin}/?auth_error=${encodeURIComponent(error || 'cancelled')}`);
        res.end();
        return;
      }

      const clientSecret = getGoogleClientSecret();
      if (!clientSecret) {
        res.statusCode = 302;
        res.setHeader('Location', `${origin}/?auth_error=missing_google_secret`);
        res.end();
        return;
      }

      const redirectUri = `${origin}/api/auth?action=google-callback`;
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: getGoogleClientId(),
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });

      if (!tokenRes.ok) {
        res.statusCode = 302;
        res.setHeader('Location', `${origin}/?auth_error=google_token_exchange_failed`);
        res.end();
        return;
      }

      const tokens: any = await tokenRes.json();
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (!profileRes.ok) {
        res.statusCode = 302;
        res.setHeader('Location', `${origin}/?auth_error=google_profile_failed`);
        res.end();
        return;
      }

      const profile: any = await profileRes.json();
      const email = String(profile.email || '').toLowerCase();
      const now = Date.now();
      const user: AuthUserPayload = {
        id: `goog_${profile.sub || crypto.createHash('sha256').update(email).digest('hex').slice(0, 16)}`,
        email,
        name: String(profile.name || email.split('@')[0]),
        avatarUrl: String(profile.picture || ''),
        provider: 'google',
        createdAt: now,
      };
      warmAccounts.set(email, { ...user, lastLoginAt: now });
      setSessionCookie(req, res, user);

      res.statusCode = 302;
      res.setHeader('Location', `${origin}/`);
      res.end();
      return;
    }

    return sendJson(res, 405, { error: 'Unsupported auth action.' });
  } catch (err: any) {
    console.error('Auth API error:', err?.message || err);
    return sendJson(res, 500, { error: 'Terjadi kesalahan autentikasi.' });
  }
}
