import { NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const login = searchParams.get('login');
  const bankName = searchParams.get('bankName');
  console.log(login)
  console.log(bankName)
  if (!login || !bankName) {
    console.log('Missing login or bankName')
    console.log(login)
    console.log(bankName)
    return NextResponse.json({ error: 'Missing login or bankName' }, { status: 400 });
  }

  const client = createClient({
    url: 'redis://127.0.0.1:6379'
  });

  try {
    await client.connect();
    
    const redisKey = `${login}_${bankName}_transactions`;
    const cachedTrans = await client.get(redisKey);
    
    if (cachedTrans && cachedTrans !== 'null') {
      const value = JSON.parse(cachedTrans);
      await client.disconnect();
      return NextResponse.json({ value }, { status: 200 });
    }

    try {
      const response = await fetch(`http://localhost:3000/api/getTrans?login=${login}&bankName=${bankName}`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Группируем транзакции по monthKey (YYYY-MM)
        const monthTrans: { [key: string]: any[] } = {};
        
        data.transactions.forEach((trans: any) => {
          const transDate = new Date(trans.date);
          const year = transDate.getFullYear();
          const month = String(transDate.getMonth() + 1).padStart(2, '0');
          const monthKey = `${year}-${month}`;
          
          if (!monthTrans[monthKey]) {
            monthTrans[monthKey] = [];
          }
          monthTrans[monthKey].push(trans);
        });

        // Кэшируем данные (TTL 30 минут)
        await client.setEx(redisKey, 1800, JSON.stringify(monthTrans));
        
        await client.disconnect();
        return NextResponse.json({ value: monthTrans }, { status: 200 });
      } else {
        await client.disconnect();
        
        return NextResponse.json({ error: 'Failed to fetch transactions from database' }, { status: 400 });
      }
    } catch (fetchError) {
      await client.disconnect();
      return NextResponse.json({ error: 'Error fetching transactions' }, { status: 500 });
    }

  } catch (redisError) {
    // Если Redis недоступен, получаем данные напрямую из БД
    try {
      const response = await fetch(`http://localhost:3000/api/getTrans?login=${login}&bankName=${bankName}`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Группируем транзакции по monthKey
        const monthTrans: { [key: string]: any[] } = {};
        
        data.transactions.forEach((trans: any) => {
          const transDate = new Date(trans.date);
          const year = transDate.getFullYear();
          const month = String(transDate.getMonth() + 1).padStart(2, '0');
          const monthKey = `${year}-${month}`;
          
          if (!monthTrans[monthKey]) {
            monthTrans[monthKey] = [];
          }
          monthTrans[monthKey].push(trans);
        });

        return NextResponse.json({ value: monthTrans }, { status: 200 });
      } else {
        
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 400 });
      }
    } catch (fallbackError) {
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 500 });
    }
  }
}