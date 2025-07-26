import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';
import { cookies } from 'next/headers';
import { config } from '../../../../lib/config';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { amount, category, date, login, type, bankName, balanceStatus } = data;
  
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

  const client = createClient({ url: config.redis.url });
  
  try {
    await client.connect();
    
    const res = await fetch(`http://localhost:3000/api/addTrans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, category, date, login, type, bankName, balanceStatus })
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      await client.quit();
      return NextResponse.json(result, { status: res.status });
    }

    try {
      const newBalance = result.newBalance;
      const monthKey = result.monthKey;
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      const transactionDate = new Date(date);
      const transYear = transactionDate.getFullYear();
      const transMonth = transactionDate.getMonth();
      
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear = currentYear - 1;
      }
      
      const isCurrentMonth = (transYear === currentYear && transMonth === currentMonth);
      const isPrevMonth = (transYear === prevYear && transMonth === prevMonth);
      
      if (isCurrentMonth || isPrevMonth) {
        const transRedisKey = `${login}_${bankName}_transactions`;
        const existingTrans = await client.get(transRedisKey);
        
        if (existingTrans) {
          const redisTransactions = JSON.parse(existingTrans);
          
          const newTransaction = {
            amount: Number(amount),
            category,
            date: new Date(date),
            createdAt: new Date(),
            id: Date.now(),
            type,
            balanceStatus
          };
          
          if (!redisTransactions[monthKey]) {
            redisTransactions[monthKey] = [];
          }
          redisTransactions[monthKey].push(newTransaction);
          
          await client.setEx(transRedisKey, 60 * 60 * 24, JSON.stringify(redisTransactions));
        }
      }
      
      const balanceKey = `${login}_${bankName}_balance`;
      await client.setEx(balanceKey, 60 * 60 * 24, newBalance.toString());
      
      const bankNamesKey = `bankNames_${login}`;
      const bankNamesData = await client.get(bankNamesKey);
      
      if (bankNamesData) {
        let bankNames = [];
        try {
          const parsed = JSON.parse(bankNamesData);
          bankNames = parsed.bankAccounts || parsed || [];
        } catch (e) {
          bankNames = [];
        }
        
        const bankIndex = bankNames.findIndex((bank: any) => bank.name === bankName);
        if (bankIndex !== -1) {
          bankNames[bankIndex].balance = newBalance;
          
          await client.setEx(bankNamesKey, 60 * 60 * 24, JSON.stringify(bankNames));
        }
      }
      
    } catch (redisError) {
    }
    
    await client.quit();
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    try {
      await client.quit();
    } catch (e) {
    }
    
    return NextResponse.json(
      { error: 'Failed to add transaction' },
      { status: 500 }
    );
  }
} 