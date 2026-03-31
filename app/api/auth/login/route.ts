import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getCurrentUserId, signAuthToken } from "@/lib/auth";
import { createApiResponse } from "@/backend/shared/api-types";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    try {
      const existingUserId = await getCurrentUserId(request);
      if (existingUserId) {
        return NextResponse.json(
          createApiResponse(false, undefined, {
            code: "CONFLICT",
            message: "Already logged in. Please logout first before using another account.",
            statusCode: 409,
          }),
          { status: 409 }
        );
      }
    } catch {
      // Not logged in, continue.
    }

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: "VALIDATION_ERROR",
          message: "Email and password are required",
          statusCode: 400,
        }),
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
          statusCode: 401,
        }),
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
          statusCode: 401,
        }),
        { status: 401 }
      );
    }

    const token = signAuthToken({ userId: user.id });
    const response = NextResponse.json(
      createApiResponse(true, { id: user.id, name: user.name, email: user.email }),
      { status: 200 }
    );

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      createApiResponse(false, undefined, {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        statusCode: 500,
      }),
      { status: 500 }
    );
  }
}
