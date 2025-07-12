import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const login = searchParams.get('login');
  const bankName = searchParams.get('name');

  if (!login || !bankName) {
    return NextResponse.json(
      { error: 'Login and name parameters are required' },
      { status: 400 }
    );
  }

  // Проверка авторизации через /api/me
  try {
    const cookieHeader = cookies().toString();
    const meRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/me`, {
      method: 'GET',
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!meRes.ok) {
      return NextResponse.json({ error: 'Unauthorized (me endpoint failed)' }, { status: 401 });
    }
    const me = await meRes.json();
    if (!me.login || me.login !== login) {
      return NextResponse.json({ error: 'Forbidden: login mismatch' }, { status: 403 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Authorization check failed' }, { status: 401 });
  }

  const client = createClient({
    url: 'redis://127.0.0.1:6379'
  });

  try {
    try {
      await client.connect();
    } catch (redisError) {

      return await fetchFromDatabase(login, bankName);
    }

    const cacheKey = `${login}_${bankName}`;
    
    const cachedData = await client.get(cacheKey);
    
    if (cachedData && cachedData !== 'null') {
      
      
      const bankAccountData = JSON.parse(cachedData);
      await client.disconnect();
      
      return NextResponse.json({
        success: true,
        data: bankAccountData,
        source: 'redis_cache'
      }, { status: 200 });
    }

    
    
    const dbResponse = await fetchFromDatabase(login, bankName);
    const dbData = await dbResponse.json();
    
    if (dbResponse.status === 200 && dbData.success && dbData.data) {
      await client.setex(cacheKey, 1500, JSON.stringify(dbData.data)); 
      
      
      await client.disconnect();
      
      return NextResponse.json({
        success: true,
        data: dbData.data,
        source: 'database'
      }, { status: 200 });
    }

    await client.disconnect();
    return dbResponse; 

  } catch (error) {
    try {
      await client.disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting Redis:', disconnectError);
    }
    
    console.error('Error in getBankAccountInfoRedis:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

async function fetchFromDatabase(login: string, bankName: string) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/getBankAccountInfo?login=${encodeURIComponent(login)}&name=${encodeURIComponent(bankName)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (response.ok) {
      return response;
    } else {
      console.error('Error requesting getBankAccountInfo:', response.status);
      return NextResponse.json(
        { error: 'Error fetching data from database' }, 
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Connection error to getBankAccountInfo:', error);
    return NextResponse.json(
      { error: 'Database connection error' }, 
      { status: 500 }
    );
  }
}
