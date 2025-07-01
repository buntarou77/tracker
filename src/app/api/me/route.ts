import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '../auth/auth';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 401 }
      );
    }

    // Проверяем валидность access token
    let userData;
    try {
      userData = verifyAccessToken(accessToken);
    } catch (error) {
      return NextResponse.json(
        { error: 'Access token expired or invalid' },
        { status: 401 }
      );
    }

    // Возвращаем данные пользователя
    return NextResponse.json({
      id: userData.id,
      login: userData.login,
      email: userData.email
    }, { status: 200 });

  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred while getting user data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}