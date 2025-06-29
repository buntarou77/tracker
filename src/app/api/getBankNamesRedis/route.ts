import { NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function GET(request: Request) {
const { searchParams } = new URL(request.url);
const login = searchParams.get('login');
  const client = createClient({
    url: 'redis://127.0.0.1:6379'
  });

  try {
    try{
      await client.connect();
    }catch(e){
      try{
        const f = await fetch(`http://localhost:3000/api/getBankNames?login=${login}`, {
            method: 'GET'
        })
        if(f.ok){
            const data = await f.json();
            return NextResponse.json({ value: data}, { status: 200 });
        }else{
            return NextResponse.json({error: 'Failed to fetch balance'}, { status: 400 });
        }
    }catch(e){
        return NextResponse.json({error: e}, { status: 400 });
    }
    }

    const trans = await client.get(`bankNames_${login}`);
    console.log(trans);
    if(!trans || trans === 'null' || trans === null){
        try{
            const f = await fetch(`http://localhost:3000/api/getBankNames?login=${login}`, {
                method: 'GET'
            })
            if(f.ok){
                const data = await f.json();
                client.setEx(`bankNames_${login}`, 60 * 60 * 24, JSON.stringify(data))
                return NextResponse.json({value: data})
            }else{
              console.log('err1')
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
    console.log('err')
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}