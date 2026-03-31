import type {
  ApiEnvelope,
  DocumentItem,
  DocumentsPayload,
  ShareItem,
  TiptapDoc,
  UserItem,
} from "./types";

async function parseJson<T>(response: Response): Promise<ApiEnvelope<T>> {
  const data = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !data.success) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(data.error?.message || "Request failed");
  }
  return data;
}

export async function getDocuments(): Promise<DocumentsPayload> {
  const res = await fetch("/api/documents", { cache: "no-store" });
  const envelope = await parseJson<DocumentsPayload>(res);
  return envelope.data as DocumentsPayload;
}

export async function createDocument(title: string): Promise<DocumentItem> {
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const envelope = await parseJson<DocumentItem>(res);
  return envelope.data as DocumentItem;
}

export async function getDocumentById(id: string): Promise<DocumentItem> {
  const res = await fetch(`/api/documents/${id}`, { cache: "no-store" });
  const envelope = await parseJson<DocumentItem>(res);
  return envelope.data as DocumentItem;
}

export async function renameDocument(id: string, title: string): Promise<DocumentItem> {
  const res = await fetch(`/api/documents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const envelope = await parseJson<DocumentItem>(res);
  return envelope.data as DocumentItem;
}

export async function saveDocumentContent(id: string, contentJson: TiptapDoc): Promise<DocumentItem> {
  const res = await fetch(`/api/documents/${id}/content`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentJson }),
  });
  const envelope = await parseJson<DocumentItem>(res);
  return envelope.data as DocumentItem;
}

export async function deleteDocumentById(id: string): Promise<void> {
  const res = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
  });
  await parseJson<{ id: string }>(res);
}

export async function importTextOrMarkdownFile(file: File, documentId?: string): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append("file", file);
  if (documentId) {
    formData.append("documentId", documentId);
  }

  const res = await fetch("/api/import", {
    method: "POST",
    body: formData,
  });

  const envelope = await parseJson<DocumentItem>(res);
  return envelope.data as DocumentItem;
}

export async function getUsers(): Promise<UserItem[]> {
  const res = await fetch("/api/users", { cache: "no-store" });
  const envelope = await parseJson<UserItem[]>(res);
  return envelope.data || [];
}

export async function getDocumentShares(documentId: string): Promise<ShareItem[]> {
  const res = await fetch(
    `/api/documents/${documentId}/share`,
    { cache: "no-store" }
  );
  const envelope = await parseJson<ShareItem[]>(res);
  return envelope.data || [];
}

export async function shareDocument(documentId: string, email: string, accessRole: "VIEWER" | "EDITOR") {
  const res = await fetch(`/api/documents/${documentId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, accessRole }),
  });
  const envelope = await parseJson<{
    shared: boolean;
    invitedUserCreated: boolean;
    emailSent: boolean;
    emailError?: string;
    emailedTo?: string;
  }>(res);
  return envelope.data || {
    shared: false,
    invitedUserCreated: false,
    emailSent: false,
    emailError: "Unknown email invite failure",
    emailedTo: undefined,
  };
}

export async function unshareDocument(documentId: string, userId: string) {
  const res = await fetch(`/api/documents/${documentId}/share?userId=${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
  await parseJson<{ removed: boolean }>(res);
}
