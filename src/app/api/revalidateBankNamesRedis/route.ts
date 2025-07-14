import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    const data = await request.json();
    const { login } = data;
    
    if (!login) {
        return NextResponse.json(
            { error: 'Login parameter is required' },
            { status: 400 }
        );
    }
    
    const client = createClient({ url: 'redis://127.0.0.1:6379' });
    
    try {
        await client.connect();
        
        const bankNamesKey = `bankNames_${login}`;
        const deleteResult = await client.del(bankNamesKey);
        
  
        
        await client.quit();
        
        try {
            const cookieHeader = cookies().toString();
            const res = await fetch(`http://localhost:3000/api/getBankNamesRedis?login=${encodeURIComponent(login)}`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    Cookie: cookieHeader 
                }
            });
            
            if (res.ok) {
                const freshData = await res.json();
                
                return NextResponse.json({
                    success: true,
                    message: 'Bank names cache invalidated and refreshed',
                    deletedKeys: deleteResult,
                    freshData: freshData.value
                }, { status: 200 });
            } else {
                return NextResponse.json({
                    success: true,
                    message: 'Bank names cache invalidated, but failed to refresh',
                    deletedKeys: deleteResult,
                    error: 'Failed to fetch fresh data'
                }, { status: 200 });
            }
        } catch (fetchError) {
            console.error('Error fetching fresh bank names:', fetchError);
            
            return NextResponse.json({
                success: true,
                message: 'Bank names cache invalidated, but failed to refresh',
                deletedKeys: deleteResult,
                error: 'Failed to communicate with getBankNamesRedis'
            }, { status: 200 });
        }
        
    } catch (error) {
        console.error('Error invalidating bank names cache:', error);
        
        // If Redis fails, still try to get fresh data
        try {
            await client.quit();
        } catch (e) {
            // Ignore quit errors
        }
        
        try {
            const cookieHeader = cookies().toString();
            const res = await fetch(`http://localhost:3000/api/getBankNamesRedis?login=${encodeURIComponent(login)}`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    Cookie: cookieHeader 
                }
            });
            
            if (res.ok) {
                const freshData = await res.json();
                
                return NextResponse.json({
                    success: true,
                    message: 'Failed to invalidate cache, but fetched fresh data',
                    freshData: freshData.value
                }, { status: 200 });
            }
        } catch (fetchError) {
            // Both operations failed
        }
        
        return NextResponse.json(
            { error: 'Failed to invalidate cache and fetch fresh data' },
            { status: 500 }
        );
    }
}

// Optional: Add GET method for convenience
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const login = searchParams.get('login');
    
    if (!login) {
        return NextResponse.json(
            { error: 'Login parameter is required' },
            { status: 400 }
        );
    }
    
    // Reuse POST logic
    return POST(new NextRequest(request.url, {
        method: 'POST',
        body: JSON.stringify({ login }),
        headers: { 'Content-Type': 'application/json' }
    }));
} 