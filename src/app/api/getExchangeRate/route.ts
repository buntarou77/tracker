import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const baseCurrency = searchParams.get('base');
    
    const KONVERT_TOKEN = process.env.KONVERT_TOKEN;

    

    
    if (!baseCurrency) {
      return NextResponse.json(
        { error: 'Base currency is required' }, 
        { status: 400 }
      );
    }
    
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/46be24096b6927fd6c4bb7cc/latest/${baseCurrency}`,
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