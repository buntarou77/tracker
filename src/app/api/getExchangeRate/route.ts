import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { config } from '../../../../lib/config';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const baseCurrency = searchParams.get('base');
    try {
      const cookieHeader = cookies().toString();
      const meRes = await fetch(`${config.app.baseUrl}/api/me`, {
        method: 'GET',
        headers: { Cookie: cookieHeader },
        cache: 'no-store',
      });
      if (!meRes.ok) {
        return NextResponse.json({ error: 'Unauthorized (me endpoint failed)' }, { status: 401 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Authorization check failed' }, { status: 401 });
    }
    const KONVERT_TOKEN = config.konvert.token;

    

    
    if (!baseCurrency) {
      return NextResponse.json(
        { error: 'Base currency is required' }, 
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${KONVERT_TOKEN}/latest/${baseCurrency}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 600 }
      }
    );
    
    if (!response.ok) {
      console.error('Ошибка запроса к внешнему API:', response.status);
      return NextResponse.json(
        { error: 'Failed to fetch exchange rates from external API' }, 
        { status: 500 }
      );
    }

    const data = await response.json();
    
    
    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    console.error('Ошибка в API getExchangeRate:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}