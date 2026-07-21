import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET is not set'); })();
export async function GET(request: NextRequest) {
const cookieStore = cookies();
    const token = cookieStore.get('accessToken')?.value;
    
    if (!token) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    let userId: string;
    try {
        const verified = jwt.verify(token, JWT_SECRET) as TokenPayload;
        userId = verified.id;
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
        );
      }

    const { searchParams } = new URL(request.url);
    const baseCurrency = searchParams.get('base');

    if (!baseCurrency) {
      return NextResponse.json(
        { error: 'Base currency is required' }, 
        { status: 400 }
      );
    }

  try {
    const response = await fetch(
      `https://open.er-api.com/v6/latest/${baseCurrency}`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch exchange rates from external API' }, 
        { status: 500 }
      );
    }

    const data = await response.json();
    
    
    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}