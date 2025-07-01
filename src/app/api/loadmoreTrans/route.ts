import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const login = searchParams.get('login');
    const bankName = searchParams.get('bankName');
    const monthSkip = searchParams.get('monthSkip');
    const client = new MongoClient('mongodb://localhost:27017');
    
    try{
        await client.connect();
        const db = client.db('users');

        const now = new Date();
        let currentYear = now.getFullYear();
        let currentMonth = now.getMonth() + 1 - Number(monthSkip); 
        

        
        if (currentMonth <= 0) {
            if(currentMonth === 0){
                currentMonth = 12;
                currentYear = currentYear - 1;
            }else{
                const num = Number(`${currentMonth}`.slice(1))
                currentMonth = 12 - num;
                currentYear = currentYear - 1;
            }
        }
        
        const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        console.log(currentMonthKey)
        const pipeline = [
            { $match: { user: login } },
            { $unwind: "$banks" },
            { $match: { "banks.name": bankName } },
            {
                $project: {
                    _id: 0,
                    currentMonth: { $ifNull: [`$banks.transactions.${currentMonthKey}`, []] },
                }
            }
        ];
        const result = await db.collection('users').aggregate(pipeline).toArray();
        console.log(result[0].currentMonth[0])
        const transactions = result[0]?.currentMonth || [];
        
        return NextResponse.json({
            monthKey: currentMonthKey,
            transactions: transactions,
            count: transactions.length
        }, {status: 200});
    }catch(e){
        console.log(e)
        return NextResponse.json({error: 'Error loading more transactions'}, {status: 500});
    } finally {
        await client.close();
    }
}