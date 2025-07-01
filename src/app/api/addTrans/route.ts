import { NextRequest } from "next/server";
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST(request: NextRequest) {
  let data;
  try {
    data = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const { amount, category, date, login, type, bankName, balanceStatus } = data;
  const numeralAmount = Number(amount);

  if (!numeralAmount || isNaN(numeralAmount) || !category || !date || !bankName) {
    return NextResponse.json(
      { error: 'Required fields missing or invalid: amount, category, date, bankName' },
      { status: 400 }
    );
  }

  if (!login) {
    return NextResponse.json(
      { error: 'User not authenticated' },
      { status: 401 }
    );
  }

  if (type !== 'gain' && type !== 'loss') {
    return NextResponse.json(
      { error: 'Invalid transaction type. Must be "gain" or "loss"' },
      { status: 400 }
    );
  }

  if (typeof balanceStatus !== 'number') {
    return NextResponse.json(
      { error: 'balanceStatus is required and must be a number' },
      { status: 400 }
    );
  }

  const mongoClient = new MongoClient('mongodb://localhost:27017');

  try {
    await mongoClient.connect();
    const db = mongoClient.db('users');
    
    let transactionDate;
    try {
      transactionDate = new Date(date);
      if (isNaN(transactionDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

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
      balanceStatus
    };


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
        { error: 'Failed to add transaction - user or bank not found' },
        { status: 404 }
      );
    }

    if (!result.modifiedCount) {
      return NextResponse.json(
        { error: 'Failed to add transaction - no changes made' },
        { status: 500 }
      );
    }
    
    const newBalance = type === 'gain' 
      ? balanceStatus + numeralAmount 
      : balanceStatus - numeralAmount;

    if (newBalance < 0) {
      console.warn(`Warning: Balance will be negative: ${newBalance}`);
    }
      
    const balanceResult = await db.collection('users').updateOne(
      { user: login, "banks.name": bankName },
      { $set: { "banks.$.balance": newBalance } }
    );

    if (!balanceResult.modifiedCount) {
      console.error('Failed to update balance');
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

  } catch (error: any) {
    console.error('Error in transaction:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    try {
      await mongoClient.close();
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  }
}