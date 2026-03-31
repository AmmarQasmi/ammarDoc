import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import {
  grantDocumentAccess,
  listDocumentAccess,
  revokeDocumentAccess,
} from "@/backend/documents/service";
import { ApiErrorHandler, createApiResponse } from "@/backend/shared/api-types";

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId(request);
    const shares = await listDocumentAccess(id, userId);
    return NextResponse.json(createApiResponse(true, shares), { status: 200 });
  } catch (error) {
    if (error instanceof ApiErrorHandler) {
      return NextResponse.json(createApiResponse(false, undefined, error), {
        status: error.statusCode,
      });
    }
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId(request);
    const body = await request.json();

    const result = await grantDocumentAccess(id, userId, body.email, body.accessRole || "VIEWER");

    return NextResponse.json(createApiResponse(true, result), { status: 200 });
  } catch (error) {
    if (error instanceof ApiErrorHandler) {
      return NextResponse.json(createApiResponse(false, undefined, error), {
        status: error.statusCode,
      });
    }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId(request);
    const targetUserId = request.nextUrl.searchParams.get("userId") || "";

    await revokeDocumentAccess(id, userId, targetUserId);

    return NextResponse.json(createApiResponse(true, { removed: true }), { status: 200 });
  } catch (error) {
    if (error instanceof ApiErrorHandler) {
      return NextResponse.json(createApiResponse(false, undefined, error), {
        status: error.statusCode,
      });
    }
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
