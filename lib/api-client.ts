import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider?: string;
}

export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return 'guest_default_user';
  let guestId = localStorage.getItem('cerebro_guest_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem('cerebro_guest_id', guestId);
  }
  return guestId;
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
    if (user.email) headers['x-user-email'] = user.email;
    if (user.name) headers['x-user-name'] = user.name;
  } else if (user?.email) {
    headers['x-user-id'] = user.email;
    headers['x-user-email'] = user.email;
    if (user.name) headers['x-user-name'] = user.name;
  } else {
    // If not logged in yet, generate and use persistent guest ID so notes/folders are never blocked
    const guestId = getOrCreateGuestId();
    headers['x-user-id'] = guestId;
    headers['x-user-email'] = `${guestId}@cerebro.local`;
    headers['x-user-name'] = 'Guest User';
  }
  
  return headers;
}

export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  
  // If no user headers yet, attempt to read directly from Supabase session
  if (!headers.has('x-user-id')) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        headers.set('x-user-id', session.user.id);
        if (session.user.email) headers.set('x-user-email', session.user.email);
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0];
        if (name) headers.set('x-user-name', name);
      }
    } catch (e) {
      // ignore
    }
  }

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
