import { NextRequest } from "next/server";
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis'

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { amount, category, date, login, balance, type, bankName } = data;
  const numeralAmount = Number(amount);
  const numeralBalance = Number(balance);

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
    
    const result = await db.collection('users').updateOne(
      { user: `${login}`, "banks.name": bankName },
      {
        $push: {
          "banks.$.transactions": {
            amount: numeralAmount,
            numeralAmount: numeralAmount,
            category,
            date: new Date(date),
            createdAt: new Date(),
            id: Date.now(),
            type,
            date_parts: {
              year: new Date(date).getFullYear(),
              month: new Date(date).getMonth(),
              day: new Date(date).getDate(),
              week: new Date(date).getDay()
            }
          }
        }
      }
    );

    if (!result.matchedCount) {
      return NextResponse.json(
        { error: 'User or bank not found' },
        { status: 404 }
      );
    }

    try {
      const year = new Date(date).getFullYear();
      const month = new Date(date).getMonth();
      const key = `${month}-${year}`;
      const prevTrans = await redisClient.get(`${login}_${bankName}_transactions`);
      
      if (prevTrans) {
        const parsePrevTrans = JSON.parse(prevTrans);
        if (parsePrevTrans[key]) {
          parsePrevTrans[key].push({
            amount: numeralAmount,
            numeralAmount: numeralAmount,
            category,
            date,
            createdAt: new Date(),
            id: Date.now(),
            type,
            date_parts: {
              year: new Date(date).getFullYear(),
              month: new Date(date).getMonth(),
              day: new Date(date).getDate(),
              week: new Date(date).getDay()
            }
          });
          await redisClient.set(`${login}_${bankName}_transactions`, JSON.stringify(parsePrevTrans));
        }
      }
    } catch (redisError) {
      console.error('Redis update error:', redisError);
    }

    const newBalance = type === 'gain' 
      ? Number(numeralBalance) + Number(numeralAmount) 
      : Number(numeralBalance) - Number(numeralAmount);
      
    const balanceResult = await db.collection('users').updateOne(
      { user: `${login}`, "banks.name": bankName },
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
      { success: true, newBalance },
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