// API: GET /api/documents - List all owned and shared documents
// API: POST /api/documents - Create new document

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import {
  createDocument,
  listDocuments,
} from "@/backend/documents/service";
import { createApiResponse, ApiErrorHandler } from "@/backend/shared/api-types";

export async function GET(_request: NextRequest) {
  try {
    const userId = await getCurrentUserId(_request);

    const documents = await listDocuments(userId);

    return NextResponse.json(
      createApiResponse(true, documents),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ApiErrorHandler) {
      return NextResponse.json(
        createApiResponse(false, undefined, error),
        { status: error.statusCode }
      );
    }

    console.error("GET /api/documents error:", error);
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

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();

    const document = await createDocument(
      {
        title: body.title,
        ownerUserId: userId,
        contentJson: body.contentJson,
      },
      userId
    );

    return NextResponse.json(
      createApiResponse(true, document),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ApiErrorHandler) {
      return NextResponse.json(
        createApiResponse(false, undefined, error),
        { status: error.statusCode }
      );
    }

    console.error("POST /api/documents error:", error);
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
