import { NextRequest } from "next/server";
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { name, notes = '', currency, balance, login } = data;

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

  const client = new MongoClient('mongodb://localhost:27017');
  try {
    await client.connect();
    const db = client.db('users');
    const userExists = await db.collection('users').findOne({ user: login });
    if (!userExists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    const bankExists = await db.collection('users').findOne({
      user: login,
      "banks.name": name
    });
    if (bankExists) {
      return NextResponse.json(
        { error: 'Bank account with this name already exists' },
        { status: 400 }
      );
    }
    const newBank = {
      id: Date.now().toString(),
      name,
      notes,
      currency,
      balance: Number(balance),
      transactions: {},
      createdAt: new Date()
    };
    const result = await db.collection('users').updateOne(
      { user: login },
      {
        $push: {
          banks: newBank
        }
      } as any
    );
    if (!result.matchedCount) {
      return NextResponse.json(
        { error: 'Failed to add bank account' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        success: true,
        bank: newBank
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding bank account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}