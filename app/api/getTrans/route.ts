import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || '';

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
    
    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get('bankId');
    const to = searchParams.get('to');
    const from = searchParams.get('from');
    const cursor = searchParams.get('cursor') || new Date();
    const limit = Number(searchParams.get('limit')) || 20;
    const category = searchParams.get('category');
    const type = searchParams.get('type');
   
    if (!bankId) {
        return NextResponse.json(
            { error: 'bankId parameter is required' },
            { status: 400 }
        );
    }

    if((cursor && to) || (cursor && from)){
        return NextResponse.json(
            { error: 'incompatible parameters'},
            { status: 400 }
        );
    } 

    if(type && !['gain', 'loss'].includes(type)){
        return NextResponse.json(
            { error: 'type can be only loss or gain'},
            { status: 400 }
        );
    }

    async function getTransactions() {
        const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
        try {
            await client.connect();
            const db = client.db('users');
            const query: any = {
                userId: userId,
                bankId: bankId
            }

            if (cursor) {
                query.date = { $lt: new Date(cursor) };
            }

            if (from && to) {
                query.date = {
                    $gte: new Date(from),
                    $lte: new Date(to)
                };
            }

            if (category) {
                query.category = category;
            }

            if (type) {
                query.type = type;
            }

            const request = await db.collection('transactions').find(query).sort({date: -1}).limit(limit + 1).toArray();

            const trans = request.slice(0, limit);
            const result = {
                ok: true,
                data: trans,
                meta: {
                    cursor: trans.length > 0 ? trans[trans.length - 1].date : null,
                    limit,
                    hasMore: request.length > limit,
                    returnedCount: trans.length,
                    range: {
                        from: cursor,
                        to: trans.length > 0 ? trans[trans.length - 1].date.toISOString() : null
                    },
                }
            }
            return result;
        } catch (error) {
            throw error;
        } finally {
            await client.close();
        }
    }
    
    try {
        const transactions = await getTransactions();
        return NextResponse.json(
             transactions ,
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to retrieve transactions' },
            { status: 500 }
        );
    }
}