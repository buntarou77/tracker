import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const login = searchParams.get('login');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!login) {
        return NextResponse.json(
            { error: 'Параметр login обязателен' },
            { status: 400 }
        );
    }

    async function getTransactions() {
        const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
        try {
            await client.connect();
            const db = client.db('users');
            const result = await db.collection('users').findOne({ user: login });
            
            return result?.transactions || []; 
        } catch (error) {
            console.error('Ошибка при получении транзакций:', error);
            throw error;
        } finally {
            await client.close();
        }
    }
    
    try {
        const transactions = await getTransactions();
        return NextResponse.json(
            { transactions },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Не удалось получить транзакции' },
            { status: 500 }
        );
    }
}