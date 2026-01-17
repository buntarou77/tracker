import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export default function auth(request: NextRequest, updateLogin: string = '' ): VerifyJwtResult{
    try{
    if(updateLogin === '' && request.method !== 'GET') throw new Error('invalid jwt')
    let login = updateLogin !== '' ? updateLogin : request.nextUrl.searchParams.get('login');
    const token = cookies().get('accessToken')?.value;
    if(!process.env.JWT_SECRET) throw new Error('no jwt env secret')
    const JWT_SECRET: string   = process.env.JWT_SECRET;
    const payload = jwt.verify(token, JWT_SECRET) as unknown as Payload;

    if(payload.login !== login ) throw new Error('invalid jwt token for this login')
    return {
    error: '',
    ok: true,
    payload
    }
    }catch(e: unknown){
        const message = e instanceof Error ? e.message:  String(e);
        const payload = {
            id: null,
            login: null
        }
        return {
            error: message,
            ok: false,
            payload
        }
    }


}