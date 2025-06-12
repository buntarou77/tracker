import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '../auth/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = ['/login', '/register'].includes(path);
  const token = request.cookies.get('accessToken')?.value;
  console.log('check')
  if (isPublicPath) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
    }
    return NextResponse.next();
  }
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  try {
    verifyAccessToken(token);
    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }
}

export const config = {
  matcher: [
    '/operations',
    '/dashboard',
    '/profile',
    '/login',
    '/register'
  ]
};