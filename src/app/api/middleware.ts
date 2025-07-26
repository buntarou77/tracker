import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from './auth/auth';
import { cookies } from 'next/headers';
import { config as appConfig } from '../../../lib/config';
import jwt from 'jsonwebtoken';
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path.includes('/api/login') || 
                       path.includes('/api/register') || 
                       path.includes('/api/auth') || 
                       path.includes('/api/me') || 
                       path.includes('/api/noSql');
  
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  const token = cookies().get('accessToken')?.value;
  const refreshToken = cookies().get('refreshToken')?.value;
  if (!token || !refreshToken) {
    return NextResponse.json(
      { error: 'Unauthorized - No token provided' },
      { status: 401 }
    );
  }
  const JWT_SECRET = appConfig.jwt.secret;
  const REFRESH_SECRET = appConfig.jwt.refreshSecret;
  try {
    jwt.verify(token, JWT_SECRET);
    jwt.verify(refreshToken, REFRESH_SECRET);
    return NextResponse.next();
  } catch (err) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid token' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: [
    '/api/addNewAccount/:path*',
    '/api/addNewAccountRedis/:path*',
    '/api/addPlan/:path*',
    '/api/addTrans/:path*',
    '/api/addTransRedis/:path*',
    '/api/deleteAccount/:path*',
    '/api/deleteAccountRedis/:path*',
    '/api/deletePlan/:path*',
    '/api/deleteTarget/:path*',
    '/api/delTrans/:path*',
    '/api/delTransRedis/:path*',
    '/api/get/:path*',
    '/api/getAnalyticsCache/:path*',
    '/api/getBalance/:path*',
    '/api/getBalanceRedis/:path*',
    '/api/getBankAccountInfo/:path*',
    '/api/getBankAccounts/:path*',
    '/api/getBankAccountsRedis/:path*',
    '/api/getBankAccoutnInfoRedis/:path*',
    '/api/getBankNames/:path*',
    '/api/getBankNamesRedis/:path*',
    '/api/getExchangeRate/:path*',
    '/api/getPlans/:path*',
    '/api/getTrans/:path*',
    '/api/getTransRedis/:path*',
    '/api/loadmoreTrans/:path*',
    '/api/revalidateBankNamesRedis/:path*',
    '/api/rewritePlan/:path*'
  ]
}; 