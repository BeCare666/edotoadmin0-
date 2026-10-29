import Cookie from 'js-cookie';
import SSRCookie from 'cookie';
import {
  AUTH_CRED,
  EMAIL_VERIFIED,
  PERMISSIONS,
  STAFF,
  STORE_OWNER,
  SUPER_ADMIN,
  TOKEN,
} from './constants';

export const allowedRoles = [SUPER_ADMIN, STORE_OWNER, STAFF];
export const adminAndOwnerOnly = [SUPER_ADMIN, STORE_OWNER];
export const adminOwnerAndStaffOnly = [SUPER_ADMIN, STORE_OWNER, STAFF];
export const adminOnly = [SUPER_ADMIN];
export const ownerOnly = [STORE_OWNER];
export const ownerAndStaffOnly = [STORE_OWNER, STAFF];

// Audit sécurité 2.6 (29/10/2026) : cookie de session envoyé seulement en HTTPS (sauf poste local en http),
// jamais depuis un autre site, et 12 h au plus ; plus aucune copie du jeton dans localStorage.
export const AUTH_COOKIE_OPTIONS: Cookie.CookieAttributes = {
  secure: typeof window === 'undefined' || window.location.protocol === 'https:',
  sameSite: 'strict',
  expires: 0.5,
};

export function setAuthCredentials(token: string, permissions: any, role: any) {
  Cookie.set(AUTH_CRED, JSON.stringify({ token, permissions, role }), AUTH_COOKIE_OPTIONS);
  removeLegacyToken();
}

/** Ancienne copie du jeton (avant le 29/10/2026) : effacée */
export function removeLegacyToken() {
  try {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
  } catch {
    /* stockage indisponible */
  }
}
export function setEmailVerified(emailVerified: boolean) {
  // Audit 2.9 (M6) : mêmes protections que le cookie de session (ce cookie ne commande qu'une redirection ;
  // la vérification réelle est faite par l'API, qui répond 409 sur /me)
  Cookie.set(EMAIL_VERIFIED, JSON.stringify({ emailVerified }), AUTH_COOKIE_OPTIONS);
}
export function getEmailVerified(): {
  emailVerified: boolean;
} {
  const emailVerified = Cookie.get(EMAIL_VERIFIED);
  return emailVerified ? JSON.parse(emailVerified) : { emailVerified: false };
}

export function getAuthCredentials(context?: any): {
  token: string | null;
  permissions: string[] | null;
  role: string | null;
} {
  let authCred;
  if (context) {
    authCred = parseSSRCookie(context)[AUTH_CRED];
  } else {
    authCred = Cookie.get(AUTH_CRED);
  }
  if (authCred) {
    return JSON.parse(authCred);
  }
  return { token: null, permissions: null, role: null };
}

export function parseSSRCookie(context: any) {
  return SSRCookie.parse(context.req.headers.cookie ?? '');
}

export function hasAccess(
  _allowedRoles: string[],
  _userPermissions: string[] | undefined | null,
) {
  if (_userPermissions) {
    return Boolean(
      _allowedRoles?.find((aRole) => _userPermissions.includes(aRole)),
    );
  }
  return false;
}

export function isAuthenticated(_cookies: any) {
  return (
    !!_cookies[TOKEN] &&
    Array.isArray(_cookies[PERMISSIONS]) &&
    !!_cookies[PERMISSIONS].length
  );
}
