import { NextRequest } from "next/server";
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const {       
      frequency,
      categorys,
      name,
      targets,
      totalAmount,
      type,
      date,
      notes, 
      login,
      id} = data;

  // Проверка авторизации через /api/me
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


  async function addPlan() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
      await client.connect();
      const db = client.db('users');
      const result = await db.collection('users').updateOne({ user: `${login}`}, {
        $push: {
          plans: {
            frequency,
            categorys,
            targets,
            name,
            notes,
            totalAmount,
            date,
            createdAt: new Date(),
            type,
            id
          }
        }
      });

        return result;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    } finally {
      await client.close();
    }
  }
  addPlan();
  return NextResponse.json(
    { success: true },
    { status: 201 }
  )
}