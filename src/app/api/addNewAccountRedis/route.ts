import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'redis'
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const data = await request.json()
  const { name, notes = '', currency, balance, login } = data;
  try {
    if (!login) {
      return NextResponse.json({ error: 'Forbidden: login required' }, { status: 403 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Authorization check failed' }, { status: 401 });
  }
  const client = createClient({ url: 'redis://127.0.0.1:6379' })
  try {
    await client.connect()
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
    try {
      const redisKey = `bankAccounts_${login}`
      const existingData = await client.get(redisKey)
      if (existingData) {
        let bankAccounts = []
        try {
          const parsed = JSON.parse(existingData)
          bankAccounts = parsed.bankAccounts || parsed || []
        } catch (e) {
          bankAccounts = []
        }
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
        await client.setEx(redisKey, 60 * 60 * 24, JSON.stringify(updatedBankAccounts))
      }
      const transKey = `${login}_${name}_transactions`
      await client.setEx(transKey, 60 * 60 * 24, JSON.stringify({}))
      const balanceKey = `${login}_${name}_balance`
      await client.setEx(balanceKey, 60 * 60 * 24, balance.toString())
    } catch (redisError) {
    }
    await client.quit()
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    await client.quit()
    return NextResponse.json(
      { error: 'Failed to add bank account' },
      { status: 500 }
    );
  }
}