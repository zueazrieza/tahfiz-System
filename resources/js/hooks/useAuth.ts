import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent' | 'student';
  status: string;
  linked_id?: number;
} | null;

// Module-level cache so multiple components share one fetch
let _cachedUser: AuthUser | undefined = undefined;
let _fetchPromise: Promise<AuthUser> | null = null;

async function fetchMe(): Promise<AuthUser> {
  if (_fetchPromise) return _fetchPromise;
  _fetchPromise = axios
    .get('/api/me', { withCredentials: true })
    .then((r) => {
      _cachedUser = r.data.user ?? null;
      return _cachedUser as AuthUser;
    })
    .catch(() => {
      _cachedUser = null;
      return null;
    })
    .finally(() => {
      _fetchPromise = null;
    });
  return _fetchPromise;
}

export function clearAuthCache() {
  _cachedUser = undefined;
  _fetchPromise = null;
}

/**
 * Server-verified auth hook.
 * The source of truth is always GET /api/me (Sanctum session cookie).
 * localStorage is NOT used for auth decisions.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | undefined>(_cachedUser);
  const [loading, setLoading] = useState(_cachedUser === undefined);

  useEffect(() => {
    if (_cachedUser !== undefined) {
      setUser(_cachedUser);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMe().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const refresh = useCallback(async () => {
    clearAuthCache();
    setLoading(true);
    const u = await fetchMe();
    setUser(u);
    setLoading(false);
    return u;
  }, []);

  return { user, loading, refresh };
}
