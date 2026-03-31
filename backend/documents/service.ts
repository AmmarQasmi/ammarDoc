// Document service layer - handles all document business logic

import { prisma } from "@/lib/prisma";
import {
  CreateDocumentInput,
  DocumentDTO,
  DEFAULT_DOCUMENT_CONTENT,
  DocumentContent,
} from "./types";
import {
  ApiErrorHandler,
  ERROR_CODES,
} from "@/backend/shared/api-types";
import {
  validateDocumentTitle,
  validateDocumentContent,
  validateDocumentId,
  validateUserId,
  combineValidationErrors,
} from "@/backend/shared/validation";
import {
  canEditDocument,
  canDeleteDocument,
  getDocumentPermission,
  Permission,
} from "@/backend/shared/permissions";

// ===== CREATE =====

export async function createDocument(
  input: CreateDocumentInput,
  userId: string
): Promise<DocumentDTO> {
  // Validation
  const titleError = validateDocumentTitle(input.title);
  const contentError = validateDocumentContent(input.contentJson);
  const userError = validateUserId(userId);
  const validation = combineValidationErrors(titleError, contentError, userError);

  if (!validation.isValid) {
    throw new ApiErrorHandler(
      ERROR_CODES.VALIDATION_ERROR,
      "Document creation validation failed",
      400,
      { errors: validation.errors }
    );
  }

  if (input.ownerUserId !== userId) {
    throw new ApiErrorHandler(
      ERROR_CODES.FORBIDDEN,
      "Cannot create document for another user",
      403
    );
  }

  try {
    const document = await prisma.document.create({
      data: {
        title: input.title.trim(),
        ownerUserId: userId,
        contentJson: (input.contentJson || DEFAULT_DOCUMENT_CONTENT) as any,
      },
    });

    return mapToDocumentDTO(document);
  } catch (error) {
    console.error("Create document error:", error);
    throw new ApiErrorHandler(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to create document",
      500
    );
  }
}

// ===== READ =====

export async function getDocument(
  documentId: string,
  userId: string
): Promise<DocumentDTO> {
  const idError = validateDocumentId(documentId);
  const userError = validateUserId(userId);
  const validation = combineValidationErrors(idError, userError);

  if (!validation.isValid) {
    throw new ApiErrorHandler(
      ERROR_CODES.VALIDATION_ERROR,
      "Invalid request",
      400,
      { errors: validation.errors }
    );
  }

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new ApiErrorHandler(
        ERROR_CODES.NOT_FOUND,
        "Document not found",
        404
      );
    }

    // Check permission
    const permission = await getDocumentPermission(documentId, userId);
    if (permission === Permission.NONE) {
      throw new ApiErrorHandler(
        ERROR_CODES.FORBIDDEN,
        "You do not have access to this document",
        403
      );
    }

    return mapToDocumentDTO(document);
  } catch (error) {
    if (error instanceof ApiErrorHandler) {
      throw error;
    }
    console.error("Get document error:", error);
    throw new ApiErrorHandler(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to fetch document",
      500
    );
  }
}

export async function listDocuments(userId: string) {
  const userError = validateUserId(userId);
  if (userError) {
    throw new ApiErrorHandler(
      ERROR_CODES.VALIDATION_ERROR,
      "Invalid user ID",
      400,
      { errors: [userError] }
    );
  }

  try {
    // Owned documents
    const ownedDocs = await prisma.document.findMany({
      where: { ownerUserId: userId },
      orderBy: { updatedAt: "desc" },
    });

    // Shared documents (via document_access)
    const sharedDocs = await prisma.document.findMany({
      where: {
        accesses: {
          some: { userId },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return {
      owned: ownedDocs.map(mapToDocumentDTO),
      shared: sharedDocs.map(mapToDocumentDTO),
    };
  } catch (error) {
    console.error("List documents error:", error);
    throw new ApiErrorHandler(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to fetch documents",
      500
    );
  }
}

// ===== UPDATE =====

export async function renameDocument(
  documentId: string,
  newTitle: string,
  userId: string
): Promise<DocumentDTO> {
  // Validation
  const idError = validateDocumentId(documentId);
  const titleError = validateDocumentTitle(newTitle);
  const userError = validateUserId(userId);
  const validation = combineValidationErrors(idError, titleError, userError);

  if (!validation.isValid) {
    throw new ApiErrorHandler(
      ERROR_CODES.VALIDATION_ERROR,
      "Invalid input",
      400,
      { errors: validation.errors }
    );
  }

  // Permission check
  const canEdit = await canEditDocument(documentId, userId);
  if (!canEdit) {
    throw new ApiErrorHandler(
      ERROR_CODES.FORBIDDEN,
      "You do not have permission to rename this document",
      403
    );
  }

  try {
    const document = await prisma.document.update({
      where: { id: documentId },
      data: { title: newTitle.trim() },
    });

    return mapToDocumentDTO(document);
  } catch (error) {
    if (error instanceof ApiErrorHandler) {
      throw error;
    }
    if ((error as any).code === "P2025") {
      throw new ApiErrorHandler(
        ERROR_CODES.NOT_FOUND,
        "Document not found",
        404
      );
    }
    console.error("Rename document error:", error);
    throw new ApiErrorHandler(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to rename document",
      500
    );
  }
}

export async function updateDocumentContent(
  documentId: string,
  contentJson: DocumentContent,
  userId: string
): Promise<DocumentDTO> {
  // Validation
  const idError = validateDocumentId(documentId);
  const contentError = validateDocumentContent(contentJson);
  const userError = validateUserId(userId);
  const validation = combineValidationErrors(idError, contentError, userError);

  if (!validation.isValid) {
    throw new ApiErrorHandler(
      ERROR_CODES.VALIDATION_ERROR,
      "Invalid input",
      400,
      { errors: validation.errors }
    );
  }

  // Permission check - only editors and owners can edit
  const canEdit = await canEditDocument(documentId, userId);
  if (!canEdit) {
    throw new ApiErrorHandler(
      ERROR_CODES.FORBIDDEN,
      "You do not have permission to edit this document",
      403
    );
  }

  try {
    const document = await prisma.document.update({
      where: { id: documentId },
      data: { contentJson: contentJson as any },
    });

    return mapToDocumentDTO(document);
  } catch (error) {
    if (error instanceof ApiErrorHandler) {
      throw error;
    }
    if ((error as any).code === "P2025") {
      throw new ApiErrorHandler(
        ERROR_CODES.NOT_FOUND,
        "Document not found",
        404
      );
    }
    console.error("Update content error:", error);
    throw new ApiErrorHandler(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to update document",
      500
    );
  }
}

// ===== DELETE =====

export async function deleteDocument(
  documentId: string,
  userId: string
): Promise<void> {
  // Validation
  const idError = validateDocumentId(documentId);
  const userError = validateUserId(userId);
  const validation = combineValidationErrors(idError, userError);

  if (!validation.isValid) {
    throw new ApiErrorHandler(
      ERROR_CODES.VALIDATION_ERROR,
      "Invalid input",
      400,
      { errors: validation.errors }
    );
  }

  // Permission check - only owner can delete
  const canDelete = await canDeleteDocument(documentId, userId);
  if (!canDelete) {
    throw new ApiErrorHandler(
      ERROR_CODES.FORBIDDEN,
      "Only the owner can delete this document",
      403
    );
  }

  try {
    await prisma.document.delete({
      where: { id: documentId },
    });
  } catch (error) {
    if ((error as any).code === "P2025") {
      throw new ApiErrorHandler(
        ERROR_CODES.NOT_FOUND,
        "Document not found",
        404
      );
    }
    console.error("Delete document error:", error);
    throw new ApiErrorHandler(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to delete document",
      500
    );
  }
}

// ===== HELPERS =====

function mapToDocumentDTO(doc: any): DocumentDTO {
  return {
    id: doc.id,
    ownerUserId: doc.ownerUserId,
    title: doc.title,
    contentJson: doc.contentJson as DocumentContent,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
