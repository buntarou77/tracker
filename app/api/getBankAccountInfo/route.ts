import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

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

    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get('bankId');

    if (!bankId) {
        return NextResponse.json(
            { error: 'bankId parameter is required' },
            { status: 400 }
        );
    }

    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

    try {
        await client.connect();
        const db = client.db('users');

        const bankAccount = await db.collection('bankAccounts').findOne({
            id: bankId,
            userId: userId
        });

        if (!bankAccount) {
            return NextResponse.json(
                { error: 'Bank account not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { 
                success: true,
                bank: bankAccount
            },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to retrieve bank account info' },
            { status: 500 }
        );
    } finally {
        await client.close();
    }
}
