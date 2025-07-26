import { NextRequest } from "next/server";
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { cookies } from 'next/headers';
import { config } from '../../../../lib/config';

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

  try {
    if (!login) {
      return NextResponse.json({ error: 'Forbidden: login required' }, { status: 403 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Authorization check failed' }, { status: 401 });
  }


  async function addPlan() {
    const client = new MongoClient(config.mongodb.uri);
    try {
      await client.connect();
      const db = client.db(config.mongodb.dbName);
      const result = await db.collection(config.mongodb.collectionName).updateOne(
        { user: `${login}`}, 
        {
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
        } as any
      );

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