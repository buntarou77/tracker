import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from 'mongodb';
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
    const { transactionId, bankId, amount, balance, type, includeUpdatedBank } = data;    

    if (!transactionId || !bankId) {
        return NextResponse.json(
            { error: 'Missing required parameters: transactionId and bankId' },
            { status: 400 }
        );
    }

    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    const session = client.startSession()
    try {
        await client.connect();
        const db = client.db('users');
        session.startTransaction()
        const result = await db.collection('transactions').findOneAndDelete(
            { 
                _id: new ObjectId(`${transactionId}`)
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
        const gainAmount = type === 'loss' ? Number(amount) - Number(amount) * 2 : Number(amount)
        const lossAmount = type === 'loss' ? Number(amount): Number(amount) - Number(amount) * 2 
        const bankUpdateResult = await db.collection('bankAccounts').findOneAndUpdate(
            { 
                _id: new ObjectId(`${bankId}`)
            },
            { $inc: {'balance' : gainAmount, 'stats.netBalance': gainAmount,  'stats.totalGains': gainAmount, 'stats.totalLoss': lossAmount, 'stats.totalTransactions': -1}},
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
        await client.close();
    }
}