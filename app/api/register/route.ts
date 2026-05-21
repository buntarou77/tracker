import { NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import clientPromise from '@/app/lib/mongodb'

interface User {
  _id?: string;
  login: string;
  email: string;
  password_hash: string;
  active: number;
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

    const client = await clientPromise
    
    try {
      const db = client.db(process.env.MONGODB_DB_NAME || 'users')
      
      const existingUser = await db.collection(process.env.COLLECTION_NAME || 'users').findOne({
        $or: [
          { email: email },
          { user: login }
        ]
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 409 }
        )
      }

      const salt = await bcryptjs.genSalt(10)
      const hashedPassword = await bcryptjs.hash(password, salt)

      const authResult = await db.collection(process.env.COLLECTION_NAME || 'users').insertOne({
        email,
        user: login,
        password_hash: hashedPassword,
        created_at: new Date()
      })


      return NextResponse.json(
        { 
          success: true,
          user: { 
            id: authResult.insertedId.toString(), 
            email, 
            login,
            active: active || 0
          } 
        },
        { status: 201 }
      )
    } finally {
    }
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