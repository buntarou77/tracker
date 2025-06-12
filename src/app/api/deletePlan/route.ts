import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id= searchParams.get('id');
    const login = searchParams.get('login');
    async function delPlan() {
        const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
        try {
            await client.connect();
            const db = client.db('users');
            const result = await db.collection('users').updateOne({ user: login }, { $pull :{ plans: {id: Number(id)}}})
            console.log(result)
            return result 
        } catch (error) {
            console.error('error:', error);
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