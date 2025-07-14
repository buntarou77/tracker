import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const login = searchParams.get('login');
    const bankName = searchParams.get('bankName');
   
    if (!login || !bankName) {
        return NextResponse.json(
            { error: 'Параметры login и bankName обязательны' },
            { status: 400 }
        );
    }

    const cook = cookies().getAll()
    console.log(cook)
    

    async function getTransactions() {
        const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
        try {
            await client.connect();
            const db = client.db('users');
            
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1; 
            
            let prevMonth = currentMonth - 1;
            let prevYear = currentYear;
            
            if (prevMonth <= 0) {
                prevMonth = 12;
                prevYear = currentYear - 1;
            }
            
            const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
            const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
            
            
            const pipeline = [
                { $match: { user: login } },
                { $unwind: "$banks" },
                { $match: { "banks.name": bankName } },
                {
                    $project: {
                        _id: 0,
                        currentMonth: { $ifNull: [`$banks.transactions.${currentMonthKey}`, []] },
                        prevMonth: { $ifNull: [`$banks.transactions.${prevMonthKey}`, []] }
                    }
                }
            ];
            
            const result = await db.collection('users').aggregate(pipeline).toArray();
            
            if (!result || result.length === 0) {
                return [];
            }
            
            const allTransactions = [
                ...result[0].currentMonth,
                ...result[0].prevMonth
            ];
            
            allTransactions.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                

                if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
                if (isNaN(dateA.getTime())) return 1;
                if (isNaN(dateB.getTime())) return -1;
                
                return dateB.getTime() - dateA.getTime();
            });
            
            return allTransactions;
            
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