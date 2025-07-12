import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import { createClient } from 'redis'
import { cookies } from 'next/headers';

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

                // Обновляем balanceStatus у всех последующих транзакций
                const userData = await db.collection('users').findOne(
                    { user: login, "banks.name": bankName },
                    { projection: { "banks.$": 1 } }
                );

                if (userData && userData.banks && userData.banks[0]) {
                    const transactions = userData.banks[0].transactions || {};
                    const amountChange = type === 'loss' ? -Number(amount) : Number(amount);
                    
                    // Обновляем транзакции по месяцам
                    for (const [mk, monthTransactions] of Object.entries(transactions)) {
                        if (Array.isArray(monthTransactions)) {
                            const updatedTransactions = monthTransactions.map((t: any) => {
                                if (new Date(t.date).getTime() > new Date(date).getTime()) {
                                    return {
                                        ...t,
                                        balanceStatus: (t.balanceStatus || 0) + amountChange
                                    };
                                }
                                return t;
                            });
                            
                            // Проверяем, были ли изменения
                            const hasChanges = updatedTransactions.some((t: any, i: number) => 
                                t.balanceStatus !== (monthTransactions as any)[i].balanceStatus
                            );
                            
                            if (hasChanges) {
                                await db.collection('users').updateOne(
                                    { user: login, "banks.name": bankName },
                                    { $set: { [`banks.$.transactions.${mk}`]: updatedTransactions } } as any
                                );
                            }
                        }
                    }
                }

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
                    
                    // Обновляем Redis с актуальными данными
                    const redisKey = `${login}_${bankName}_transactions`;
                    
                    // Получаем актуальные данные из БД для Redis
                    const updatedUserData = await db.collection('users').findOne(
                        { user: login, "banks.name": bankName },
                        { projection: { "banks.$": 1 } }
                    );
                    
                    if (updatedUserData && updatedUserData.banks && updatedUserData.banks[0]) {
                        const updatedTransactions = updatedUserData.banks[0].transactions || {};
                        const redisTransactions: any = {};
                        
                        // Берем только текущий и предыдущий месяц для Redis
                        Object.entries(updatedTransactions).forEach(([mk, trans]) => {
                            const [year, month] = mk.split('-');
                            const tYear = parseInt(year);
                            const tMonth = parseInt(month) - 1;
                            
                            const isCurrent = (tYear === currentYear && tMonth === currentMonth);
                            const isPrev = (tYear === prevYear && tMonth === prevMonth);
                            
                            if (isCurrent || isPrev) {
                                redisTransactions[mk] = trans;
                            }
                        });
                        
                        await redisClient.setEx(redisKey, 60 * 60 * 24, JSON.stringify(redisTransactions));
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