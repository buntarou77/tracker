import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import { cookies } from 'next/headers';
import { config } from '../../../../lib/config';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const login = searchParams.get('login');
    
    if (!login) {
        return NextResponse.json(
            { error: 'Параметр login обязателен' },
            { status: 400 }
        );
    }

    try {
        if (!login) {
            return NextResponse.json({ error: 'Forbidden: login required' }, { status: 403 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Authorization check failed' }, { status: 401 });
    }

    async function getPlans() {
        const client = new MongoClient(config.mongodb.uri);
        try {
            await client.connect();
            const db = client.db(config.mongodb.dbName);
            const user = await db.collection(config.mongodb.collectionName).findOne(
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