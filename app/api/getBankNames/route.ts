import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import clientPromise from "@/app/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "";

interface TokenPayload {
  id: string;
  login: string;
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: string;
  try {
    const verified = jwt.verify(token, JWT_SECRET) as TokenPayload;
    userId = verified.id;
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "desc" ? -1 : 1;

  const currency = searchParams.get("currency");

  const client = await clientPromise;

  try {
    const db = client.db("users");

    const filter: Record<string, any> = { userId };
    if (currency) {
      filter.currency = currency;
    }

    let bankAccounts = await db
      .collection("bankAccounts")
      .find(filter)
      .sort({ [sortBy]: sortOrder })
      .toArray();
    const transformedBanks = bankAccounts.map((bank: any) => {
      const { _id, ...rest } = bank;
      return {
        ...rest,
        id: _id?.toString() ?? bank.id,
      };
    });

    return NextResponse.json(
      {
        success: true,
        banks: transformedBanks,
        count: transformedBanks.length,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve bank accounts" },
      { status: 500 },
    );
  } finally {
  }
}
