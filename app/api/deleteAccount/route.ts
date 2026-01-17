import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

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

    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get('bankId');

    if (!bankId) {
        return NextResponse.json(
            { error: 'Missing required parameter: bankId' },
            { status: 400 }
        );
    }

    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('users');
        
        const bankAccount = await db.collection('bankAccounts').findOne(
            { 
                id: bankId,
                userId: userId
            }
        );
        
        if (!bankAccount) {
            return NextResponse.json(
                { error: 'Bank account not found' },
                { status: 404 }
            );
        }
        
        const bankCount = await db.collection('bankAccounts').countDocuments(
            { userId: userId }
        );
        
        if (bankCount === 1) {
            return NextResponse.json(
                { error: 'Cannot delete the last bank account' },
                { status: 400 }
            );
        }
        
        const result = await db.collection('bankAccounts').deleteOne(
            { id: bankId, userId: userId }
        );

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Failed to delete bank account' },
                { status: 500 }
            );
        }

        const remainingBanks = await db.collection('bankAccounts').find(
            { userId: userId }
        ).toArray();

        return NextResponse.json(
            { 
                success: true, 
                message: 'Bank account deleted successfully',
                remainingBanks: remainingBanks
            },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    } finally {
        await client.close();
    }
}