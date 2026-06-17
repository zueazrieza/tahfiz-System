import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export type AuthUser = {
  id: number;
  name: string;
  full_name?: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent' | 'student';
  status: string;
  linked_id?: number;
} | null;

// ── Module-level shared state ───────────────────────────────────────────────
let _cachedUser: AuthUser | undefined = undefined;
let _fetchPromise: Promise<AuthUser> | null = null;

// Listeners so all mounted useAuth() hooks re-render when cache changes
const _listeners = new Set<() => void>();

function notifyListeners() {
  _listeners.forEach((fn) => fn());
}

async function fetchMe(): Promise<AuthUser> {
  if (_fetchPromise) return _fetchPromise;
  _fetchPromise = axios
    .get('/api/me', { withCredentials: true })
    .then((r) => {
      const user = r.data.user ?? null;
      _cachedUser = user as AuthUser;

      if (user) {
        // Sync with legacy components expecting storage-based auth
        const authPayload = JSON.stringify({
          role: user.role,
          name: user.name,
          full_name: user.full_name,
          userId: user.id,
          id: user.id,
          email: user.email,
          linked_id: user.linked_id,
        });
        sessionStorage.setItem('authUser', authPayload);
        localStorage.setItem('authUser', authPayload);
      } else {
        sessionStorage.removeItem('authUser');
        localStorage.removeItem('authUser');
      }

      return _cachedUser;
    })
    .catch(() => {
      _cachedUser = null;
      sessionStorage.removeItem('authUser');
      localStorage.removeItem('authUser');
      return null;
    })
    .finally(() => {
      _fetchPromise = null;
      notifyListeners();
    });
  return _fetchPromise;
}

/**
 * Call this after login or logout so all mounted useAuth() hooks
 * immediately start a fresh /api/me fetch.
 */
export function clearAuthCache() {
  _cachedUser = undefined;
  _fetchPromise = null;
  sessionStorage.removeItem('authUser');
  localStorage.removeItem('authUser');
  notifyListeners(); // triggers re-render → loading=true → re-fetch
}

/**
 * Server-verified auth hook.
 * Source of truth is always GET /api/me (Sanctum session cookie).
 * localStorage is NOT used for auth decisions.
 *
 * Works correctly across navigate() calls because it subscribes to the
 * module-level listener set rather than relying on React remounting.
 */
export function useAuth() {
  // Derive initial state from module cache each render
  const [tick, setTick] = useState(0); // forces re-render when cache clears
  const [user, setUser] = useState<AuthUser | undefined>(_cachedUser);
  const [loading, setLoading] = useState(_cachedUser === undefined);

  useEffect(() => {
    // Subscribe to cache-clear events
    const rerender = () => setTick((t) => t + 1);
    _listeners.add(rerender);
    return () => { _listeners.delete(rerender); };
  }, []);

  useEffect(() => {
    if (_cachedUser !== undefined) {
      setUser(_cachedUser);
      setLoading(false);
      return;
    }
    // Cache was cleared (or first mount) — fetch fresh
    setLoading(true);
    fetchMe().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, [tick]); // re-run whenever clearAuthCache() fires

  const refresh = useCallback(async () => {
    clearAuthCache(); // triggers tick increment via listener
  }, []);

  return { user, loading, refresh };
}
