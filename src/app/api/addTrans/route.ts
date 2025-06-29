import { NextRequest } from "next/server";
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis'

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { amount, category, date, login, type, bankName } = data;
  const numeralAmount = Number(amount);

  if (!numeralAmount || !category || !date || !bankName) {
    return NextResponse.json(
      { text: 'one of the fields is not filled in' },
      { status: 400 }
    )
  }

  const mongoClient = new MongoClient('mongodb://localhost:27017');
  const redisClient = createClient({
    url: 'redis://127.0.0.1:6379'
  });

  try {
    await mongoClient.connect();
    await redisClient.connect();

    const db = mongoClient.db('users');
    
    const transactionDate = new Date(date);
    const year = transactionDate.getFullYear();
    const month = String(transactionDate.getMonth() + 1).padStart(2, '0'); 
    const monthKey = `${year}-${month}`;
    
    const newTransaction = {
      amount: numeralAmount,
      category,
      date: new Date(date),
      createdAt: new Date(),
      id: Date.now(),
      type,
    };

    const balance = await db.collection('users').findOne(
      { user: login, "banks.name": bankName },
      { projection: { "banks.$.balance": 1 } }
    );


    const currentBalance = Number(balance?.balance)

    const result = await db.collection('users').updateOne(
      { user: login, "banks.name": bankName },
      {
        $push: {
          [`banks.$.transactions.${monthKey}`]: newTransaction
        }
      } as any
    );

    if (!result.matchedCount) {
      return NextResponse.json(
        { error: 'Failed to add transaction' },
        { status: 500 }
      );
    }
    try {
      // Получаем текущую дату
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-11
      
      // Получаем дату транзакции
      const transYear = transactionDate.getFullYear();
      const transMonth = transactionDate.getMonth(); // 0-11
      
      // Определяем предыдущий месяц
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      
      if (prevMonth < 0) {
        prevMonth = 11; // декабрь
        prevYear = currentYear - 1;
      }
      
      // Проверяем, попадает ли транзакция в текущий или предыдущий месяц
      const isCurrentMonth = (transYear === currentYear && transMonth === currentMonth);
      const isPrevMonth = (transYear === prevYear && transMonth === prevMonth);
      
      if (isCurrentMonth || isPrevMonth) {
        const redisKey = `${login}_${bankName}_transactions`;
        const prevTrans = await redisClient.get(redisKey);
        
        if (prevTrans) {
          const parsePrevTrans = JSON.parse(prevTrans);
          if (!parsePrevTrans[monthKey]) {
            parsePrevTrans[monthKey] = [];
          }
          parsePrevTrans[monthKey].push({
            ...newTransaction
          });
          await redisClient.setEx(redisKey, 60 * 60 * 24, JSON.stringify(parsePrevTrans));
        }
      }
    } catch (redisError) {
      console.error('Redis update error:', redisError);
    }

    const newBalance = type === 'gain' 
      ? Number(currentBalance) + Number(numeralAmount) 
      : Number(currentBalance) - Number(numeralAmount);
      
    const balanceResult = await db.collection('users').updateOne(
      { user: login, "banks.name": bankName },
      { $set: { "banks.$.balance": newBalance } }
    );

    if (balanceResult.modifiedCount) {
      try {
        await redisClient.set(`${login}_${bankName}_balance`, newBalance);
      } catch (redisError) {
        console.error('Redis balance update error:', redisError);
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        newBalance, 
        monthKey,
        transactionAdded: true 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await mongoClient.close();
    await redisClient.disconnect();
  }
}