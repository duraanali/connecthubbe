import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { generateToken, setAuthCookie } from "../../../auth";

console.log(
  "process.env.NEXT_PUBLIC_CONVEX_URL",
  process.env.NEXT_PUBLIC_CONVEX_URL
);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
console.log(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await convex.query(api.users.getByEmail, { email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = await convex.mutation(api.users.create, {
      name,
      email,
      password: hashedPassword,
      createdAt: Date.now(),
    });

    if (!userId) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Get the created user
    const user = await convex.query(api.users.getById, { id: userId });
    if (!user) {
      return NextResponse.json(
        { error: "Failed to fetch created user" },
        { status: 500 }
      );
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      name: user.name,
    });

    // Create response with user data and token
    const response = NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    });

    // Set auth cookie and return response
    return setAuthCookie(response, token);
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
