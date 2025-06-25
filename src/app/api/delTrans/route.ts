import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import { createClient } from 'redis'

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const info = searchParams.get('info');
    
    if (!info) {
        return NextResponse.json(
            { error: 'Missing info parameter' },
            { status: 400 }
        );
    }

    const [login, id, amount, balance, type, date, bankName] = info.split(':');
    
    if (!login || !id || !bankName) {
        return NextResponse.json(
            { error: 'Invalid info format' },
            { status: 400 }
        );
    }

    async function delTransaction() {
        const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
        const redisClient = createClient({
            url: 'redis://127.0.0.1:6379'
        });

        try {
            await client.connect();
            await redisClient.connect();
            
            const db = client.db('users');
            
            const result = await db.collection('users').updateOne(
                { user: login, "banks.name": bankName },
                { 
                    $pull: { 
                        "banks.$.transactions": { id: Number(id) } 
                    } 
                }
            );

            if (result.modifiedCount > 0) {
                const newBalance = type === 'loss' 
                    ? Number(balance) + Number(amount)
                    : Number(balance) - Number(amount);

                await db.collection('users').updateOne(
                    { user: login, "banks.name": bankName },
                    { $set: { "banks.$.balance": newBalance } }
                );

                try {
                    const year = new Date(date).getFullYear();
                    const month = new Date(date).getMonth();
                    const key = `${month}-${year}`;
                    const prevTrans = await redisClient.get(`${login}_${bankName}_transactions`);
                    
                    if (prevTrans) {
                        const parsePrevTrans = JSON.parse(prevTrans);
                        if (parsePrevTrans[key]) {
                            const newTrans = parsePrevTrans[key].filter((elem: any) => elem.id !== Number(id));
                            parsePrevTrans[key] = newTrans;
                            await redisClient.set(`${login}_${bankName}_transactions`, JSON.stringify(parsePrevTrans));
                        }
                    }

                    await redisClient.set(`${login}_${bankName}_balance`, newBalance);
                } catch (redisError) {
                    console.error('Redis update error:', redisError);
                }
            }
            
            return result;
        } catch (error) {
            console.error('Error deleting transaction:', error);
            throw error;
        } finally {
            await client.close();
            await redisClient.disconnect();
        }
    }

    try {
        const result = await delTransaction();
        return NextResponse.json(
            { success: true, result },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete transaction' },
            { status: 500 }
        );
    }
}