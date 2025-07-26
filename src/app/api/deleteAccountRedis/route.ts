import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';
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

    try {
        if (!login) {
            return NextResponse.json({ error: 'Forbidden: login required' }, { status: 403 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Authorization check failed' }, { status: 401 });
    }

    const client = createClient({ url: 'redis://127.0.0.1:6379' });

    try {
        await client.connect();

        
        const res = await fetch(
            `http://localhost:3000/api/deleteAccount?login=${encodeURIComponent(login)}&accountName=${encodeURIComponent(accountName)}`, 
            {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            }
        );

        const result = await res.json();

        if (!res.ok) {
      
            await client.quit();
            return NextResponse.json(result, { status: res.status });
        }

        
        try {
            
            const bankAccountsKey = `bankNames_${login}`;
            const bankAccountsData = await client.get(bankAccountsKey);
            
            if (bankAccountsData) {
                let bankAccounts = [];
                try {
                    const parsed = JSON.parse(bankAccountsData);
                    bankAccounts = parsed.bankAccounts || parsed || [];
                } catch (e) {
                    console.error('Error parsing Redis bank accounts:', e);
                }
                
                const updatedAccounts = bankAccounts.filter((account: any) => account.name !== accountName);
      
                
                if (updatedAccounts.length > 0) {
                    await client.setEx(bankAccountsKey, 60 * 60 * 24, JSON.stringify(updatedAccounts));
                } else {
    
                    await client.del(bankAccountsKey);
                }
            }


            const transactionsKey = `${login}_${accountName}_transactions`;
            await client.del(transactionsKey);


            const balanceKey = `${login}_${accountName}_balance`;
            await client.del(balanceKey);


            const pattern = `*${login}*${accountName}*`;
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(keys);
            }

        } catch (redisError) {
            console.error('Redis cache cleanup error:', redisError);

        }

        await client.quit();
        
        return NextResponse.json({
            success: true,
            message: 'Bank account deleted successfully',
            remainingBanks: result.remainingBanks || []
        }, { status: 200 });

    } catch (error) {
        console.error('Error in deleteAccountRedis:', error);
        

        try {
            await client.quit();
        } catch (e) {

        }

        try {
            const res = await fetch(
                `http://localhost:3000/api/deleteAccount?login=${encodeURIComponent(login)}&accountName=${encodeURIComponent(accountName)}`,
                {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            
            const result = await res.json();
            return NextResponse.json(result, { status: res.status });
            
        } catch (dbError) {
            return NextResponse.json(
                { error: 'Failed to delete account' },
                { status: 500 }
            );
        }
    }
}
