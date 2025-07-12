import { NextResponse } from 'next/server';
import { createClient } from 'redis';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
const { searchParams } = new URL(request.url);
const login = searchParams.get('login');
  const client = createClient({
    url: 'redis://127.0.0.1:6379'
  });

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

  try {
    try{
      await client.connect();
    }catch(e){
      try{
        const f = await fetch(`http://localhost:3000/api/getBankAccounts?login=${login}`, {
            method: 'GET'
        })
        if(f.ok){
            const data = await f.json();
            return NextResponse.json({ value: data.bankAccounts}, { status: 200 });
        }else{
            return NextResponse.json({error: 'Failed to fetch balance'}, { status: 400 });
        }
    }catch(e){
        return NextResponse.json({error: e}, { status: 400 });
    }
    }
    const trans = await client.get(`bankAccounts_${login}`);
    if(!trans || trans === 'null'){
        try{
            const f = await fetch(`http://localhost:3000/api/getBankAccounts?login=${login}`, {
                method: 'GET'
            })
            if(f.ok){
                const data = await f.json();

                const resData = data.bankAccounts
                client.set(`bankAccounts_${login}`, JSON.stringify(resData))
                return NextResponse.json({value: data})
            }else{
                return NextResponse.json({error: 'failed to connect database'}, {status: 500})
            }
        }catch(e){
            return NextResponse.json({error: e}, { status: 400 });
        }

    }else{
        const value = JSON.parse(trans)
        await client.disconnect();
        return NextResponse.json({ value }, { status: 200 });
    }


  } catch (error) {
    await client.disconnect();
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}