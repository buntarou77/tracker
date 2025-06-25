import { NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const login = searchParams.get('login');
    const bankName = searchParams.get('bankName');
    console.log(login)
    console.log(bankName)
    if (!login || !bankName) {
        return NextResponse.json(
            { error: 'Параметры login и bankName обязательны' },
            { status: 400 }
        );
    }

    const client = createClient({
        url: 'redis://127.0.0.1:6379'
    });

    try {
        try {
            await client.connect();
        } catch (e) {
            try {
                const f = await fetch(`http://localhost:3000/api/getTrans?login=${login}&bankName=${bankName}`, {
                    method: 'GET'
                });
                if (f.ok) {
                    const data = await f.json();
                    return NextResponse.json({ value: data.transactions }, { status: 200 });
                } else {
                    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 400 });
                }
            } catch (e) {
                return NextResponse.json({ error: e }, { status: 400 });
            }
        }
        console.log(`${login}_${bankName}_transactions`)
        const trans = await client.get(`${login}_${bankName}_transactions`);
        
        if (!trans) {
            try {
                const f = await fetch(`http://localhost:3000/api/getTrans?login=${login}&bankName=${bankName}`, {
                    method: 'GET'
                });
                if (f.ok) {
                    const data = await f.json();
                    
                    const monthTrans: { [key: string]: any[] } = {};
                    data.transactions.forEach((trans: any) => {
                        const month = new Date(trans.date).getMonth();
                        const year = new Date(trans.date).getFullYear();
                        if (year == 2025) {
                            const key = `${month}-${year}`;
                            if (!monthTrans[key]) {
                                monthTrans[key] = [];
                            }
                            monthTrans[key].push(trans);
                        }
                    });
                    
                    await client.set(`${login}_${bankName}_transactions`, JSON.stringify(monthTrans || {}));
                    return NextResponse.json({ value: monthTrans }, { status: 200 });
                } else {
                    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 400 });
                }
            } catch (e) {
                return NextResponse.json({ error: e }, { status: 400 });
            }
        } else {
            const value = JSON.parse(trans);
            await client.disconnect();
            return NextResponse.json({ value }, { status: 200 });
        }

    } catch (error) {
        await client.disconnect();
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}