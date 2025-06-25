import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';

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

    async function deleteBankAccount() {
        const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
        try {
            await client.connect();
            const db = client.db('users');
            
            const result = await db.collection('users').updateOne(
                { user: login },
                { $pull: { banks: { name: accountName } } } as any
            );

            if (result.matchedCount === 0) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            if (result.modifiedCount === 0) {
                return NextResponse.json(
                    { error: 'Bank account not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { success: true, message: 'Bank account deleted successfully' },
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

    return deleteBankAccount();
}