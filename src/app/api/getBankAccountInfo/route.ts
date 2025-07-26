import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const login = searchParams.get('login');
  const bankName = searchParams.get('name');
  const skip = parseInt(searchParams.get('skip') || '0');
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!login || !bankName) {
    return NextResponse.json(
      { error: 'Login and name parameters are required' },
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

  if (skip < 0) {
    return NextResponse.json(
      { error: 'Skip parameter must be >= 0' },
      { status: 400 }
    );
  }

  if (limit <= 0 || limit > 100) {
    return NextResponse.json(
      { error: 'Limit must be between 1 and 100' },
      { status: 400 }
    );
  }

  async function getBankAccountInfo() {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    try {
      await client.connect();
      const db = client.db('users');
      

      const pipeline = [
        { $match: { user: login } },
        { $unwind: "$banks" },
        { $match: { "banks.name": bankName } },
        {
          $addFields: {
            "banks.sorted_transactions": {
              $sortArray: {
                input: "$banks.transactions",
                sortBy: { date: -1 }
              }
            }
          }
        },
        {
          $project: {
            name: "$banks.name",
            balance: "$banks.balance",
            currency: "$banks.currency",
            notes: "$banks.notes",
            transactions: {
              $slice: ["$banks.sorted_transactions", skip, limit]
            },
            total_transactions: { $size: "$banks.transactions" },
            pagination_info: {
              skip: skip,
              limit: limit,
              total: { $size: "$banks.transactions" },
              has_more: { 
                $gt: [
                  { $size: "$banks.transactions" }, 
                  { $add: [skip, limit] }
                ] 
              }
            }
          }
        }
      ];

      const result = await db.collection('users').aggregate(pipeline).toArray();
      
      if (!result || result.length === 0) {
        return null;
      }

      return result[0];

    } catch (error) {
      console.error('Error fetching bank account info:', error);
      throw error;
    } finally {
      await client.close();
    }
  }

  try {
    const bankAccountData = await getBankAccountInfo();
    
    if (!bankAccountData) {
      return NextResponse.json(
        { error: 'Bank account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: bankAccountData },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
