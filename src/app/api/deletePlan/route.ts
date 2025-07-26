import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import { cookies } from 'next/headers';
import { config } from '../../../../lib/config';

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id= searchParams.get('id');
    const login = searchParams.get('login');

    try {
        if (!login) {
            return NextResponse.json({ error: 'Forbidden: login required' }, { status: 403 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Authorization check failed' }, { status: 401 });
    }

    async function delPlan() {
        const client = new MongoClient(config.mongodb.uri);
        try {
            await client.connect();
            const db = client.db(config.mongodb.dbName);
            const result = await db.collection(config.mongodb.collectionName).updateOne({ user: login }, { $pull :{ plans: {id: Number(id)}}} as any)
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