import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const data = await request.json();
    const login = searchParams.get('login');
    const id = searchParams.get('id');
    console.log(id)
    console.log(login)
    if (!login || !id) {
        return NextResponse.json(
            { error: 'Параметры login и id обязательны' },
            { status: 400 }
        );
    }

    async function updatePlan() {
        const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
        try {
            await client.connect();
            const db = client.db('users');

            const result = await db.collection('users').updateOne(
                { 
                    user: login,
                    "plans.id": Number(id) 
                },
                { 
                    $set: {
                        "plans.$": data 
                    } 
                }
            );

            return result;
        } catch (error) {
            console.error('Ошибка при обновлении плана:', error);
            throw error;
        } finally {
            await client.close();
        }
    }
    
    try {
        const result = await updatePlan();
        
        if (result.modifiedCount === 0) {
            return NextResponse.json(
                { error: 'План не найден или не был изменен' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, modifiedCount: result.modifiedCount },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Не удалось обновить план' },
            { status: 500 }
        );
    }
}