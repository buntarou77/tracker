import { NextResponse } from 'next/server'
import { query } from '../db'
import bcryptjs from 'bcryptjs'
import {MongoClient} from 'mongodb';
interface User {
  id: number;
  login: string;
  email: string;
}

export async function POST(request: Request) {
  try {
    const { email, password, login, active } = await request.json()

    if (!email || !password || !login) {
      return NextResponse.json(
        { error: 'Email, password and login are required' },
        { status: 400 }
      )
    }

    const existingUser = await query(
      'SELECT id FROM usersitems WHERE email = ? OR login = ?', 
      [email, login]
    ) as User[]

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    const salt = await bcryptjs.genSalt(10)
    const hashedPassword = await bcryptjs.hash(password, salt)

    const result = await query(
      'INSERT INTO usersitems (email, password_hash, login) VALUES (?, ?, ?)',
      [email, hashedPassword, login]
    ) as { insertId: number }
    async function addUser(user: any) {
      const client = new MongoClient('mongodb://localhost:27017');
      try {
        await client.connect();
        const db = client.db('users'); 
        const result = await db.collection('users').insertOne({user, active: 0});
        return result.insertedId;
      } catch (error) {
        throw error;
      } finally {
        await client.close();
      }
    }
    addUser(login)
    return NextResponse.json(
      { 
        success: true,
        user: { 
          id: result.insertId, 
          email, 
          login,
          active: 0
        } 
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 