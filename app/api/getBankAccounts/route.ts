import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import clientPromise from '@/app/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || '';

interface TokenPayload {
  id: string;
  login: string;
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId: string;
  try {
    const verified = jwt.verify(token, JWT_SECRET) as TokenPayload;
    userId = verified.id;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1;
  const includeStats = searchParams.get('includeStats') === 'true';
  const currency = searchParams.get('currency');

  const client = await clientPromise;

  try {
    const db = client.db('users');

    const projection: Record<string, 0 | 1> = {
      _id: 1,
      name: 1,
      currency: 1,
      createdAt: 1
    };

    if (includeStats) {
      projection.stats = 1;
    }

    const filter: Record<string, any> = { userId };
    if (currency) {
      filter.currency = currency;
    }

    const bankAccounts = await db
      .collection('bankAccounts')
      .find(filter, { projection })
      .sort({ [sortBy]: sortOrder })
      .toArray();

    return NextResponse.json(
      {
        success: true,
        banks: bankAccounts,
        count: bankAccounts.length
      },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve bank accounts' },
      { status: 500 }
    );
  } finally {
  }
}
