import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import clientPromise from '@/app/lib/mongodb';
import getEnv from "@/app/lib/getEnv";

const JWT_SECRET = getEnv('JWT_SECRET');

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

    const data = await request.json()
    const { transactionId, bankId, amount, balance, type, includeUpdatedBank } = data;    

    if (!transactionId || !bankId) {
        return NextResponse.json(
            { error: 'Missing required parameters: transactionId and bankId' },
            { status: 400 }
        );
    }

    const client = await clientPromise;
    const session = client.startSession()
    try {
        const db = client.db('users');
        session.startTransaction()
        const result = await db.collection('transactions').findOneAndDelete(
            { 
                _id: new ObjectId(`${transactionId}`),
                userId: userId
            },  
            {session}
        );
        if (!result) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }
        const deletedTransaction = result;
        const newBalance = type === 'loss'
            ? Number(balance) + Number(amount)
            : Number(balance) - Number(amount);
        const balanceDelta = type === 'loss' ? Number(amount) : -Number(amount);
        const gainsDelta  = type === 'gain' ? -Number(amount) : 0;
        const lossDelta   = type === 'loss' ? -Number(amount) : 0;
        const bankUpdateResult = await db.collection('bankAccounts').findOneAndUpdate(
            {
                _id: new ObjectId(`${bankId}`)
            },
            { $inc: { 'balance': balanceDelta } },
            { returnDocument: 'after' , session}
        );
        if (!bankUpdateResult) {
            return NextResponse.json(
                { error: 'Failed to update bank account balance' },
                { status: 500 }
            );
        }

        const responseData: any = { 
            success: true,
            message: 'Transaction deleted successfully',
            deletedTransaction: deletedTransaction,
            newBalance: newBalance
        };

        if (includeUpdatedBank) {
            responseData.updatedBank = bankUpdateResult.value;
        }
        await session.commitTransaction()
        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        await session.abortTransaction()
        return NextResponse.json(
            { error: 'Failed to delete transaction' },
            { status: 500 }
        );
    } finally {
        session.endSession()
        
    }
}