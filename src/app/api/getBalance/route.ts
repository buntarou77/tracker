import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import { cookies } from 'next/headers';
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const login = searchParams.get('login');
  const bankName = searchParams.get('bankName')

  if (!login) {
    return NextResponse.json(
      { error: 'Параметр login обязателен' },
      { status: 400 }
    );
  }
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

  async function getBalance() {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    try {
      await client.connect();
      const db = client.db('users');
      const result = await db.collection('users').findOne(
        { user: login },
        { projection: { banks: { $elemMatch: { name: bankName } } } }
      );
      
      const res = await JSON.stringify(result.banks[0].balance)
      return res
    } catch (error) {
      console.error('Ошибка при получении баланса:', error);
      throw error;
    } finally {
      await client.close();
    }
  }

  try {
    const balance = await getBalance();
    return NextResponse.json(
      { balance },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Не удалось получить баланс' },
      { status: 500 }
    );
  }
}