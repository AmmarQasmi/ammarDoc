import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createApiResponse } from "@/backend/shared/api-types";

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: "NOT_FOUND",
          message: "Current user not found",
          statusCode: 404,
        }),
        { status: 404 }
      );
    }

    return NextResponse.json(createApiResponse(true, user), { status: 200 });
  } catch (error) {
    console.error("GET /api/me error:", error);
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
