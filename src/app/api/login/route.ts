import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { MongoClient } from 'mongodb';
import { generateTokens } from '../auth/auth';

interface User {
  _id: string;
  user: string;
  email: string;
  pass_hash: string;
  active: number;
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

    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    try {
      await client.connect();
      const db = client.db('users');
      // Ищем пользователя в коллекции auth_users
      const user = await db.collection('users').findOne({
        user: login
      }) as User | null;

      if (!user) {
        return NextResponse.json(
          { error: "Incorrect login or password" },
          { status: 400 }
        );
      }
      const isPasswordValid = await bcryptjs.compare(password, user.pass_hash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Incorrect login or password" },
          { status: 400 }
        );
      }

      const { pass_hash, ...userWithoutPassword } = user;

      const tokens = generateTokens({
        id: user._id.toString(),
        login: user.user,
        email: user.email
      });

      const response = NextResponse.json(
        { 
          success: true, 
          user: {
            id: user._id.toString(),
            user: user.user,
            email: user.email,
            active: user.active
          }
        },
        { status: 200 }
      );

      response.cookies.set('info_token', login, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 60,
        path: '/',
        sameSite: 'lax',
      });
      
      response.cookies.set('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60,
        path: '/',
        sameSite: 'lax',
      });
      
      response.cookies.set('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
        sameSite: 'lax',
      });

      return response;
    } finally {
      await client.close();
    }
  } catch (error) {

    return NextResponse.json(
      { error: "An error occurred during login", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
