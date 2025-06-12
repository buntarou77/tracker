import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const login = searchParams.get('login');

  if (!login) {
    return NextResponse.json(
      { error: 'Параметр login обязателен' },
      { status: 400 }
    );
  }
  async function getBalance() {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    try {
      await client.connect();
      const db = client.db('users');
      const result = await db.collection('users').findOne({ user: login });
      const balance = result?.active || 0;
      const currency = result?.currency || '';
      const res = {balance , currency}
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