import { AuthUser, UserSubscription } from './types';

const TOKEN_KEY = 'voyage_auth_token';
const USER_KEY = 'voyage_auth_user';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(USER_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('voyage_auth_change'));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('voyage_auth_change'));
}

export async function loginUser(email: string, password?: string): Promise<{ token: string; user: AuthUser; subscription?: UserSubscription }> {
  try {
    const res = await fetch('/api/py/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to sign in');
    }

    const data = await res.json();
    setAuthSession(data.token, data.user);
    return data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('fetch') || msg.includes('Failed')) {
      throw new Error('Could not connect to Voyage AI backend. Ensure backend is running ("npm run dev" or "python -m backend.app").');
    }
    throw err;
  }
}

export async function registerUser(email: string, password?: string, name?: string): Promise<{ token: string; user: AuthUser }> {
  try {
    const res = await fetch('/api/py/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create account');
    }

    const data = await res.json();
    setAuthSession(data.token, data.user);
    return data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('fetch') || msg.includes('Failed')) {
      throw new Error('Could not connect to Voyage AI backend. Ensure backend is running ("npm run dev" or "python -m backend.app").');
    }
    throw err;
  }
}

export async function checkAuth(): Promise<{ authenticated: boolean; user: AuthUser | null; subscription?: UserSubscription | null }> {
  const token = getAuthToken();
  if (!token) {
    return { authenticated: false, user: null, subscription: null };
  }

  try {
    const res = await fetch('/api/py/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      clearAuthSession();
      return { authenticated: false, user: null, subscription: null };
    }

    const data = await res.json();
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return { authenticated: true, user: data.user, subscription: data.subscription };
  } catch (e) {
    console.warn('Backend connection error during auth check:', e);
    const cached = getStoredUser();
    return { authenticated: !!cached, user: cached, subscription: null };
  }
}

