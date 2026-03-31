import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createApiResponse } from "@/backend/shared/api-types";

export async function GET(request: NextRequest) {
  try {
    await getCurrentUserId(request);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(createApiResponse(true, users), { status: 200 });
  } catch (error) {
    console.error("GET /api/users error:", error);
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
