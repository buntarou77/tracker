import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { TokenPayload } from "@/app/types/api";
import { cookies } from "next/headers";
import clientPromise from '@/app/lib/mongodb';

const JWT_SECRET: string = process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET is not set'); })();
export default async function POST(request: Request){

   const cookieStore = cookies();
       const token = cookieStore.get('accessToken')?.value;
       
       if (!token) {
           return NextResponse.json(
               { error: 'Unauthorized' },
               { status: 401 }
           );
       }
   
       let userId: string;
       let actualUsername
       try {
           const verified = jwt.verify(token, JWT_SECRET) as TokenPayload;
           userId = verified.id;
           actualUsername = verified.login;
       } catch (error) {
           return NextResponse.json(
               { error: 'Invalid token' },
               { status: 401 }
           );
       }

       const {username} = await request.json()

       if(username.trim() === '' || !username){
        return NextResponse.json(
            {error: 'username is empty'},
            {status: 401})
       }else if(username.length > 20){
        return NextResponse.json(
            {error: 'username is too long'},
            {status: 401})
       }else if(username.trim() === actualUsername){
        return NextResponse.json(
            {error: 'username is the same'},
            {status: 401}
        )
       }

    const client = await clientPromise

    try{
        const db = client.db(process.env.MONGODB_DB_NAME || 'users');
        const userMatch = await db.collection('users').findOne({user: username})
        if(userMatch){
            return NextResponse.json(
                {error: 'username already exists'},
                {status: 401}   
            )
        }
        await db.collection('users').updateOne({_id: new ObjectId(userId)}, {$set: {user: username}});
        return NextResponse.json({message: 'username changed'})
    }catch(e){
        return NextResponse.json(
            {error: 'server error'},
            {status: 500}
        )
    }

}