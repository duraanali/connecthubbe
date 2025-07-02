import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { generateToken, setAuthCookie } from "../../../auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
    const { email, password } = await req.json();

    if (!email || !password) {
      const response = NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    const user = await convex.query(api.users.getByEmail, { email });

    if (!user) {
      const response = NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
      return addCorsHeaders(response);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      const response = NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
      return addCorsHeaders(response);
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    });

    const corsResponse = addCorsHeaders(response);
    return setAuthCookie(corsResponse, token);
  } catch (error) {
    console.error("Login error:", error);
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
