// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { cookies } from 'next/headers';


// async function authMiddleware(req: NextRequest) {
//   const path = req.nextUrl.pathname;

//   const isPublicPath =
//     path.includes('/api/login') ||
//     path.includes('/api/register') ||
//     path.includes('/api/auth') ||
//     path.includes('/api/me') ||
//     path.includes('/api/noSql');

//   if (isPublicPath) return NextResponse.next();

//   const token = cookies().get('accessToken')?.value;
//   const refreshToken = cookies().get('refreshToken')?.value;

//   if (!token || !refreshToken) {
//     return NextResponse.json(
//       { error: 'Unauthorized - No token provided' },
//       { status: 401 }
//     );
//   }

//   return NextResponse.next();
// }
// export async function middleware(req: NextRequest) {

//   return await authMiddleware(req);
// }

// export const config = {
//   matcher: [ 
//     "/api/addNewAccount/:path*",
//     "/api/addPlan/:path*",
//     "/api/addTrans/:path*",
//     "/api/deleteAccount/:path*",
//     "/api/deletePlan/:path*",
//     "/api/deleteTarget/:path*",
//     "/api/delTrans/:path*",
//     "/api/get/:path*",
//     "/api/getAnalyticsCache/:path*",
//     "/api/getBalance/:path*",
//     "/api/getBankAccountInfo/:path*",
//     "/api/getBankAccounts/:path*",
//     "/api/getBankNames/:path*",
//     "/api/getExchangeRate/:path*",
//     "/api/getPlans/:path*",
//     // '/api/getTrans/:path*',
//     "/api/loadmoreTrans/:path*",
//     "/api/rewritePlan/:path*",
//   ],
// };
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
console.log('catch')
export default createMiddleware(routing);
 
export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
}