import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import clientPromise from '@/app/lib/mongodb';

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
  const numeralAmount = Number(amount);

  if (!numeralAmount || isNaN(numeralAmount) || !category || !date || !bankId) {
    return NextResponse.json(
      { error: 'Required fields missing or invalid: amount, category, date, bankId' },
      { status: 400 }
    );
  }

  if (type !== 'gain' && type !== 'loss') {
    return NextResponse.json(
      { error: 'Invalid transaction type. Must be "gain" or "loss"' },
      { status: 400 }
    );
  }

  const mongoClient = await clientPromise;

    const session = mongoClient.startSession();
  try {

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
      userId,
      bankId,
      amount: numeralAmount,
      category,
      date: new Date(date),
      createdAt: new Date(),
      type
    };
    session.startTransaction()
    const db = mongoClient.db('users');
    const result = await db.collection('transactions').insertOne(newTransaction, {session})
    if (!result.acknowledged) {
      return NextResponse.json(
        { error: 'Failed to add transaction - no changes made' },
        { status: 500 }
      );
    }
      const update =
        type === 'loss'
          ? { $inc: { 'balance': -numeralAmount } }
          : { $inc: { 'balance': numeralAmount } }
        
      const balanceResult = await db
        .collection('bankAccounts')
        .findOneAndUpdate(
          { userId, _id: new ObjectId(bankId) },
          update,
          { returnDocument: 'after', session }
        );
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
      
    } catch (error) {
    }
  }
}