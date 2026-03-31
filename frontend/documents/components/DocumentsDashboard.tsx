"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createDocument,
  deleteDocumentById,
  getDocuments,
  importTextOrMarkdownFile,
} from "@/frontend/documents/api";
import type { DocumentItem } from "@/frontend/documents/types";
import AppHeader from "@/frontend/shared/components/AppHeader";

type TabKey = "owned" | "shared";
const PAGE_SIZE = 5;

export default function DocumentsDashboard() {
  const router = useRouter();
  const [owned, setOwned] = useState<DocumentItem[]>([]);
  const [shared, setShared] = useState<DocumentItem[]>([]);
  const [title, setTitle] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("owned");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [pendingDeleteDocId, setPendingDeleteDocId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  async function loadDocuments() {
    try {
      setLoading(true);
      setError("");
      const data = await getDocuments();
      setOwned(data.owned);
      setShared(data.shared);
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        router.push("/auth");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const currentList = useMemo(() => (activeTab === "owned" ? owned : shared), [activeTab, owned, shared]);
  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  const pagedList = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return currentList.slice(start, start + PAGE_SIZE);
  }, [currentList, page, totalPages]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function handleCreate() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setError("Please enter a document title");
      return;
    }

    try {
      setCreating(true);
      setError("");
      const created = await createDocument(nextTitle);
      router.push(`/documents/${created.id}`);
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        router.push("/auth");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not create document");
    } finally {
      setCreating(false);
    }
  }

  async function handleUploadForNewDocument(file: File | null) {
    if (!file) return;

    const filename = file.name.toLowerCase();
    const isSupported = filename.endsWith(".txt") || filename.endsWith(".md");
    if (!isSupported) {
      setError("Only .txt and .md files are supported");
      return;
    }

    try {
      setImporting(true);
      setError("");
      const importedDoc = await importTextOrMarkdownFile(file);
      router.push(`/documents/${importedDoc.id}`);
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        router.push("/auth");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not import file");
    } finally {
      setImporting(false);
    }
  }

  async function handleDeleteOwnedDocument(docId: string) {
    setPendingDeleteDocId(docId);
  }

  async function confirmDeleteOwnedDocument() {
    if (!pendingDeleteDocId) return;

    try {
      setDeletingDocId(pendingDeleteDocId);
      setError("");
      await deleteDocumentById(pendingDeleteDocId);
      await loadDocuments();
      setPendingDeleteDocId(null);
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        router.push("/auth");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not delete document");
    } finally {
      setDeletingDocId(null);
    }
  }

  return (
    <main className="page-wrap">
      <AppHeader title="Documents" />

      <section className="hero-card">
        <h1 className="hero-title">Ajaia Collaborative Docs</h1>
        <p className="hero-subtitle">Create and edit rich documents with persistence.</p>
      </section>

      <section className="card">
        <h2 className="section-title">Create Document</h2>
        <div className="row gap-sm">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Project kickoff notes"
            maxLength={255}
          />
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
      </section>

      <section className="card">
        <h2 className="section-title">Import File</h2>
        <p className="muted">Supported: .txt and .md. Upload creates a new editable document automatically.</p>
        <div className="row gap-sm top-gap mobile-stack">
          <input
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            className="input"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              void handleUploadForNewDocument(file);
              e.currentTarget.value = "";
            }}
            disabled={importing}
          />
        </div>
        {importing ? <p className="muted top-gap">Importing file...</p> : null}
      </section>

      <section className="card">
        <div className="row between">
          <h2 className="section-title">Your Documents</h2>
          <div className="row gap-xs">
            <button
              className={`btn ${activeTab === "owned" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("owned")}
            >
              Owned ({owned.length})
            </button>
            <button
              className={`btn ${activeTab === "shared" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("shared")}
            >
              Shared ({shared.length})
            </button>
          </div>
        </div>

        {loading ? <p className="muted">Loading documents...</p> : null}

        {!loading && currentList.length === 0 ? (
          <p className="muted">No documents in this tab yet.</p>
        ) : null}

        <ul className="doc-list">
          {pagedList.map((doc) => (
            <li key={doc.id} className="doc-item">
              <div className="share-row">
                <button className="doc-link" onClick={() => router.push(`/documents/${doc.id}`)}>
                  <span className="doc-title">{doc.title}</span>
                  <span className="doc-meta">Updated {new Date(doc.updatedAt).toLocaleString()}</span>
                </button>
                {activeTab === "owned" ? (
                  <button
                    className="btn btn-ghost"
                    onClick={() => void handleDeleteOwnedDocument(doc.id)}
                    disabled={deletingDocId === doc.id}
                  >
                    {deletingDocId === doc.id ? "Deleting..." : "Delete"}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {!loading && currentList.length > 0 ? (
          <div className="row between top-gap">
            <p className="muted">
              Page {page} of {totalPages}
            </p>
            <div className="row gap-xs">
              <button
                className="btn btn-ghost"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
              >
                Previous
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {pendingDeleteDocId ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label="Delete document confirmation">
          <div className="confirm-card">
            <h3>Delete Document?</h3>
            <p>This action is permanent and cannot be undone.</p>
            <div className="row gap-xs">
              <button className="btn btn-ghost" onClick={() => setPendingDeleteDocId(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => void confirmDeleteOwnedDocument()}
                disabled={Boolean(deletingDocId)}
              >
                {deletingDocId ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
