/**
 * Custom Hook: useSpotifyAuth
 * Handles OAuth 2.0 PKCE login, callback parsing, localStorage persistence, and auto token refresh
 */

import { useState, useEffect, useCallback } from 'react';
import { exchangeCodeForTokens, refreshSpotifyAccessToken, redirectToSpotifyAuthorize } from '../api/spotify';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'spotify_access_token',
  REFRESH_TOKEN: 'spotify_refresh_token',
  EXPIRES_AT: 'spotify_expires_at',
  CLIENT_ID: 'spotify_client_id',
};

export interface SpotifyAuthStatus {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clientId: string;
  setClientId: (id: string) => void;
  login: () => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<string | null>;
}

export function useSpotifyAuth(): SpotifyAuthStatus {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN));
  const [expiresAt, setExpiresAt] = useState<number>(() => parseInt(localStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || '0', 10));
  const [clientId, setClientIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Update Client ID in state and localStorage
  const setClientId = useCallback((id: string) => {
    setClientIdState(id.trim());
    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, id.trim());
  }, []);

  // Save tokens to storage & state
  const saveTokens = useCallback((tokens: { access_token: string; refresh_token?: string; expires_in: number }) => {
    const expiresTimestamp = Date.now() + (tokens.expires_in - 60) * 1000; // 60s safety buffer
    setAccessToken(tokens.access_token);
    setExpiresAt(expiresTimestamp);

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
    localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresTimestamp.toString());

    if (tokens.refresh_token) {
      setRefreshToken(tokens.refresh_token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
    }
  }, []);

  // Logout and clear credentials
  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setExpiresAt(0);
    setError(null);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    localStorage.removeItem('spotify_code_verifier');
  }, []);

  // Refresh token session
  const refreshSession = useCallback(async (): Promise<string | null> => {
    const storedRefreshToken = refreshToken || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const activeClientId = clientId || localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || import.meta.env.VITE_SPOTIFY_CLIENT_ID;

    if (!storedRefreshToken || !activeClientId) {
      logout();
      return null;
    }

    try {
      const refreshed = await refreshSpotifyAccessToken(storedRefreshToken, activeClientId);
      saveTokens(refreshed);
      return refreshed.access_token;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Session expired';
      setError(errorMsg);
      logout();
      return null;
    }
  }, [refreshToken, clientId, saveTokens, logout]);

  // Initiate PKCE authorization redirect
  const login = useCallback(async () => {
    const activeClientId = clientId || import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    if (!activeClientId) {
      setError('Spotify Client ID is required. Please set it in Settings or .env file.');
      return;
    }

    try {
      setError(null);
      const redirectUri = window.location.origin + window.location.pathname;
      await redirectToSpotifyAuthorize(activeClientId, redirectUri);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to redirect to Spotify');
    }
  }, [clientId]);

  // Handle PKCE callback or token expiration on mount
  useEffect(() => {
    let isMounted = true;

    async function handleAuthFlow() {
      setIsLoading(true);
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const authError = params.get('error');

      if (authError) {
        setError(`Spotify Auth Error: ${authError}`);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        if (isMounted) setIsLoading(false);
        return;
      }

      // If returning with code from Spotify redirect
      if (code) {
        try {
          const activeClientId = clientId || localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
          const redirectUri = window.location.origin + window.location.pathname;

          const tokens = await exchangeCodeForTokens(code, activeClientId, redirectUri);
          if (isMounted) {
            saveTokens(tokens);
            setError(null);
          }
        } catch (err: unknown) {
          if (isMounted) {
            setError(err instanceof Error ? err.message : 'Failed to complete login');
          }
        } finally {
          // Remove ?code=... from address bar for a clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          if (isMounted) setIsLoading(false);
        }
        return;
      }

      // If already stored token, check expiration
      const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const storedExpires = parseInt(localStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || '0', 10);

      if (storedToken && storedExpires > Date.now()) {
        setAccessToken(storedToken);
        setExpiresAt(storedExpires);
      } else if (storedToken && refreshToken) {
        // Expired, auto refresh
        await refreshSession();
      }

      if (isMounted) setIsLoading(false);
    }

    handleAuthFlow();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    accessToken,
    isAuthenticated: Boolean(accessToken && expiresAt > Date.now()),
    isLoading,
    error,
    clientId,
    setClientId,
    login,
    logout,
    refreshSession,
  };
}
