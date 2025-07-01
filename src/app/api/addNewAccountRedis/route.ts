import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'redis'

export async function POST(request: NextRequest) {
  const data = await request.json()
  const { name, notes = '', currency, balance, login } = data;
  const client = createClient({ url: 'redis://127.0.0.1:6379' })
  
  try {
    await client.connect()
    
    // First add to MongoDB (source of truth)
    const res = await fetch(`http://localhost:3000/api/addNewAccount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, notes, currency, balance, login })
    })
    
    const result = await res.json()
    
    if (!res.ok) {
      await client.quit()
      return NextResponse.json(result, { status: res.status });
    }
    
    // If MongoDB update successful, update Redis cache
    try {
      // Update bank accounts list in Redis
      const redisKey = `bankAccounts_${login}`
      const existingData = await client.get(redisKey)
      
      if (existingData) {
        // Parse existing data
        let bankAccounts = []
        try {
          const parsed = JSON.parse(existingData)
          bankAccounts = parsed.bankAccounts || parsed || []
        } catch (e) {
          console.error('Error parsing Redis data:', e)
          bankAccounts = []
        }
        
        // Add new bank to the list
        const newBankForRedis = {
          id: result.bank.id,
          name,
          notes,
          currency,
          balance: Number(balance),
          login,
          createdAt: result.bank.createdAt
        }
        
        const updatedBankAccounts = [...bankAccounts, newBankForRedis]
        
        // Store updated list in Redis with 24 hour expiration
        await client.setEx(redisKey, 60 * 60 * 24, JSON.stringify(updatedBankAccounts))
      }
      
      // Initialize empty transaction cache for new bank
      const transKey = `${login}_${name}_transactions`
      await client.setEx(transKey, 60 * 60 * 24, JSON.stringify({}))
      
      // Initialize balance cache for new bank  
      const balanceKey = `${login}_${name}_balance`
      await client.setEx(balanceKey, 60 * 60 * 24, balance.toString())
      
    } catch (redisError) {
      console.error('Redis cache update error:', redisError)
      // Continue even if Redis fails - MongoDB is source of truth
    }
    
    await client.quit()
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    console.error('Error in addNewAccountRedis:', error)
    await client.quit()
    
    return NextResponse.json(
      { error: 'Failed to add bank account' },
      { status: 500 }
    );
  }
}