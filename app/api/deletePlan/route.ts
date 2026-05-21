import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import clientPromise from '@/app/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || '';

interface TokenPayload {
  id: string;
  login: string;
}

export async function DELETE(request: NextRequest) {
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
    const { planId, includeRemainingPlans } = data;
    if (!planId) {
        return NextResponse.json(
            { error: 'planId is required' },
            { status: 400 }
        );
    }

    const client = await clientPromise;

    try {
        const db = client.db('users');

        const result = await db.collection('plans').findOneAndDelete({
            _id: new ObjectId(`${planId}`),
            userId: userId
        });
        if (!result?._id) {
            return NextResponse.json(
                { error: 'Plan not found' },
                { status: 404 }
            );
        }
        const responseData: any = { 
            success: true,
            message: 'Plan deleted successfully',
            deletedPlan: result.value
        };

        if (includeRemainingPlans) {
            const remainingPlans = await db.collection('plans')
                .find({ userId: userId })
                .toArray();
            responseData.remainingPlans = remainingPlans;
            responseData.planCount = remainingPlans.length;
        }

        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete plan' },
            { status: 500 }
        );
    } finally {
    }
}