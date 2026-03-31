import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = [
  '/api/login',
  '/api/register',
  '/api/auth',
  '/api/me',
  '/api/noSql',
  '/login',
  '/register',
  'about'
];

const protectedRoutes = [
  '/api/addNewAccount',
  '/api/addPlan',
  '/api/addTrans',
  '/api/changeUsername',
  '/api/deleteAccount',
  '/api/deletePlan',
  '/api/delTrans',
  '/api/genResetCode',
  '/api/getBankAccountInfo',
  '/api/getBankAccounts',
  '/api/getBankNames',
  '/api/getExchangeRate',
  '/api/getPlans',
  '/api/getTrans',
  '/api/getUserData',
  '/api/_middleware',
  '/api/resetEmail',
  '/api/resetPassword',
  '/api/rewritePlan',
  '/api/transactions',
  '/api/types',
  '/budget',
  '/convert',
  '/analytics',
  '/operations',
  '/profile',
  '/'
];

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  if (pathname.startsWith('/api')) {
    
    const isPublicApiRoute = publicRoutes.some(route => pathname.includes(route));
    if (isPublicApiRoute) {
      return NextResponse.next(); 
    }
    
    const isProtectedApiRoute = protectedRoutes.some(route => pathname.includes(route));
    if (isProtectedApiRoute) {
      const accessToken = request.cookies.get('accessToken')?.value;
      
      if (!accessToken) {
        return NextResponse.json(
          { error: 'Unauthorized - No token provided' },
          { status: 401 }
        );
      }
      

    }
    
    return NextResponse.next();
  }
  
  
  const isPublicRoute = publicRoutes.some(route => pathname.includes(route));
  if (isPublicRoute) {
    return intlMiddleware(request);
  }
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.includes(route));
  if (isProtectedRoute) {
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.redirect(new URL('/en/login', request.url));
    }
  }
  
  return intlMiddleware(request);
}

export const config = {
  matcher: '/((?!_next|_vercel|.*\\..*).*)'
};