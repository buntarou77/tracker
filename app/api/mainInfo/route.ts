import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET: string = process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET is not set'); })();

interface TokenPayload {
    id: string;
    login: string;
}

interface resultInfo {
    
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
    const date = new Date();
    const to = new Date(date)
    to.setMonth(date.getMonth() - 1)
    if (!bankId) {
        return NextResponse.json(
            { error: 'bankId parameter is required' },
            { status: 400 }
        );
    }
    try{
        const client = await clientPromise;
        const db = client.db('users');
        const transactions = await db.collection('transactions').find({userId: userId, bankId: bankId, date: {$gt: to}}).sort({date: -1}).toArray();
        if (!transactions) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: true, data: transactions },
            { status: 200 }
        );
    }catch(e){
        return NextResponse.json(
            {error: e},
            {status: 500}
        )
    }

}