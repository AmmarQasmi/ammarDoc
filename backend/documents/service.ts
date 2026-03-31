// Document service layer - handles all document business logic

import { prisma } from "@/lib/prisma";
import { sendShareEmail } from "@/lib/email";
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
  canShareDocument,
  getDocumentPermission,
  Permission,
} from "@/backend/shared/permissions";

type ImportTextFileInput = {
  userId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  textContent: string;
  documentId?: string;
};

type ShareRole = "VIEWER" | "EDITOR";

type DocumentShareDTO = {
  userId: string;
  email: string;
  name: string;
  accessRole: ShareRole;
  grantedAt: string;
};

type ShareResult = {
  shared: boolean;
  invitedUserCreated: boolean;
  emailSent: boolean;
  emailError?: string;
  emailedTo?: string;
};

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

// ===== FILE IMPORT =====

export async function importTextFile(input: ImportTextFileInput): Promise<DocumentDTO> {
  const userError = validateUserId(input.userId);
  const idError = input.documentId ? validateDocumentId(input.documentId) : null;
  const validation = combineValidationErrors(userError, idError);

  if (!validation.isValid) {
    throw new ApiErrorHandler(
      ERROR_CODES.VALIDATION_ERROR,
      "Invalid import request",
      400,
      { errors: validation.errors }
    );
  }

  const normalizedFilename = input.filename?.trim() || "imported-document.txt";
  const extension = getFileExtension(normalizedFilename);
  if (extension !== "txt" && extension !== "md") {
    throw new ApiErrorHandler(
      ERROR_CODES.VALIDATION_ERROR,
      "Only .txt and .md files are supported",
      400
    );
  }

  if (input.sizeBytes <= 0) {
    throw new ApiErrorHandler(
      ERROR_CODES.VALIDATION_ERROR,
      "Uploaded file is empty",
      400
    );
  }

  const importedContent = plainTextToDocumentContent(input.textContent);

  try {
    if (!input.documentId) {
      const createdDocument = await prisma.document.create({
        data: {
          ownerUserId: input.userId,
          title: filenameToTitle(normalizedFilename),
          contentJson: importedContent as any,
        },
      });

      await prisma.fileImport.create({
        data: {
          documentId: createdDocument.id,
          uploadedByUserId: input.userId,
          originalFilename: normalizedFilename,
          mimeType: input.mimeType || "text/plain",
          sizeBytes: input.sizeBytes,
          storageUrlOrPath: "inline-import",
          importedText: input.textContent.slice(0, 10000),
        },
      });

      return mapToDocumentDTO(createdDocument);
    }

    const canEdit = await canEditDocument(input.documentId, input.userId);
    if (!canEdit) {
      throw new ApiErrorHandler(
        ERROR_CODES.FORBIDDEN,
        "You do not have permission to import into this document",
        403
      );
    }

    const existingDocument = await prisma.document.findUnique({
      where: { id: input.documentId },
    });

    if (!existingDocument) {
      throw new ApiErrorHandler(ERROR_CODES.NOT_FOUND, "Document not found", 404);
    }

    const mergedContent = mergeDocumentContent(
      existingDocument.contentJson as unknown as DocumentContent,
      importedContent,
      normalizedFilename
    );

    const updatedDocument = await prisma.document.update({
      where: { id: input.documentId },
      data: {
        contentJson: mergedContent as any,
      },
    });

    await prisma.fileImport.create({
      data: {
        documentId: input.documentId,
        uploadedByUserId: input.userId,
        originalFilename: normalizedFilename,
        mimeType: input.mimeType || "text/plain",
        sizeBytes: input.sizeBytes,
        storageUrlOrPath: "inline-import",
        importedText: input.textContent.slice(0, 10000),
      },
    });

    return mapToDocumentDTO(updatedDocument);
  } catch (error) {
    if (error instanceof ApiErrorHandler) {
      throw error;
    }

    console.error("Import file error:", error);
    throw new ApiErrorHandler(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to import file",
      500
    );
  }
}

// ===== SHARING =====

export async function grantDocumentAccess(
  documentId: string,
  ownerUserId: string,
  targetEmail: string,
  accessRole: ShareRole
): Promise<ShareResult> {
  const idError = validateDocumentId(documentId);
  const userError = validateUserId(ownerUserId);
  const validation = combineValidationErrors(idError, userError);

  if (!validation.isValid) {
    throw new ApiErrorHandler(ERROR_CODES.VALIDATION_ERROR, "Invalid share request", 400, {
      errors: validation.errors,
    });
  }

  const isOwner = await canShareDocument(documentId, ownerUserId);
  if (!isOwner) {
    throw new ApiErrorHandler(
      ERROR_CODES.FORBIDDEN,
      "Only document owner can share",
      403
    );
  }

  const normalizedEmail = targetEmail.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new ApiErrorHandler(ERROR_CODES.VALIDATION_ERROR, "Target user email is required", 400);
  }

  if (!normalizedEmail.endsWith("@gmail.com")) {
    throw new ApiErrorHandler(
      ERROR_CODES.VALIDATION_ERROR,
      "Sharing is currently supported for Gmail users only",
      400
    );
  }

  if (accessRole !== "VIEWER" && accessRole !== "EDITOR") {
    throw new ApiErrorHandler(ERROR_CODES.VALIDATION_ERROR, "Invalid access role", 400);
  }

  const owner = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: { name: true, email: true },
  });
  if (!owner) {
    throw new ApiErrorHandler(ERROR_CODES.NOT_FOUND, "Owner not found", 404);
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { title: true },
  });
  if (!document) {
    throw new ApiErrorHandler(ERROR_CODES.NOT_FOUND, "Document not found", 404);
  }

  let targetUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  let invitedUserCreated = false;

  if (!targetUser) {
    invitedUserCreated = true;
    targetUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: deriveNameFromEmail(normalizedEmail),
      },
    });
  }

  if (targetUser.id === ownerUserId) {
    throw new ApiErrorHandler(ERROR_CODES.VALIDATION_ERROR, "Owner already has full access", 400);
  }

  await prisma.documentAccess.upsert({
    where: {
      documentId_userId: {
        documentId,
        userId: targetUser.id,
      },
    },
    update: {
      accessRole,
      grantedByUserId: ownerUserId,
      grantedAt: new Date(),
    },
    create: {
      documentId,
      userId: targetUser.id,
      accessRole,
      grantedByUserId: ownerUserId,
    },
  });

  const emailResult = await sendShareEmail({
    toEmail: normalizedEmail,
    toName: targetUser.name,
    ownerName: owner.name,
    ownerEmail: owner.email,
    documentTitle: document.title,
    documentId,
    role: accessRole,
  });

  return {
    shared: true,
    invitedUserCreated,
    emailSent: emailResult.sent,
    emailError: emailResult.error,
    emailedTo: normalizedEmail,
  };
}

export async function listDocumentAccess(
  documentId: string,
  requesterUserId: string
): Promise<DocumentShareDTO[]> {
  const isOwner = await canShareDocument(documentId, requesterUserId);
  if (!isOwner) {
    throw new ApiErrorHandler(
      ERROR_CODES.FORBIDDEN,
      "Only owner can view sharing settings",
      403
    );
  }

  const shares = await prisma.documentAccess.findMany({
    where: { documentId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { grantedAt: "desc" },
  });

  return shares.map((share) => ({
    userId: share.userId,
    email: share.user.email,
    name: share.user.name,
    accessRole: share.accessRole as ShareRole,
    grantedAt: share.grantedAt.toISOString(),
  }));
}

export async function revokeDocumentAccess(
  documentId: string,
  ownerUserId: string,
  targetUserId: string
): Promise<void> {
  const isOwner = await canShareDocument(documentId, ownerUserId);
  if (!isOwner) {
    throw new ApiErrorHandler(
      ERROR_CODES.FORBIDDEN,
      "Only owner can revoke sharing",
      403
    );
  }

  await prisma.documentAccess.deleteMany({
    where: {
      documentId,
      userId: targetUserId,
    },
  });
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

function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function filenameToTitle(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, "").trim();
  return base.length > 0 ? base : "Imported Document";
}

function plainTextToDocumentContent(text: string): DocumentContent {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return DEFAULT_DOCUMENT_CONTENT;
  }

  const lines = normalized.split("\n");
  const content = lines.map((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      return { type: "paragraph", content: [] };
    }

    return {
      type: "paragraph",
      content: [{ type: "text", text: trimmedLine }],
    };
  });

  return {
    type: "doc",
    content,
  };
}

function mergeDocumentContent(
  existing: DocumentContent,
  imported: DocumentContent,
  filename: string
): DocumentContent {
  const existingContent = Array.isArray(existing.content) ? existing.content : [];
  const importedContent = Array.isArray(imported.content) ? imported.content : [];

  const divider = {
    type: "paragraph",
    content: [{ type: "text", text: `Imported from ${filename}` }],
  };

  return {
    type: "doc",
    content: [...existingContent, { type: "paragraph", content: [] }, divider, ...importedContent],
  };
}

function deriveNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] || "User";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  if (!cleaned) {
    return "User";
  }
  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
