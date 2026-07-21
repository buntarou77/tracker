import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import getEnv from '@/app/lib/getEnv';

export interface AuthUser {
  userId: string;
  login: string;
}

// Throws at module load if the secret is missing — fail closed instead of
// silently falling back to an empty secret (which would let anyone forge tokens).
const JWT_SECRET = getEnv('JWT_SECRET');

/**
 * Reads and verifies the accessToken cookie.
 * Returns the authenticated user or null if the token is missing/invalid.
 */
export function getAuthUser(): AuthUser | null {
  const token = cookies().get('accessToken')?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; login: string };
    if (!payload?.id) return null;
    return { userId: payload.id, login: payload.login };
  } catch {
    return null;
  }
}
