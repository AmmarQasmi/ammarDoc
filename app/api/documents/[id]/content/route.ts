// API: PUT /api/documents/[id]/content - Update document content

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { updateDocumentContent } from "@/backend/documents/service";
import { createApiResponse, ApiErrorHandler } from "@/backend/shared/api-types";

interface Params {
  id: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId(request);
    const body = await request.json();

    const document = await updateDocumentContent(id, body.contentJson, userId);

    return NextResponse.json(
      createApiResponse(true, document),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ApiErrorHandler) {
      return NextResponse.json(
        createApiResponse(false, undefined, error),
        { status: error.statusCode }
      );
    }

    console.error("PUT /api/documents/[id]/content error:", error);
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
