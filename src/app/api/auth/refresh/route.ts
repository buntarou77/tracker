import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateTokens } from '../auth';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 401 }
      );
    }

    const decoded = verifyRefreshToken(refreshToken);

    const tokens = generateTokens({
      id: decoded.id,
      login: decoded.login,
      email: decoded.email
    });

    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    response.cookies.set('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60,
      path: '/',
      sameSite: 'strict',
    });

    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      sameSite: 'strict',
    });

    return response;

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid refresh token:' + error},
      { status: 401 }
    );
  }
}