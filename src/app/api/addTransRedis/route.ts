import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { amount, category, date, login, type, bankName, balanceStatus } = data;
  
  const client = createClient({ url: 'redis://127.0.0.1:6379' });
  
  try {
    await client.connect();
    
    // First add to MongoDB (source of truth)
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
    
    // If MongoDB update successful, update Redis cache
    try {
      const newBalance = result.newBalance;
      const monthKey = result.monthKey;
      
      // Update transaction cache in Redis
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
        // Update transactions cache
        const transRedisKey = `${login}_${bankName}_transactions`;
        const existingTrans = await client.get(transRedisKey);
        
        if (existingTrans) {
          const redisTransactions = JSON.parse(existingTrans);
          
          // Create new transaction for Redis
          const newTransaction = {
            amount: Number(amount),
            category,
            date: new Date(date),
            createdAt: new Date(),
            id: Date.now(),
            type,
            balanceStatus
          };
          
          // Add transaction to appropriate month
          if (!redisTransactions[monthKey]) {
            redisTransactions[monthKey] = [];
          }
          redisTransactions[monthKey].push(newTransaction);
          
          await client.setEx(transRedisKey, 60 * 60 * 24, JSON.stringify(redisTransactions));
        }
      }
      
      // Update balance cache
      const balanceKey = `${login}_${bankName}_balance`;
      await client.setEx(balanceKey, 60 * 60 * 24, newBalance.toString());
      
      // Update bankNames cache with new balance
      const bankNamesKey = `bankNames_${login}`;
      const bankNamesData = await client.get(bankNamesKey);
      
      if (bankNamesData) {
        let bankNames = [];
        try {
          const parsed = JSON.parse(bankNamesData);
          bankNames = parsed.bankAccounts || parsed || [];
        } catch (e) {
          console.error('Error parsing bankNames Redis data:', e);
          bankNames = [];
        }
        
        // Find and update the specific bank balance
        const bankIndex = bankNames.findIndex((bank: any) => bank.name === bankName);
        if (bankIndex !== -1) {
          bankNames[bankIndex].balance = newBalance;
          
          // Save updated bankNames back to Redis
          await client.setEx(bankNamesKey, 60 * 60 * 24, JSON.stringify(bankNames));
        }
      }
      
    } catch (redisError) {
      console.error('Redis cache update error:', redisError);
      // Continue even if Redis fails - MongoDB is source of truth
    }
    
    await client.quit();
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    console.error('Error in addTransRedis:', error);
    try {
      await client.quit();
    } catch (e) {
      console.error('Error closing Redis connection:', e);
    }
    
    return NextResponse.json(
      { error: 'Failed to add transaction' },
      { status: 500 }
    );
  }
} 