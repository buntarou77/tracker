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
    
    if (!login || !id || !bankName || !date) {
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
            
            // Определяем monthKey для транзакции
            const transactionDate = new Date(date);
            const year = transactionDate.getFullYear();
            const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
            const monthKey = `${year}-${month}`;
            
            // Удаляем транзакцию из соответствующего месяца
            const result = await db.collection('users').updateOne(
                { user: login, "banks.name": bankName },
                { 
                    $pull: { 
                        [`banks.$.transactions.${monthKey}`]: { id: Number(id) }
                    } 
                } as any
            );

            if (result.modifiedCount > 0) {
                // Вычисляем новый баланс
                const newBalance = type === 'loss' 
                    ? Number(balance) + Number(amount)
                    : Number(balance) - Number(amount);

                // Обновляем баланс в MongoDB
                await db.collection('users').updateOne(
                    { user: login, "banks.name": bankName },
                    { $set: { "banks.$.balance": newBalance } }
                );

                // Обновляем Redis кэш
                try {
                    // Обновляем кэш транзакций (только для последних 2 месяцев)
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    const currentMonth = now.getMonth(); // 0-11
                    
                    let prevMonth = currentMonth - 1;
                    let prevYear = currentYear;
                    
                    if (prevMonth < 0) {
                        prevMonth = 11;
                        prevYear = currentYear - 1;
                    }
                    
                    const isCurrentMonth = (transactionDate.getFullYear() === currentYear && transactionDate.getMonth() === currentMonth);
                    const isPrevMonth = (transactionDate.getFullYear() === prevYear && transactionDate.getMonth() === prevMonth);
                    
                    // Обновляем Redis только если транзакция из последних 2 месяцев
                    if (isCurrentMonth || isPrevMonth) {
                        const redisKey = `${login}_${bankName}_transactions`;
                        const prevTrans = await redisClient.get(redisKey);
                        
                        if (prevTrans) {
                            const parsePrevTrans = JSON.parse(prevTrans);
                            if (parsePrevTrans[monthKey]) {
                                parsePrevTrans[monthKey] = parsePrevTrans[monthKey].filter((trans: any) => trans.id !== Number(id));
                                
                                // Если массив стал пустым, удаляем ключ
                                if (parsePrevTrans[monthKey].length === 0) {
                                    delete parsePrevTrans[monthKey];
                                }
                                
                                await redisClient.set(redisKey, JSON.stringify(parsePrevTrans));
                            }
                        }
                    }

                    // Обновляем баланс в Redis
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