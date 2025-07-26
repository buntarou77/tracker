import { NextResponse } from 'next/server';
import { createClient } from 'redis';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
const { searchParams } = new URL(request.url);
const login = searchParams.get('login');
const bankName = searchParams.get('bankName')
  const client = createClient({
    url: 'redis://127.0.0.1:6379'
  });
  try {
    try {
      if (!login) {
        return NextResponse.json({ error: 'Forbidden: login required' }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Authorization check failed' }, { status: 401 });
    }

    try{

      await client.connect();
    }catch(e){
      try{
        const f = await fetch(`http://localhost:3000/api/getBalance?login=${login}&bankName=${bankName}`, {
            method: 'GET'
        })
        if(f.ok){
            const data = await f.json();
           return NextResponse.json({ value: data.balance}, { status: 200 });
        }else{

            return NextResponse.json({error: 'Failed to fetch balance'}, { status: 400 });
        }
    }catch(e){
        return NextResponse.json({error: e}, { status: 400 });
    }
    }
    const trans = await client.get(`${login}_${bankName}_balance`);
    if(!trans || trans === 'null'){
        try{
            const f = await fetch(`http://localhost:3000/api/getBalance?login=${login}&bankName=${bankName}`, {
                method: 'GET'
            })
            if(f.ok){
                const data = await f.json();
                client.set(`${login}_${bankName}_balance`, JSON.stringify(data.balance || 0))
                return NextResponse.json({value: data.balance})
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