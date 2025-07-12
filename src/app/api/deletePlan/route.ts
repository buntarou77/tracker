import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id= searchParams.get('id');
    const login = searchParams.get('login');

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

    async function delPlan() {
        const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
        try {
            await client.connect();
            const db = client.db('users');
            const result = await db.collection('users').updateOne({ user: login }, { $pull :{ plans: {id: Number(id)}}})
            return result 
        } catch (error) {
            throw error;
        } finally {
            await client.close();
        }
    }

    try {
        const transactions = await delPlan();
        return NextResponse.json(
            { transactions },
            { status: 200 } 
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'error' },
            { status: 500 }
        );
    }
}