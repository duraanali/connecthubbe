import { NextRequest, NextResponse } from "next/server";
import { ConvexClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Id } from "../../../../convex/_generated/dataModel";

const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) throw new Error("Convex URL is not set!");
const convex = new ConvexClient(convexUrl);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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

// Helper function to verify JWT
const verifyToken = (token: string): (JwtPayload & { id: string }) | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & {
      id: string;
    };
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};

// POST /api/upload/image - Upload image and return full URL
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      const response = NextResponse.json(
        { error: "Invalid authorization header format" },
        { status: 401 }
      );
      addCorsHeaders(response);
      return response;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      const response = NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
      addCorsHeaders(response);
      return response;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      const response = NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
      addCorsHeaders(response);
      return response;
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const type = formData.get("type") as string;

    if (!file) {
      const response = NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
      addCorsHeaders(response);
      return response;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      const response = NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
      addCorsHeaders(response);
      return response;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const response = NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
      addCorsHeaders(response);
      return response;
    }

    if (!type || (type !== "profile" && type !== "post")) {
      const response = NextResponse.json(
        { error: "Type must be 'profile' or 'post'" },
        { status: 400 }
      );
      addCorsHeaders(response);
      return response;
    }

    // Generate upload URL
    const uploadUrl = await convex.mutation(api.files.generateUploadUrl, {
      type,
    });

    // Upload the file to Convex
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to Convex");
    }

    const { storageId } = await uploadResponse.json();

    // Save the file and get the URL
    const fileInfo = await convex.mutation(api.files.saveFile, {
      storageId: storageId as Id<"_storage">,
      type,
    });

    const response = NextResponse.json({
      success: true,
      url: fileInfo.url,
      storageId: fileInfo.storageId,
      type: type,
    });
    addCorsHeaders(response);
    return response;
  } catch (error) {
    console.error("Image upload error:", error);
    const response = NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
    addCorsHeaders(response);
    return response;
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
