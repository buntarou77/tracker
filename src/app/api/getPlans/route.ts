import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const login = searchParams.get('login');
    
    if (!login) {
        return NextResponse.json(
            { error: 'Параметр login обязателен' },
            { status: 400 }
        );
    }

    // Проверка авторизации через /api/me
    try {
        const cookieHeader = cookies().toString();
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/me`, {
            method: 'GET',
            headers: { Cookie: cookieHeader },
            cache: 'no-store',
        });
        if (!meRes.ok) {
            return NextResponse.json({ error: 'Unauthorized (me endpoint failed)' }, { status: 401 });
        }
        const me = await meRes.json();
        if (!me.login || me.login !== login) {
            return NextResponse.json({ error: 'Forbidden: login mismatch' }, { status: 403 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Authorization check failed' }, { status: 401 });
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