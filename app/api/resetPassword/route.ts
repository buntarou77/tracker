import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from "mongodb";
const JWT_SECRET = process.env.JWT_SECRET || '';

type User {
    _id: ObjectId,
    password_hash: string,
    createdAt: string | Date,
    email: string,
    user: string
}

interface TokenPayload {
  id: string;
  login: string;
}

export async function PATCH(request: Request){

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

    const {resetCode, newPassword} = await request.json()
    
    if(resetCode.trim() === '' || !resetCode){
        return NextResponse.json(
            {error: 'reset code is empty'},
            {status: 401})
    }

    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017')
    const db = client.db(process.env.MONGODB_DB_NAME || 'users')
    const requestUser: {password_hash: string} | null = await db.collection<User>('users').findOne({_id: new ObjectId(userId)}, {projection: {password_hash: 1}});
    if (!requestUser) {
    throw new Error("Пользователь не найден");
    }
    const passwordCompression = await bcryptjs.compare(newPassword, requestUser?.password_hash)
    if(passwordCompression){
        return NextResponse.json(
            {error: 'passwords cannot be the same'},
             {status: 401})
    }
    const salt = await bcryptjs.genSalt(10);
    const passHash = await bcryptjs.hash(newPassword.trim(), salt);
    await db.collection('users').updateOne({_id: new ObjectId(userId)}, {$set: {password_hash: passHash}});

    return NextResponse.json(
        {status: 200}
    )

}