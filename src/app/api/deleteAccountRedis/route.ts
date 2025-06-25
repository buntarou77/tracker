import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

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

    const client = createClient({ url: 'redis://127.0.0.1:6379' });

    try {
        await client.connect();

        const bankAccounts = await client.get(`bankAccounts_${login}`);
        
        if (!bankAccounts) {
            await client.quit();
            return NextResponse.json(
                { error: 'No bank accounts found in cache' },
                { status: 404 }
            );
        }

        const dataArr = JSON.parse(bankAccounts);
        
        const updatedAccounts = dataArr.filter((account: any) => account.name !== accountName);
        
        if (updatedAccounts.length === dataArr.length) {
            await client.quit();
            return NextResponse.json(
                { error: 'Bank account not found in cache' },
                { status: 404 }
            );
        }

        try {
            const res = await fetch(`http://localhost:3000/api/deleteAccount?login=${encodeURIComponent(login)}&accountName=${encodeURIComponent(accountName)}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                await client.set(`bankAccounts_${login}`, JSON.stringify(updatedAccounts));
                await client.quit();
                
                return NextResponse.json(
                    { 
                        success: true, 
                        message: 'Bank account deleted successfully',
                        value: updatedAccounts 
                    },
                    { status: 200 }
                );
            } else {
                const errorData = await res.json();
                await client.quit();
                return NextResponse.json(
                    { error: errorData.error || 'Failed to delete from database' },
                    { status: res.status }
                );
            }
        } catch (e) {
            await client.quit();
            return NextResponse.json(
                { error: 'Failed to communicate with database' },
                { status: 500 }
            );
        }

    } catch (e) {
        await client.quit();
        
        try {
            const res = await fetch(`http://localhost:3000/api/deleteAccount?login=${login}&accountName=${accountName}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (res.ok) {
                return NextResponse.json(
                    { success: true, message: 'Bank account deleted from database (cache unavailable)' },
                    { status: 200 }
                );
            } else {
                const errorData = await res.json();
                return NextResponse.json(
                    { error: errorData.error || 'Failed to delete account' },
                    { status: res.status }
                );
            }
        } catch (dbError) {
            return NextResponse.json(
                { error: 'Failed to delete account from database' },
                { status: 500 }
            );
        }
    }
}
