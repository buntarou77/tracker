import { NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import { MongoClient } from 'mongodb'

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

    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017')
    
    try {
      await client.connect()
      const db = client.db('users')
      
      // Проверяем существует ли пользователь
      const existingUser = await db.collection('users').findOne({
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

      // Создаем пользователя в коллекции auth_users
      const authResult = await db.collection('users').insertOne({
        email,
        user: login,
        password_hash: hashedPassword,
        banks: [],
        plans: [],
        created_at: new Date()
      })

      // Создаем пользователя в основной коллекции users для банковских данных

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
      await client.close()
    }
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 