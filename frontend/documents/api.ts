import type { ApiEnvelope, DocumentItem, DocumentsPayload, TiptapDoc } from "./types";

async function parseJson<T>(response: Response): Promise<ApiEnvelope<T>> {
  const data = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !data.success) {
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
