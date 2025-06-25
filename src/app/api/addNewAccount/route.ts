import { NextRequest } from "next/server";
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { name, notes = '', currency, balance, login} = data;
  async function addPlan() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
      await client.connect();
      const db = client.db('users');
      const result = await db.collection('users').updateOne({ user: `${login}`}, {
        $push: {
          banks: {
            name,
            notes,
            currency,
            balance: Number(balance), 
            transactions: []
          }
        }
      });

        return NextResponse.json({value: result}, {status: 201})
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