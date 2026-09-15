import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_real_estate_platform_2026';
import { AUTH_COOKIE_NAME, TOKEN_COOKIE_NAME, TokenPayload, parseTokenPayload } from './session';
export { AUTH_COOKIE_NAME, TOKEN_COOKIE_NAME, type TokenPayload, parseTokenPayload };

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: Omit<TokenPayload, 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(tokenOverride?: string): Promise<TokenPayload | null> {
  try {
    let token = tokenOverride;
    if (!token) {
      const cookieStore = cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    }
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function createAuthCookieHeader(token: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  return `${AUTH_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${
    isProd ? '; Secure' : ''
  }`;
}

export function createClearAuthCookieHeader(): string {
  const isProd = process.env.NODE_ENV === 'production';
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${
    isProd ? '; Secure' : ''
  }`;
}
