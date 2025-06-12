import { NextRequest } from "next/server";
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const {  amount, category, date, login, balance, type} = data;
  const numeralAmount = Number(amount);
  const numeralBalance = Number(balance);
  if (!numeralAmount || !category || !date) {
    return NextResponse.json(
      { text: 'one of the fields is not filled in' },
      { status: 400 }
    )
  }

  async function addTransaction() {
    const client = new MongoClient('mongodb://localhost:27017');
    console.log(client)
    try {
      await client.connect();
      const db = client.db('users');
      const result = await db.collection('users').updateOne({ user: `${login}`}, {
        $push: {
          transactions: {
            numeralAmount,
            category,
            date,
            createdAt: new Date(),
            id: Date.now(),
            type,
          }
        }
      });
      if(type === 'gain'){
        const addBalance = await db.collection('users').updateOne({ user: `${login}`}, {
          $set:{
            active: numeralBalance + numeralAmount
          }
        })
        const res = {result, addBalance}
        return res;
      }else{
        const addBalance = await db.collection('users').updateOne({ user: `${login}`}, {
          $set:{
            active: numeralBalance - numeralAmount
          }
        })
        const res = {result, addBalance}
        return res;
      }

    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    } finally {
      await client.close();
    }
  }
  addTransaction();
  return NextResponse.json(
    { success: true },
    { status: 201 }
  )
}