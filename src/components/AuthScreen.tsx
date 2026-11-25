/**
 * AuthScreen Component
 * Refined, calm dark matte Login & Register screen (#0B0B0C / #121213 / #CE7F20 / #EEDFC7 / #607938 / #53341A):
 * - Clean editorial 2-column split on Desktop, compact single-column card on Mobile
 * - Zero excessive glow, zero gimmicky interactive states
 * - Email & Password sign-in ("Masuk") and registration ("Daftar")
 * - Google OAuth 2.0 direct redirect flow using exact registered redirect_uri (`${origin}/`)
 */

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, Mail, Lock, User } from 'lucide-react';
import { KasatuneLogoIcon } from './KasatuneLogo';
import {
  GOOGLE_CLIENT_ID,
  loginWithEmail,
  registerWithEmail,
  type AuthUser,
} from '../utils/authStore';

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void;
  initialError?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthenticated,
  initialError = null,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (initialError) {
      setErrorMsg(initialError);
    }
  }, [initialError]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const authErr = params.get('auth_error') || params.get('error');
      if (authErr) {
        if (authErr === 'cancelled' || authErr === 'access_denied') {
          setErrorMsg('Login Google dibatalkan.');
        } else {
          setErrorMsg(`Login Google gagal (${authErr}). Silakan coba lagi.`);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res =
        mode === 'register'
          ? await registerWithEmail({ name, email, password })
          : await loginWithEmail({ email, password });

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      if (res.user) {
        onAuthenticated(res.user);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);

    try {
      const stateBytes = new Uint8Array(12);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(stateBytes);
      }
      const state =
        Array.from(stateBytes, (b) => b.toString(16).padStart(2, '0')).join('') ||
        String(Date.now());
      try {
        sessionStorage.setItem('kasatune_google_oauth_state', state);
      } catch {}

      const redirectUri = `${window.location.origin}/`;

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'token');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('prompt', 'select_account');
      authUrl.searchParams.set('include_granted_scopes', 'true');
      authUrl.searchParams.set('state', state);

      window.location.assign(authUrl.toString());
    } catch {
      setIsGoogleLoading(false);
      setErrorMsg('Gagal membuka halaman login Google.');
    }
  };

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#0B0B0C] text-[#EEDFC7] flex items-center justify-center px-4 py-8 overflow-y-auto select-none">
      <div className="w-full max-w-[390px] md:max-w-[780px] bg-[#121213] border border-white/[0.08] rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Desktop Editorial Left Panel */}
        <aside className="hidden md:flex md:col-span-5 bg-[#151413] border-r border-white/[0.07] p-8 flex-col justify-between">
          <div className="space-y-8">
            {/* Brand Mark */}
            <div className="flex items-center gap-2.5">
              <KasatuneLogoIcon size={30} />
              <span className="text-base font-bold tracking-tight text-[#EEDFC7]">
                Kasatune
              </span>
            </div>

            {/* Editorial Headline */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#CE7F20]">
                Streaming Musik
              </p>
              <h2 className="text-[24px] font-bold leading-[1.25] tracking-tight text-[#EEDFC7]">
                Ruang dengar yang tenang, cepat, dan personal.
              </h2>
              <p className="text-xs leading-relaxed text-[#9A9288]">
                Temukan lagu global terbaru, simpan koleksi favoritmu, dan putar antrian tanpa jeda.
              </p>
            </div>

            {/* Quiet Feature List */}
            <ul className="space-y-3 pt-2 border-t border-white/[0.07]">
              <li className="flex items-start gap-2.5 text-xs text-[#9A9288]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CE7F20] mt-1.5 flex-shrink-0" />
                <span>Chart global &amp; tren musik {currentYear} secara real-time</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-[#9A9288]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#607938] mt-1.5 flex-shrink-0" />
                <span>Favorit, artis, dan antrian tersimpan rapi per akun</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-[#9A9288]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CE7F20]/70 mt-1.5 flex-shrink-0" />
                <span>Lirik tersinkron &amp; perpindahan lagu cepat dengan cache</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#68625B]">
            <span>Kasatune Audio</span>
            <span>{currentYear}</span>
          </div>
        </aside>

        {/* Right Form Panel (Full Width on Mobile) */}
        <section className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
          {/* Mobile Brand Header */}
          <div className="flex md:hidden items-center gap-2.5 mb-6">
            <KasatuneLogoIcon size={30} />
            <span className="text-base font-bold tracking-tight text-[#EEDFC7]">
              Kasatune
            </span>
          </div>

          {/* Clean Underline Tabs: Masuk | Daftar */}
          <div className="flex items-center gap-6 border-b border-white/[0.08] mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`pb-3 text-sm font-semibold border-b-2 -mb-px cursor-pointer ${
                mode === 'login'
                  ? 'border-[#CE7F20] text-[#EEDFC7]'
                  : 'border-transparent text-[#68625B]'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`pb-3 text-sm font-semibold border-b-2 -mb-px cursor-pointer ${
                mode === 'register'
                  ? 'border-[#CE7F20] text-[#EEDFC7]'
                  : 'border-transparent text-[#68625B]'
              }`}
            >
              Daftar
            </button>
          </div>

          {/* Form Heading */}
          <div className="mb-5 space-y-1">
            <h1 className="text-xl font-bold text-[#EEDFC7] tracking-tight">
              {mode === 'login' ? 'Selamat datang kembali' : 'Buat akun baru'}
            </h1>
            <p className="text-xs text-[#9A9288]">
              {mode === 'login'
                ? 'Masuk dengan email atau akun Google kamu.'
                : 'Daftar sekali untuk menyimpan musik dan playlist kamu.'}
            </p>
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-[#9A9288]">
                  Nama <span className="text-[#68625B]">(Opsional)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#68625B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama panggilan kamu"
                    autoComplete="name"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#18181A] border border-white/[0.09] focus:border-[#CE7F20] text-sm text-[#EEDFC7] placeholder-[#68625B] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#9A9288]">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#68625B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#18181A] border border-white/[0.09] focus:border-[#CE7F20] text-sm text-[#EEDFC7] placeholder-[#68625B] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#9A9288]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#68625B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={mode === 'register' ? 6 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Minimal 6 karakter' : 'Masukkan password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#18181A] border border-white/[0.09] focus:border-[#CE7F20] text-sm text-[#EEDFC7] placeholder-[#68625B] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#68625B] cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="px-3.5 py-2.5 rounded-xl bg-[#53341A]/45 border border-[#CE7F20]/50 text-xs text-[#EEDFC7] leading-relaxed">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full h-11 rounded-xl bg-[#CE7F20] text-[#0B0B0C] text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{mode === 'login' ? 'Masuk' : 'Buat Akun'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-[11px] text-[#68625B]">atau</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting || isGoogleLoading}
            className="w-full h-11 px-4 rounded-xl bg-[#18181A] border border-white/[0.1] text-sm font-medium text-[#EEDFC7] flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#CE7F20]" />
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-1.99 3.72-4.93 3.72-8.69z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.7-2.87c-1.02.68-2.32 1.09-3.58 1.09-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
              </svg>
            )}
            <span>Lanjutkan dengan Google</span>
          </button>

          {/* Bottom Switch Hint */}
          <p className="text-center text-xs text-[#9A9288] mt-5">
            {mode === 'login' ? (
              <>
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-[#CE7F20] font-semibold cursor-pointer"
                >
                  Daftar
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-[#CE7F20] font-semibold cursor-pointer"
                >
                  Masuk
                </button>
              </>
            )}
          </p>
        </section>
      </div>
    </div>
  );
};
