import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import clientPromise from '@/app/lib/mongodb';

const JWT_SECRET: string = process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET is not set'); })();

interface TokenPayload {
  id: string;
  login: string;
}

export async function GET(request: NextRequest) {
    const cookieStore = cookies();
    const token = cookieStore.get('accessToken')?.value;
    
    if (!token) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    let userId: string;
    try {
        const verified = jwt.verify(token, JWT_SECRET) as TokenPayload;
        userId = verified.id;
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
        );
    }
    try{
        const client = await clientPromise;
        const db = client.db('users');
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId)}, { projection: { password_hash: 0 } });
        
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({...user, id: userId}, {status: 200});
    }catch(e){
        return NextResponse.json({error: 'iternal server error'}, {status: 500});
    }
    
}