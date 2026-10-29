import Cookies from 'js-cookie';
import { HttpClient } from '@/data/client/http-client';
import { AUTH_CRED } from '@/utils/constants';
import { getAuthCredentials, setAuthCredentials } from '@/utils/auth-utils';

/**
 * Session fermée après 5 min d'inactivité (décision du 29/10/2026).
 * Le jeton de l'API ne vaut que 5 min : il est renouvelé (POST /token/refresh) tant que la personne agit
 * (clic, frappe, défilement, toucher, dans n'importe quel onglet). Sans action, il expire et l'admin
 * renvoie vers la connexion. La durée maximale depuis la connexion (12 h) est contrôlée par l'API.
 */
const ACTIVITY_KEY = 'edoto-last-activity';
const CHECK_MS = 30 * 1000;
const RENEW_WHEN_LEFT_MS = 4 * 60 * 1000;

function tokenTimes(token: string): { iat: number; exp: number } | null {
  try {
    const p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof p.exp === 'number' ? { iat: (p.iat ?? 0) * 1000, exp: p.exp * 1000 } : null;
  } catch {
    return null;
  }
}

function lastActivity(): number {
  try {
    return Number(localStorage.getItem(ACTIVITY_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function startSessionKeeper(onExpired: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  let lastMark = 0;
  const mark = () => {
    const now = Date.now();
    if (now - lastMark < 5000) return;
    lastMark = now;
    try {
      localStorage.setItem(ACTIVITY_KEY, String(now));
    } catch {
      /* stockage indisponible */
    }
  };
  const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
  events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
  mark();

  let renewing = false;
  const check = async () => {
    const { token, permissions, role } = getAuthCredentials();
    if (!token) return;
    const t = tokenTimes(token);
    if (!t) return;
    const now = Date.now();
    if (t.exp <= now) {
      Cookies.remove(AUTH_CRED);
      onExpired();
      return;
    }
    if (renewing || lastActivity() <= t.iat || t.exp - now > RENEW_WHEN_LEFT_MS) return;
    renewing = true;
    try {
      const res: any = await HttpClient.post('token/refresh', {});
      if (res?.token) setAuthCredentials(res.token, permissions, role);
    } catch {
      /* session refusée (durée maximale, compte bloqué) : elle expirera d'elle-même */
    } finally {
      renewing = false;
    }
  };
  const timer = window.setInterval(check, CHECK_MS);
  check();
  return () => {
    window.clearInterval(timer);
    events.forEach((e) => window.removeEventListener(e, mark));
  };
}
