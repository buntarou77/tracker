import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import { NextApiResponse } from 'next';

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-secret';
const REFRESH_SECRET = `${JWT_SECRET}-refresh`;
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';

interface TokenPayload {
  id: string;
  login: string;
  email: string;
}

export function generateTokens(payload: TokenPayload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
  return { accessToken, refreshToken };
}

export function setTokenCookies(res: NextApiResponse, tokens: { accessToken: string; refreshToken: string }) {
  res.setHeader('Set-Cookie', [
    serialize('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60, 
      path: '/',
      sameSite: 'strict',
    }),
    serialize('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      sameSite: 'strict',
    })
  ]);
}

export function clearTokenCookies(res: NextApiResponse) {
  res.setHeader('Set-Cookie', [
    serialize('accessToken', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    }),
    serialize('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    })
  ]);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}

export function parseCookies(req: { headers: { cookie?: string } }) {
  return parse(req.headers.cookie || '');
}