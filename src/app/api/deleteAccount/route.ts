import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const login = searchParams.get('login');
    const accountName = searchParams.get('accountName');

    if (!login || !accountName) {
        return NextResponse.json(
            { error: 'Missing required parameters' },
            { status: 400 }
        );
    }

    // Проверка авторизации через /api/me
    try {
        const cookieHeader = cookies().toString();
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/me`, {
            method: 'GET',
            headers: { Cookie: cookieHeader },
            cache: 'no-store',
        });
        if (!meRes.ok) {
            return NextResponse.json({ error: 'Unauthorized (me endpoint failed)' }, { status: 401 });
        }
        const me = await meRes.json();
        if (!me.login || me.login !== login) {
            return NextResponse.json({ error: 'Forbidden: login mismatch' }, { status: 403 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Authorization check failed' }, { status: 401 });
    }

    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('users');
        
        // First check if user and bank account exist
        const user = await db.collection('users').findOne(
            { 
                user: login,
                "banks.name": accountName 
            }
        );
        
        if (!user) {
            return NextResponse.json(
                { error: 'User or bank account not found' },
                { status: 404 }
            );
        }
        
        // Check if this is the last bank account
        if (user.banks && user.banks.length === 1) {
            return NextResponse.json(
                { error: 'Cannot delete the last bank account' },
                { status: 400 }
            );
        }
        
        // Delete the bank account
        const result = await db.collection('users').updateOne(
            { user: login },
            { $pull: { banks: { name: accountName } } } as any
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json(
                { error: 'Failed to delete bank account' },
                { status: 500 }
            );
        }

        // Get updated bank list
        const updatedUser = await db.collection('users').findOne(
            { user: login },
            { projection: { banks: 1 } }
        );

        return NextResponse.json(
            { 
                success: true, 
                message: 'Bank account deleted successfully',
                remainingBanks: updatedUser?.banks || []
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error deleting bank account:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    } finally {
        await client.close();
    }
}