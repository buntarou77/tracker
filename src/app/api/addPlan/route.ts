import { NextRequest } from "next/server";
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

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


  async function addPlan() {
    const client = new MongoClient('mongodb://localhost:27017');
    console.log(client)
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