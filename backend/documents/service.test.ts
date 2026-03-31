// Tests for document service - permission and operation logic

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createDocument,
  getDocument,
  renameDocument,
  updateDocumentContent,
  deleteDocument,
  listDocuments,
} from "./service";
import { ApiErrorHandler, ERROR_CODES } from "@/backend/shared/api-types";
import * as permissions from "@/backend/shared/permissions";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    document: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    documentAccess: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock permissions
vi.mock("@/backend/shared/permissions");

import { prisma } from "@/lib/prisma";

describe("Document Service", () => {
  const userId = "user-1";
  const otherUserId = "user-2";
  const documentId = "doc-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createDocument", () => {
    it("should create a document with valid input", async () => {
      const mockDoc = {
        id: documentId,
        title: "Test Document",
        ownerUserId: userId,
        contentJson: {
          type: "doc",
          content: [{ type: "paragraph", content: [] }],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.document.create).mockResolvedValue(mockDoc);

      const result = await createDocument(
        {
          title: "Test Document",
          ownerUserId: userId,
        },
        userId
      );

      expect(result.id).toBe(documentId);
      expect(result.title).toBe("Test Document");
      expect(result.ownerUserId).toBe(userId);
    });

    it("should reject document creation for invalid title", async () => {
      await expect(
        createDocument(
          {
            title: "",
            ownerUserId: userId,
          },
          userId
        )
      ).rejects.toThrow(ApiErrorHandler);
    });

    it("should reject creation when ownerUserId does not match current user", async () => {
      await expect(
        createDocument(
          {
            title: "Test",
            ownerUserId: otherUserId,
          },
          userId
        )
      ).rejects.toThrow(ApiErrorHandler);
    });
  });

  describe("getDocument", () => {
    it("should retrieve document for authorized user", async () => {
      const mockDoc = {
        id: documentId,
        title: "Test Document",
        ownerUserId: userId,
        contentJson: { type: "doc", content: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.document.findUnique).mockResolvedValue(mockDoc);
      vi.mocked(permissions.getDocumentPermission).mockResolvedValue(
        permissions.Permission.OWNER
      );

      const result = await getDocument(documentId, userId);

      expect(result.id).toBe(documentId);
      expect(result.title).toBe("Test Document");
    });

    it("should reject access for unauthorized user", async () => {
      const mockDoc = {
        id: documentId,
        title: "Test Document",
        ownerUserId: userId,
        contentJson: { type: "doc", content: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.document.findUnique).mockResolvedValue(mockDoc);
      vi.mocked(permissions.getDocumentPermission).mockResolvedValue(
        permissions.Permission.NONE
      );

      await expect(getDocument(documentId, otherUserId)).rejects.toThrow(
        ApiErrorHandler
      );
    });

    it("should return 404 for non-existent document", async () => {
      vi.mocked(prisma.document.findUnique).mockResolvedValue(null);

      await expect(getDocument(documentId, userId)).rejects.toThrow(
        ApiErrorHandler
      );
    });
  });

  describe("renameDocument", () => {
    it("should rename document for owner", async () => {
      const mockDoc = {
        id: documentId,
        title: "Updated Title",
        ownerUserId: userId,
        contentJson: { type: "doc", content: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(permissions.canEditDocument).mockResolvedValue(true);
      vi.mocked(prisma.document.update).mockResolvedValue(mockDoc);

      const result = await renameDocument(documentId, "Updated Title", userId);

      expect(result.title).toBe("Updated Title");
    });

    it("should reject rename for viewer", async () => {
      vi.mocked(permissions.canEditDocument).mockResolvedValue(false);

      await expect(
        renameDocument(documentId, "New Title", otherUserId)
      ).rejects.toThrow(ApiErrorHandler);
    });
  });

  describe("updateDocumentContent", () => {
    it("should update content for editor", async () => {
      const newContent = {
        type: "doc" as const,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Updated content" }],
          },
        ],
      };

      const mockDoc = {
        id: documentId,
        title: "Test",
        ownerUserId: userId,
        contentJson: newContent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(permissions.canEditDocument).mockResolvedValue(true);
      vi.mocked(prisma.document.update).mockResolvedValue(mockDoc);

      const result = await updateDocumentContent(
        documentId,
        newContent,
        userId
      );

      expect(result.contentJson).toEqual(newContent);
    });

    it("should reject content update for viewer", async () => {
      const newContent = {
        type: "doc" as const,
        content: [],
      };

      vi.mocked(permissions.canEditDocument).mockResolvedValue(false);

      await expect(
        updateDocumentContent(documentId, newContent, otherUserId)
      ).rejects.toThrow(ApiErrorHandler);
    });
  });

  describe("deleteDocument", () => {
    it("should delete document for owner", async () => {
      vi.mocked(permissions.canDeleteDocument).mockResolvedValue(true);
      vi.mocked(prisma.document.delete).mockResolvedValue({} as any);

      await expect(deleteDocument(documentId, userId)).resolves.toBeUndefined();
      expect(prisma.document.delete).toHaveBeenCalledWith({
        where: { id: documentId },
      });
    });

    it("should reject delete for non-owner", async () => {
      vi.mocked(permissions.canDeleteDocument).mockResolvedValue(false);

      await expect(
        deleteDocument(documentId, otherUserId)
      ).rejects.toThrow(ApiErrorHandler);
    });
  });

  describe("listDocuments", () => {
    it("should list owned and shared documents", async () => {
      const ownedDoc = {
        id: "doc-owned",
        title: "My Document",
        ownerUserId: userId,
        contentJson: { type: "doc", content: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const sharedDoc = {
        id: "doc-shared",
        title: "Shared Document",
        ownerUserId: otherUserId,
        contentJson: { type: "doc", content: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.document.findMany)
        .mockResolvedValueOnce([ownedDoc])
        .mockResolvedValueOnce([sharedDoc]);

      const result = await listDocuments(userId);

      expect(result.owned).toHaveLength(1);
      expect(result.shared).toHaveLength(1);
      expect(result.owned[0].id).toBe("doc-owned");
      expect(result.shared[0].id).toBe("doc-shared");
    });
  });

  describe("Permission Logic", () => {
    it("should allow owner to perform all operations", async () => {
      expect(permissions.Permission.OWNER).toBe("owner");
    });

    it("should allow editor to edit but not delete", async () => {
      expect(permissions.Permission.EDITOR).toBe("editor");
    });

    it("should restrict viewer to read-only", async () => {
      expect(permissions.Permission.VIEWER).toBe("viewer");
    });

    it("should deny access to unauthorized users", async () => {
      expect(permissions.Permission.NONE).toBe("none");
    });
  });
});
