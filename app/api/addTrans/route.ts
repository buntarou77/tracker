import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || '';

interface TokenPayload {
  id: string;
  login: string;
}

export async function POST(request: NextRequest) {
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

  let data;
  try {
    data = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const { amount, category, date, type, bankId } = data;
  console.log(amount)
  const numeralAmount = Number(amount);

  if (!numeralAmount || isNaN(numeralAmount) || !category || !date || !bankId) {
    console.log('1')
    return NextResponse.json(
      { error: 'Required fields missing or invalid: amount, category, date, bankId' },
      { status: 400 }
    );
  }

  if (type !== 'gain' && type !== 'loss') {
    console.log('2')
    return NextResponse.json(
      { error: 'Invalid transaction type. Must be "gain" or "loss"' },
      { status: 400 }
    );
  }

  const mongoClient = new MongoClient('mongodb://localhost:27017');
    await mongoClient.connect();

    const session = mongoClient.startSession();
    console.log('log1')
  try {

    let transactionDate;
    try {
      transactionDate = new Date(date);
      if (isNaN(transactionDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      console.log('4')
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const year = transactionDate.getFullYear();
    const month = String(transactionDate.getMonth() + 1).padStart(2, '0'); 
    const monthKey = `${year}-${month}`;
    console.log(numeralAmount)
    const newTransaction = {
      userId,
      bankId,
      amount: numeralAmount,
      category,
      date: new Date(date),
      createdAt: new Date(),
      type
    };
    console.log('log2')
    console.log(newTransaction)
    session.startTransaction()
    const db = mongoClient.db('users');
    console.log('session')
    const result = await db.collection('transactions').insertOne(newTransaction, {session})
    console.log('trans1')
    if (!result.acknowledged) {
      console.log('12')
      return NextResponse.json(
        { error: 'Failed to add transaction - no changes made' },
        { status: 500 }
      );
    }
      const update =
        type === 'loss'
          ? { $inc: {'balance' : -numeralAmount, 'stats.netBalance': -numeralAmount,  'stats.totalGains': -numeralAmount, 'stats.totalLoss': numeralAmount, 'stats.totalTransactions': 1} }
          : { $inc: {'balance' : numeralAmount, 'stats.netBalance': numeralAmount,  'stats.totalGains': numeralAmount, 'stats.totalLoss': -numeralAmount, 'stats.totalTransactions': 1} }
    try{
      const balanceResult = await db
        .collection('bankAccounts')
        .findOneAndUpdate(
          { userId, id: bankId },
          update,
          { returnDocument: 'after', session }
        );
    }catch(e){
      console.log(e)
    }
      const balanceResult = await db
        .collection('bankAccounts')
        .findOneAndUpdate(
          { userId, id: bankId },
          update,
          { returnDocument: 'after', session }
        );
        console.log('trans2')
        console.log(bankId)
        console.log(userId)
      await session.commitTransaction()
    return NextResponse.json(
      { 
        success: true, 
        data: newTransaction,
        monthKey,
        transactionAdded: true 
      },
      { status: 201 }
    );

  } catch (error: any) {
    await session.abortTransaction()
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    try {
      session.endSession()
      await mongoClient.close();
    } catch (error) {
    }
  }
}