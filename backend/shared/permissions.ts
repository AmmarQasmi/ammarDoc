// Permission and authorization utilities

import { prisma } from "@/lib/prisma";

export enum Permission {
  OWNER = "owner",
  EDITOR = "editor",
  VIEWER = "viewer",
  NONE = "none",
}

export async function getDocumentPermission(
  documentId: string,
  userId: string
): Promise<Permission> {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { ownerUserId: true },
    });

    if (!document) {
      return Permission.NONE;
    }

    if (document.ownerUserId === userId) {
      return Permission.OWNER;
    }

    const access = await prisma.documentAccess.findUnique({
      where: {
        documentId_userId: {
          documentId,
          userId,
        },
      },
      select: { accessRole: true },
    });

    if (!access) {
      return Permission.NONE;
    }

    return access.accessRole === "EDITOR" ? Permission.EDITOR : Permission.VIEWER;
  } catch (error) {
    console.error("Permission check error:", error);
    return Permission.NONE;
  }
}

export async function canViewDocument(documentId: string, userId: string): Promise<boolean> {
  const permission = await getDocumentPermission(documentId, userId);
  return permission !== Permission.NONE;
}

export async function canEditDocument(documentId: string, userId: string): Promise<boolean> {
  const permission = await getDocumentPermission(documentId, userId);
  return permission === Permission.OWNER || permission === Permission.EDITOR;
}

export async function canDeleteDocument(documentId: string, userId: string): Promise<boolean> {
  const permission = await getDocumentPermission(documentId, userId);
  return permission === Permission.OWNER;
}

export async function canShareDocument(documentId: string, userId: string): Promise<boolean> {
  const permission = await getDocumentPermission(documentId, userId);
  return permission === Permission.OWNER;
}
