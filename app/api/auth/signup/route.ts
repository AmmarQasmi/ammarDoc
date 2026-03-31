import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getCurrentUserId, signAuthToken } from "@/lib/auth";
import { createApiResponse } from "@/backend/shared/api-types";
import bcrypt from "bcryptjs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

export async function POST(request: NextRequest) {
  try {
    try {
      const existingUserId = await getCurrentUserId(request);
      if (existingUserId) {
        return NextResponse.json(
          createApiResponse(false, undefined, {
            code: "CONFLICT",
            message: "Already logged in. Please logout first before creating another account.",
            statusCode: 409,
          }),
          { status: 409 }
        );
      }
    } catch {
      // Not logged in, continue.
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name || !email || !password) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: "VALIDATION_ERROR",
          message: "Name, email, and password are required",
          statusCode: 400,
        }),
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: "VALIDATION_ERROR",
          message: "Name must be between 2 and 80 characters",
          statusCode: 400,
        }),
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: "VALIDATION_ERROR",
          message: "Please enter a valid email address",
          statusCode: 400,
        }),
        { status: 400 }
      );
    }

    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: "VALIDATION_ERROR",
          message: "Password must be 8-64 chars and include uppercase, lowercase, number, and special character",
          statusCode: 400,
        }),
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.passwordHash) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: "CONFLICT",
          message: "Email is already registered",
          statusCode: 409,
        }),
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name,
            passwordHash,
          },
          select: { id: true, name: true, email: true },
        })
      : await prisma.user.create({
          data: {
            name,
            email,
            passwordHash,
          },
          select: { id: true, name: true, email: true },
        });

    const token = signAuthToken({ userId: user.id });

    const response = NextResponse.json(createApiResponse(true, user), { status: 201 });
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
    console.error("POST /api/auth/signup error:", error);
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
