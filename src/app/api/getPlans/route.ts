import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const login = searchParams.get('login');
    
    if (!login) {
        return NextResponse.json(
            { error: 'Параметр login обязателен' },
            { status: 400 }
        );
    }

    async function getPlans() {
        const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
        try {
            await client.connect();
            const db = client.db('users');
            const user = await db.collection('users').findOne(
                { user: login },
                { projection: { plans: 3 } } 
            );
            
            return user?.plans;

        } catch (error) {
            console.error('Ошибка при получении планов:', error);
            throw error;
        } finally {
            await client.close();
        }
    }
    
    try {
        const plans = await getPlans();
        return NextResponse.json(
            { plans },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Не удалось получить планы' },
            { status: 500 }
        );
    }
}