import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import clientPromise from '@/app/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || '';

interface TokenPayload {
  id: string;
  login: string;
}

export async function PATCH(request: NextRequest) {
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
    const { planId, name, amount, category, color } = data;

    if (!planId) {
        return NextResponse.json(
            { error: 'planId is required' },
            { status: 400 }
        );
    }

    const client = await clientPromise;

    try {
        const db = client.db('users');

        const updateData: any = { updatedAt: new Date() };
        if (name) updateData.name = name.trim();
        if (amount) updateData.amount = Number(amount);
        if (category) updateData.category = category;
        if (color) updateData.color = color;

        const result = await db.collection('plans').findOneAndUpdate(
            { id: planId, userId: userId },
            { $set: updateData },
            { returnDocument: 'after' }
        );


        if (!result?.value) {
            return NextResponse.json(
                { error: 'Plan not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { 
                success: true,
                plan: result.value
            },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update plan' },
            { status: 500 }
        );
    } finally {
    }
}