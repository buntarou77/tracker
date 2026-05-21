import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import bcryptjs from "bcryptjs";
import { TokenPayload } from "@/app/types/api";
import clientPromise from '@/app/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || "";

export default async function POST(request: Request){
    const cookiesStore = cookies();
    const token = cookiesStore.get('accessToken')?.value;
    if (!token) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    let userId: string;

    try{
        const verified = jwt.verify(token, JWT_SECRET) as TokenPayload;
        userId = verified.id;
    }catch(e){
        return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
        )
    }

    const {newEmail, password} = await request.json();

    if(newEmail.trim() === '' || !newEmail){
        return NextResponse.json(
            {error: 'new email is empty'},
            {status: 401})
    }

    if(password.trim() === '' || !password){
        return NextResponse.json(
            {error: 'password is empty'},
            {status: 401})
    }else if(password.length < 8){
        return NextResponse.json(
            {error: 'password must be at least 8 characters'},
            {status: 401})
    }

    const client = await clientPromise;
    try{
        const db = client.db('users');
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }
        const passwordCompare = await bcryptjs.compare(password, user.password_hash);
        if(!passwordCompare){
            return NextResponse.json(
                { error: 'Incorrect password' },
                { status: 401 }
            );
        }else{
            const hashedPassword = await bcryptjs.hash(password, 10);
            await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { email: newEmail, password_hash: hashedPassword } });
            return NextResponse.json(
                { message: 'Email changed successfully' },
                { status: 200 }
            );
        }
    }catch(e){
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}