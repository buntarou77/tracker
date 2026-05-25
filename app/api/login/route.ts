import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { generateTokens } from "../auth/auth";
import clientPromise from "@/app/lib/mongodb";

interface User {
  _id: string;
  user: string;
  email: string;
  password_hash: string;
}

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();
    if (!login || !password) {
      return NextResponse.json(
        { error: "Login and password are required" },
        { status: 400 },
      );
    }
    const client = await clientPromise;
    try {
      const db = client.db(process.env.MONGODB_DB_NAME || "users");
      const user = (await db
        .collection(process.env.COLLECTION_NAME || "users")
        .findOne(
          {
            user: login,
          },
          { projection: { _id: 1, email: 1, password_hash: 1, user: 1 } },
        )) as User | null;
      if (!user) {
        return NextResponse.json(
          { error: "Incorrect login or password" },
          { status: 400 },
        );
      }
      const requestId = user._id.toString();
      const requestUsername = user.user;
      const isPasswordValid = await bcryptjs.compare(
        password,
        user.password_hash,
      );
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Incorrect login or password" },
          { status: 400 },
        );
      }
      const { password_hash, ...userWithoutPassword } = user;

      const tokens = generateTokens({
        id: user._id.toString(),
        login: user.user,
      });

      const response = NextResponse.json(
        {
          success: true,
          user: {
            id: user._id.toString(),
            user: user.user,
            email: user.email,
          },
        },
        { status: 200 },
      );
      response.cookies.set("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60,
        path: "/",
        sameSite: "lax",
      });

      response.cookies.set("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
        sameSite: "lax",
      });

      return response;
    } finally {
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "An error occurred during login",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
