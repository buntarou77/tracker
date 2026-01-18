import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || '';

interface TokenPayload {
  id: string;
  login: string;
}

export async function POST(request: NextRequest) {
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

    const data = await request.json();
    const { name, amount, categorys, color } = data;

    if (!name || !amount || !categorys) {
        return NextResponse.json(
            { error: 'Missing required fields: name, amount, category' },
            { status: 400 }
        );
    }

    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

    try {
        await client.connect();
        const db = client.db('users');

        const newPlan = {
            id: Date.now().toString(),
            userId: userId,
            name: name.trim(),
            amount: Number(amount),
            category: category,
            color: color || '#000000',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('plans').insertOne(newPlan);

        if (!result.acknowledged) {
            return NextResponse.json(
                { error: 'Failed to create plan' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { 
                success: true,
                plan: newPlan
            },
            { status: 201 }
        );

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create plan' },
            { status: 500 }
        );
    } finally {
        await client.close();
    }
}