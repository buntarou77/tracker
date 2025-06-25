import { NextRequest } from "next/server";
import { NextResponse } from 'next/server';
import {MongoClient} from 'mongodb';
export async function POST(request: NextRequest){
    const data = await request.json();
    const {lasts, debts, food, family, home, active, salary, login, currency, plan} = data;
 if(!lasts || !debts  || !food || !family || !home || !active || !salary || !currency){
    return NextResponse.json(
        {text: 'one of the fields is not filled in'},
        {status: 400}
    ) 
 }
 async function modifyUser() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
      await client.connect();
      const db = client.db('users'); 
      const result = await db.collection('users').updateOne({ user: `${login}`}, {
        $set: {
            lasts,
            debts,
            food,
            family,
            home,
            active,
            salary,
            currency,
            plan,
            transactions: [],
            updatedAt: new Date()
        }
      });
      return result;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    } finally {
      await client.close();
    }
  }
  modifyUser()
  return NextResponse.json(
    { success: true,},
    { status: 201 }
  )
}