import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '../auth/auth'
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    return NextResponse.json(
      { user: decoded },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'invalid token:' + error },
      { status: 401 }
    );
  }
}