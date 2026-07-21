import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken';
import { ObjectId } from "mongodb";
import crypto from 'crypto';
import clientPromise from '@/app/lib/mongodb';
const JWT_SECRET: string = process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET is not set'); })();

type User = {
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

    const client = await clientPromise
    const session = client.startSession();
    try{
    session.startTransaction()
    const db = client.db(process.env.MONGODB_DB_NAME || 'users')
    const heashResetCode = crypto.createHash('sha256').update(resetCode).digest('hex');
    const resetCodeFromDb = await db.collection('resetCodes').findOneAndUpdate({code: heashResetCode, userId: new ObjectId(userId), expireAt: {$gt: new Date()}}, {$set: {used: true}}, {session})

    if(!resetCodeFromDb){
        await session.abortTransaction();
        return NextResponse.json(
            {error: 'reset code is invalid'},
            {status: 401})
    }

    const requestUser: {password_hash: string} | null = await db.collection<User>('users').findOne({_id: new ObjectId(userId)}, {projection: {password_hash: 1}});
    if (!requestUser) {
    throw new Error("user is not found");
    }
    const passwordCompression = await bcryptjs.compare(newPassword, requestUser?.password_hash)
    if(passwordCompression){
        await session.abortTransaction();
        return NextResponse.json(
            {error: 'passwords cannot be the same'},
             {status: 401})
    }

    const salt = await bcryptjs.genSalt(10);
    const passHash = await bcryptjs.hash(newPassword.trim(), salt);
    await db.collection('users').updateOne({_id: new ObjectId(userId)}, {$set: {password_hash: passHash}}, {session});

    await session.commitTransaction();
    return NextResponse.json(
        {status: 200}
    )
    }catch(error){
        await session.abortTransaction();
        return NextResponse.json(
            {error: 'server error'},
            {status: 500}
        )
    }


}