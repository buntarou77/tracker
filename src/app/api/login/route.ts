import { NextResponse } from 'next/server';
import { query } from '../db';
import bcryptjs from 'bcryptjs';
import { generateTokens} from '../auth/auth';
interface User {
  id: number;
  login: string;
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return NextResponse.json(
        { error: "Login and password are required" },
        { status: 400 }
      );
    }

    const users = await query(
      "SELECT * FROM usersitems WHERE login = ?",
      [login]
    ) as User[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Incorrect login or password" },
        { status: 400 }
      );
    }

    const user = users[0];
    const isPasswordValid = await bcryptjs.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Incorrect login or password" },
        { status: 400 }
      );
    }

    const { password: _, ...userWithoutPassword } = user;


    const tokens = generateTokens({
      id: user.id,
      login: user.login,
      email: user.email
    });

    const response = NextResponse.json(
      { 
        success: true, 
        user: userWithoutPassword 
      },
      { status: 200 }
    );
    response.cookies.set('info_token', login, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 60,
      domain: 'localhost',
      path: '/',
      sameSite: 'lax',
    });
    response.cookies.set('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60,
      domain: 'localhost',
      path: '/',
      sameSite: 'lax',
    });
    console.log(111)
    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      domain: 'localhost',
      sameSite: 'lax',
    });
    
    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
