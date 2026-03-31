// API: GET /api/documents/[id] - Get single document
// API: PUT /api/documents/[id] - Rename document
// API: DELETE /api/documents/[id] - Delete document

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import {
  getDocument,
  renameDocument,
  deleteDocument,
} from "@/backend/documents/service";
import { createApiResponse, ApiErrorHandler } from "@/backend/shared/api-types";

interface Params {
  id: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId(_request);

    const document = await getDocument(id, userId);

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

    console.error("GET /api/documents/[id] error:", error);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId(request);
    const body = await request.json();

    const document = await renameDocument(id, body.title, userId);

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

    console.error("PUT /api/documents/[id] error:", error);
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
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId(_request);

    await deleteDocument(id, userId);

    return NextResponse.json(
      createApiResponse(true, { id }),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ApiErrorHandler) {
      return NextResponse.json(
        createApiResponse(false, undefined, error),
        { status: error.statusCode }
      );
    }

    console.error("DELETE /api/documents/[id] error:", error);
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
