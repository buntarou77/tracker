import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimits } from './app/lib/requestToEnvKey';
import { Redis } from '@upstash/redis'
import getEnv from './app/lib/getEnv';

const url = getEnv('REDIS_HOST_URI');
const token = getEnv('REDIS_HOST_TOKEN');

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
  '/api/getUserData',
  '/api/_middleware',
  '/api/resetEmail',
  '/api/resetPassword',
  '/api/rewritePlan',
  '/api/transactions',
  '/api/types',
];

const protectRoutes = [
  'addNewAccount',
  'addTrans',
  'changeUsername',
  'genResetCode'    ,  
  'getExchangeRate'  ,
  'getTrans',
  'login',
  'me',
  'register',
  'resetPassword',
  'transactions',
  'addPlan',
  'auth',
  'mainInfo',
  '_middleware',
  'resetEmail',
  'rewritePlan'    
]

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api')) {

    
    const routeName = pathname.split('/')[2]; 
    
    if(rateLimits[routeName]){
    let { max, window } = rateLimits[routeName] 
    const maxNumber = +max
    const windowNumber = +window

    const redisClient = new Redis({
      url,
      token
    });

    if(isNaN(maxNumber) || isNaN(windowNumber)){
      return NextResponse.json(
        {error: 'server error'},
        {status: 500}
      )
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const timestamp = Date.now();

    const key = `rl:${routeName}:${ip}`

    await redisClient.zremrangebyscore(key, 0, timestamp - windowNumber * 1000);
    const exist = await redisClient.zcard(key);

    if(exist >= maxNumber){
      return NextResponse.json(
        {error: 'too many requsts'},
        {status: 429}
      )
    }

    await redisClient.zadd(key, {
      score: timestamp,
      member: `request_${timestamp}`,
    });

    await redisClient.expire(key, windowNumber);
    }
    
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
  
  
  // const isPublicRoute = publicRoutes.some(route => pathname.includes(route));
  // if (isPublicRoute) {
  //   return intlMiddleware(request);
  // }
  
  // const isProtectedRoute = protectedRoutes.some(route => pathname.includes(route));
  // if (isProtectedRoute) {
  //   const accessToken = request.cookies.get('accessToken')?.value;
  //   const refreshToken = request.cookies.get('refreshToken')?.value;
  //   if(refreshToken){
  //     return intlMiddleware(request);
  //   }
  //   if (!accessToken) {
  //     return NextResponse.redirect(new URL('/en/login', request.url));
  //   }
  // }
  
  return intlMiddleware(request);
}

export const config = {
  matcher: '/((?!_next|_vercel|.*\\..*).*)'
};