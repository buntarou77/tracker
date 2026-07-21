import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/app/lib/mongodb";
import { getAuthUser } from "@/app/api/_lib/auth";

export async function POST(request: NextRequest) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.userId;

  let data;
  try {
    data = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  const { amount, category, date, type, bankId } = data;
  const numeralAmount = Number(amount);

  if (!numeralAmount || isNaN(numeralAmount) || !category || !date || !bankId) {
    return NextResponse.json(
      {
        error:
          "Required fields missing or invalid: amount, category, date, bankId",
      },
      { status: 400 },
    );
  }

  if (type !== "gain" && type !== "loss") {
    return NextResponse.json(
      { error: 'Invalid transaction type. Must be "gain" or "loss"' },
      { status: 400 },
    );
  }

  // Reject malformed bankId before new ObjectId() throws and turns into a 500.
  if (!ObjectId.isValid(bankId)) {
    return NextResponse.json({ error: "Invalid bankId" }, { status: 400 });
  }

  const transactionDate = new Date(date);
  if (isNaN(transactionDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const year = transactionDate.getFullYear();
  const month = String(transactionDate.getMonth() + 1).padStart(2, "0");
  const monthKey = `${year}-${month}`;

  const newTransaction = {
    userId,
    bankId,
    amount: numeralAmount,
    category,
    date: transactionDate,
    monthKey,
    createdAt: new Date(),
    type,
  };

  const mongoClient = await clientPromise;
  const session = mongoClient.startSession();
  try {
    let insertedId: ObjectId | undefined;
    let newBalance: number | undefined;

    await session.withTransaction(async () => {
      const db = mongoClient.db("users");

      // Update the balance first and require the bank to exist AND belong to
      // this user. If it doesn't, throw so the whole transaction rolls back and
      // we never leave an orphan transaction without a matching balance change.
      const update =
        type === "loss"
          ? { $inc: { balance: -numeralAmount } }
          : { $inc: { balance: numeralAmount } };

      const updatedBank = await db
        .collection("bankAccounts")
        .findOneAndUpdate({ userId, _id: new ObjectId(bankId) }, update, {
          returnDocument: "after",
          session,
        });

      if (!updatedBank) {
        throw new Error("BANK_NOT_FOUND");
      }
      newBalance = updatedBank.balance;

      const result = await db
        .collection("transactions")
        .insertOne(newTransaction, { session });
      insertedId = result.insertedId;
    });

    return NextResponse.json(
      {
        success: true,
        data: { ...newTransaction, _id: insertedId },
        balance: newBalance,
        monthKey,
        transactionAdded: true,
      },
      { status: 201 },
    );
  } catch (error: any) {
    if (error?.message === "BANK_NOT_FOUND") {
      return NextResponse.json(
        { error: "Bank account not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
