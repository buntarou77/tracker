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

    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

    try {
    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('type');
    if(filterType !== 'expense' && filterType !== 'income' && filterType !== null)throw new Error('invalid filter type')
    const filterFrequency = searchParams.get('frequency');
    const includeProgress = searchParams.get('includeProgress') === 'true';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1;

        await client.connect();
        const db = client.db('users');

        const query: any = { userId: userId };
        if (filterType) query.type = filterType;
        if (filterFrequency) query.frequency = filterFrequency;

        let plans = await db.collection('plans')
            .find(query)
            .sort({ [sortBy]: sortOrder })
            .toArray();
        if (includeProgress) {
            plans = plans.map(plan => {
                const categoryProgress: Record<string, number> = {};
                
                plan.categorys?.forEach((cat: any) => {
                    categoryProgress[cat.category] = cat.spent || 0;
                });

                return {
                    ...plan,
                    progress: {
                        categories: categoryProgress,
                        targetCount: plan.targets?.length || 0,
                        achievedTargets: plan.targets?.filter((t: any) => t.achieved).length || 0
                    }
                };
            });
        }
        return NextResponse.json(
            { 
                success: true,
                plans: plans.map(item=> {return {...item, id: item._id}}),
                count: plans.length
            },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to retrieve plans' },
            { status: 500 }
        );
    } finally {
        await client.close();
    }
}