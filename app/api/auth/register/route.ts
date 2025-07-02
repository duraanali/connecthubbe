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

// Helper function to add CORS headers
const addCorsHeaders = (response: NextResponse) => {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
};

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      const response = NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    // Check if user already exists
    const existingUser = await convex.query(api.users.getByEmail, { email });
    if (existingUser) {
      const response = NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
      return addCorsHeaders(response);
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
      const response = NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }

    // Get the created user
    const user = await convex.query(api.users.getById, { id: userId });
    if (!user) {
      const response = NextResponse.json(
        { error: "Failed to fetch created user" },
        { status: 500 }
      );
      return addCorsHeaders(response);
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

    // Add CORS headers and set auth cookie
    const corsResponse = addCorsHeaders(response);
    return setAuthCookie(corsResponse, token);
  } catch (error) {
    console.error("Registration error:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

// Add OPTIONS handler for preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
