import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import { cookies } from 'next/headers';
import { config } from '../../../../lib/config';
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

  async function getBalance() {
    const client = new MongoClient(config.mongodb.uri);
    try {
      await client.connect();
      const db = client.db(config.mongodb.dbName);
      const result = await db.collection(config.mongodb.collectionName).findOne(
        { user: login },
        { projection: { banks: { $elemMatch: { name: bankName } } } }
      );
      
      if (!result || !result.banks || result.banks.length === 0) {
        throw new Error('Bank not found');
      }
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