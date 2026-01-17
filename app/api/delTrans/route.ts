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

    const data = await request.json()
    const { transactionId, bankId, amount, balance, type } = data;    

    if (!transactionId || !bankId) {
        return NextResponse.json(
            { error: 'Missing required parameters: transactionId and bankId' },
            { status: 400 }
        );
    }

    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

    try {
        await client.connect();
        const db = client.db('users');
        
        const result = await db.collection('transactions').findOneAndDelete(
            { 
                id: Number(transactionId),
                userId: userId,
                bankId: bankId
            }
        );

        if (!result?.value) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        const deletedTransaction = result.value;

        const newBalance = type === 'loss' 
            ? Number(balance) + Number(amount)
            : Number(balance) - Number(amount);

        const bankUpdateResult = await db.collection('bankAccounts').findOneAndUpdate(
            { 
                id: bankId,
                userId: userId
            },
            { $set: { balance: newBalance } },
            { returnDocument: 'after' }
        );

        if (!bankUpdateResult?.value) {
            return NextResponse.json(
                { error: 'Failed to update bank account balance' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { 
                success: true,
                message: 'Transaction deleted successfully',
                deletedTransaction: deletedTransaction,
                newBalance: newBalance,
                updatedBank: bankUpdateResult.value
            },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete transaction' },
            { status: 500 }
        );
    } finally {
        await client.close();
    }
}