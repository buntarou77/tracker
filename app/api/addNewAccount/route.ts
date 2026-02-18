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

  const data = await request.json();
  const { name, notes = '', currency, balance = 0 } = data;

  const client = new MongoClient('mongodb://localhost:27017');
  try {
    await client.connect();
    const db = client.db('users');

    const bankExists = await db.collection('bankAccounts').findOne({
      userId: userId,
      name: name
    });
    if (bankExists) {
      return NextResponse.json(
        { error: 'Bank account with this name already exists' },
        { status: 400 }
      );
    }

    
    const newBank = {
      userId: userId,
      name: name.trim(),
      notes,
      currency,
      balance: Number(balance),
      stats: {
        totalGains: 0,
        netBalance: Number(balance),
        totalLoss: 0,
        totalTransactions: 0
      },
      createdAt: new Date()
    };

    const result = await db.collection('bankAccounts').insertOne(newBank);

    if (!result.acknowledged) {
      return NextResponse.json(
        { error: 'Failed to add bank account' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        success: true,
        bank: {...result, id: JSON.stringify(result.insertedId)}
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}