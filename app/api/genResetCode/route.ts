import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import crypto from 'crypto';
import { getAuthUser } from '@/app/api/_lib/auth';
import clientPromise from '@/app/lib/mongodb';

export async function POST() {
    const user = getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME || 'users');

        // Raw code goes to the user; only its hash is stored, so a DB leak
        // cannot be used to reset passwords. resetPassword hashes the same way.
        const rawCode = crypto.randomBytes(32).toString('hex');
        const hashedCode = crypto.createHash('sha256').update(rawCode).digest('hex');

        await db.collection('resetCodes').insertOne({
            userId: new ObjectId(user.userId),
            code: hashedCode,
            used: false,
            createdAt: new Date(),
            expireAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        });

        // In production this code must be delivered by email, never returned in
        // the response. Returned in dev only so the flow stays testable.
        return NextResponse.json(
            {
                success: true,
                ...(process.env.NODE_ENV !== 'production' ? { resetCode: rawCode } : {}),
            },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
