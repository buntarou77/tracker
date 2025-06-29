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

  async function getBankAccounts() {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    try {
      await client.connect();
      const db = client.db('users');
      const result = await db.collection('users').findOne({ user: login }, {projection: {'banks.name': 1, 'banks.currency': 1, 'banks.balance': 1, 'banks.id': 1}});
      return result?.banks || []
    } catch (error) {
      console.error('Ошибка при получении банковских счетов:', error);
      throw error;
    } finally {
      await client.close();
    }
  }

  try {
    const bankAccounts = await getBankAccounts();
    return NextResponse.json(
      { bankAccounts },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Не удалось получить банковские счета' },
      { status: 500 }
    );
  }
}