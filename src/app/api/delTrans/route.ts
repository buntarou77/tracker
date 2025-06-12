import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const info = searchParams.get('info');
    const login = info?.split(':')[0]
    const id = info?.split(':')[1]
    const amount = info?.split(':')[2]
    const type = info?.split(':')[4]
    const balance = info?.split(':')[3];
    console.log(info)
    async function delTransaction() {
        const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
        try {
            console.log('Ищем транзакцию с id:', id, 'тип:', typeof id)
            console.log('login:' + login)
            await client.connect();
            const db = client.db('users');
            if(type === 'loss'){
                const plus = Number(balance) + Number(amount)
                const res = await db.collection('users').updateOne({ user: login }, { $set :{ active: plus}});
            }else if(type === 'gain'){
                const minus = Number(balance) - Number(amount)
                const res = await db.collection('users').updateOne({ user: login }, { $set :{ active: minus}});
            }
            const result = await db.collection('users').updateOne({ user: login }, { $pull :{ transactions: {id: Number(id)}}})
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
        const transactions = await delTransaction();
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