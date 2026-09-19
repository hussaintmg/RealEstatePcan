export const AUTH_COOKIE_NAME = 'auth_token';
export const TOKEN_COOKIE_NAME = AUTH_COOKIE_NAME;

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
  companyName?: string;
  isDeveloper: boolean;
  isOwner: boolean;
  role?: string;
  roleId?: string;
  exp?: number;
}

/**
 * Edge-compatible payload decoder (works in middleware/proxy without Node crypto or Buffer)
 */
export function parseTokenPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    let jsonPayload: string;
    if (typeof atob === 'function') {
      jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } else if (typeof Buffer !== 'undefined') {
      jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    } else {
      return null;
    }

    const parsed = JSON.parse(jsonPayload) as TokenPayload;
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
