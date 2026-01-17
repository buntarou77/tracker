import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

interface TokenPayload {
  id: string;
  login: string;
}

export async function GET(request: NextRequest) {
    const cookieStore = cookies();
    const token = cookieStore.get('accessToken')?.value;
    
    if (!token) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    let userId: string;
    try {
        const verified = jwt.verify(token, JWT_SECRET) as TokenPayload;
        userId = verified.id;
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
        );
    }
  
    async function getBankAccounts() {
        const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
        try {
            await client.connect();
            const db = client.db('users');
            const result = await db.collection('bankAccounts').find({ userId: userId }).toArray();
            return result || [];
        } catch (error) {
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