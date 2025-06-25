import { NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function GET(request: Request) {
const { searchParams } = new URL(request.url);
const login = searchParams.get('login');
  const client = createClient({
    url: 'redis://127.0.0.1:6379'
  });
    try{
        await client.connect();
    }catch(e){
      return NextResponse.json({error: e}, { status: 400 });
    }

    

  
}