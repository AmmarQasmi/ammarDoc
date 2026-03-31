import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { importTextFile } from "@/backend/documents/service";
import { ApiErrorHandler, createApiResponse } from "@/backend/shared/api-types";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const formData = await request.formData();

    const rawFile = formData.get("file");
    const rawDocumentId = formData.get("documentId");

    if (!(rawFile instanceof File)) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: "VALIDATION_ERROR",
          message: "No file uploaded",
          statusCode: 400,
        }),
        { status: 400 }
      );
    }

    if (rawFile.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: "VALIDATION_ERROR",
          message: "File too large. Max size is 2MB.",
          statusCode: 400,
        }),
        { status: 400 }
      );
    }

    const textContent = await rawFile.text();
    const documentId = typeof rawDocumentId === "string" && rawDocumentId.trim().length > 0
      ? rawDocumentId
      : undefined;

    const document = await importTextFile({
      userId,
      filename: rawFile.name,
      mimeType: rawFile.type,
      sizeBytes: rawFile.size,
      textContent,
      documentId,
    });

    return NextResponse.json(createApiResponse(true, document), { status: 200 });
  } catch (error) {
    if (error instanceof ApiErrorHandler) {
      return NextResponse.json(
        createApiResponse(false, undefined, error),
        { status: error.statusCode }
      );
    }

    console.error("POST /api/import error:", error);
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
