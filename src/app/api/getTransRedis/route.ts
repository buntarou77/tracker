import { NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function GET(request: Request) {
const { searchParams } = new URL(request.url);
const login = searchParams.get('login');
  const client = createClient({
    url: 'redis://127.0.0.1:6379'
  });

  try {
    await client.connect();


    const trans = await client.get('trans');
    if(!trans){
        try{
            console.log(login)
            const f = await fetch(`http://localhost:3000/api/getTrans?login=${login}`, {
                method: 'GET'
            })
            if(f.ok){
                const data = await f.json();
               const transactions = await client.set('trans', JSON.stringify(data.transactions || []));
               return NextResponse.json({ transactions: transactions }, { status: 200 });
            }else{
                return NextResponse.json({error: 'Failed to fetch transactions'}, { status: 400 });
            }

        }catch(e){
            console.log(e)
            return NextResponse.json({error: e}, { status: 400 });
        }

    }else{
        const value = JSON.parse(trans)



        await client.disconnect();
        console.log('value:'+ value)
        return NextResponse.json({ value }, { status: 200 });
    }


  } catch (error) {
    await client.disconnect();
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}