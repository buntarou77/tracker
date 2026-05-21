import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
const JWT_SECRET = process.env.JWT_SECRET || '';
import { CreatePlanType, targetItem, categoryItem } from "@/app/types/shared/plan";
import clientPromise from '@/app/lib/mongodb';
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

    const data = (await request.json()) as CreatePlanType;
    const { name, amount, categorys, targets, color, type, frequency, currency } = data;
    const preparedTargets = targets?.map((item: targetItem) =>{
        return {
            id: new Date(),
            target: item.target,
            amount: Number(item.amount)
        }
    })
    const preparedCategorys = categorys?.map((item: categoryItem) =>{
        return {
            id: new Date(),
            category: item.category,
            amount: Number(item.amount)
        }
    })
    if (!name || !amount || !categorys) {
        return NextResponse.json(
            { error: 'Missing required fields: name, amount, category' },
            { status: 400 }
        );
    }

    if(frequency !== 'one-time' && Date.length === 0){
        return NextResponse.json(
            {error: 'Missing required dates'},
            {status: 400}
        )
    }

    const client = await clientPromise;

    try {
        const db = client.db('users');

        const newPlan = {
            userId: userId,
            name: name.trim(),
            frequency,
            currency,
            type,
            amount: Number(amount),
            categorys: preparedCategorys ?? [],
            targets: preparedTargets ?? [],
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
                plan: {...newPlan, id: result.insertedId}
            },
            { status: 201 }
        );

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create plan' },
            { status: 500 }
        );
    } finally {
    }
}