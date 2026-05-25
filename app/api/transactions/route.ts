import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import clientPromise from "@/app/lib/mongodb";
import getEnv from "@/app/lib/getEnv";

const JWT_SECRET = getEnv("JWT_SECRET");

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
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bankId = searchParams.get("bankId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const category = searchParams.get("category");
  const type = searchParams.get("type");

  if (!bankId) {
    return NextResponse.json({ error: "bankId is required" }, { status: 400 });
  }

  if (type && !["gain", "loss"].includes(type)) {
    return NextResponse.json(
      { error: "type must be gain or loss" },
      { status: 400 },
    );
  }

  if (cursor && (from || to)) {
    return NextResponse.json(
      { error: "cursor and from/to are incompatible" },
      { status: 400 },
    );
  }

  const useDateRange = from && to;

  if (useDateRange) {
    const startDate = new Date(from);
    const endDate = new Date(to);
    if (
      endDate.getTime() - startDate.getTime() >
      Number(process.env.MONTHS_LIMIT)
    ) {
      return NextResponse.json(
        { error: "Range cannot exceed 3 months" },
        { status: 400 },
      );
    }
  }

  try {
    const client = await clientPromise;
    const db = client.db("users");
    const query: any = { userId, bankId };

    if (useDateRange) {
      query.date = { $gte: new Date(from), $lte: new Date(to) };
    } else {
      query.date = { $lt: new Date(cursor || new Date()) };
    }

    if (category) query.category = category;
    if (type) query.type = type;

    if (useDateRange) {
      const records = await db
        .collection("transactions")
        .find(query)
        .sort({ date: -1 })
        .toArray();
      return NextResponse.json({
        ok: true,
        data: records.map((item) => ({
          ...item,
          id: item._id,
          _id: undefined,
        })),
        meta: {
          returnedCount: records.length,
          range: { from, to },
        },
      });
    } else {
      const records = await db
        .collection("transactions")
        .find(query)
        .sort({ date: -1 })
        .limit(limit + 1)
        .toArray();
      const data = records.slice(0, limit);
      return NextResponse.json({
        ok: true,
        data: data.map((item) => ({ ...item, id: item._id, _id: undefined })),
        meta: {
          cursor: records.length > limit ? records[limit].date : null,
          limit,
          hasMore: records.length > limit,
          returnedCount: data.length,
          range: {
            from: cursor || new Date().toISOString(),
            to:
              data.length > 0 ? data[data.length - 1].date.toISOString() : null,
          },
        },
      });
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve transactions" },
      { status: 500 },
    );
  }
}
