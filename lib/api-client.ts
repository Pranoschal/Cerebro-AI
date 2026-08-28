import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider?: string;
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cerebro_user_auth');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing stored user auth:', e);
  }
  return null;
}

export function getAuthHeaders(): Record<string, string> {
  const user = getStoredUser();
  const headers: Record<string, string> = {};
  if (user?.id) {
    headers['x-user-id'] = user.id;
  } else if (user?.email) {
    headers['x-user-id'] = user.email;
  }
  if (user?.email) headers['x-user-email'] = user.email;
  if (user?.name) headers['x-user-name'] = user.name;
  return headers;
}

export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  const authHeaders = getAuthHeaders();
  
  for (const [key, value] of Object.entries(authHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  return fetch(url, {
    ...init,
    headers,
  });
}
