import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_real_estate_platform_2026';
const TOKEN_COOKIE_NAME = 'auth_token';

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
  isDeveloper: boolean;
  isOwner: boolean;
  roleId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<TokenPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function createAuthCookieHeader(token: string): string {
  return `${TOKEN_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;
}

export function createClearAuthCookieHeader(): string {
  return `${TOKEN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
