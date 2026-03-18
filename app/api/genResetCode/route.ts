import { ObjectId, MongoClient } from "mongodb";
import jwt from 'jsonwebtoken';
import {  NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from 'crypto';
import type { TokenPayload } from "@/app/types/api";
const JWT_SECRET = process.env.JWT_SECRET || '';
export default async function POST(request: Request) {
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

    const client = new MongoClient('mongodb://localhost:27017');
    try {
        client.connect();
        const data = {
            userId: new ObjectId(userId),
            resetCode: crypto.randomBytes(32).toString('hex'),
            used: false,
            expireAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
        }

    }catch (error){
        return NextResponse.json(
            { error: 'Database error' },
            { status: 500 })
    }

}