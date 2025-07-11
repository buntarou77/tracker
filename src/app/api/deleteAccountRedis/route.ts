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

        // First delete from MongoDB (source of truth)
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

        // If MongoDB deletion successful, update Redis caches
        try {
            // 1. Update bank accounts list cache
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
                    // If no accounts left, delete the key
                    await client.del(bankAccountsKey);
                }
            }

            // 2. Delete transactions cache for this bank
            const transactionsKey = `${login}_${accountName}_transactions`;
            await client.del(transactionsKey);

            // 3. Delete balance cache for this bank
            const balanceKey = `${login}_${accountName}_balance`;
            await client.del(balanceKey);

            // 4. Delete any other related caches (if exists)
            // For example, analytics cache if it includes this bank
            const pattern = `*${login}*${accountName}*`;
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(keys);
            }

        } catch (redisError) {
            console.error('Redis cache cleanup error:', redisError);
            // Continue even if Redis cleanup fails - MongoDB is source of truth
        }

        await client.quit();
        
        return NextResponse.json({
            success: true,
            message: 'Bank account deleted successfully',
            remainingBanks: result.remainingBanks || []
        }, { status: 200 });

    } catch (error) {
        console.error('Error in deleteAccountRedis:', error);
        
        // If Redis connection fails, try direct MongoDB deletion
        try {
            await client.quit();
        } catch (e) {
            // Ignore quit errors
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
