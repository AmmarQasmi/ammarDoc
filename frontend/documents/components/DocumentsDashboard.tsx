"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createDocument, getDocuments } from "@/frontend/documents/api";
import type { DocumentItem } from "@/frontend/documents/types";
import AppHeader from "@/frontend/shared/components/AppHeader";

type TabKey = "owned" | "shared";

export default function DocumentsDashboard() {
  const router = useRouter();
  const [owned, setOwned] = useState<DocumentItem[]>([]);
  const [shared, setShared] = useState<DocumentItem[]>([]);
  const [title, setTitle] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("owned");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await getDocuments();
        setOwned(data.owned);
        setShared(data.shared);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const currentList = useMemo(() => (activeTab === "owned" ? owned : shared), [activeTab, owned, shared]);

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
      setError(err instanceof Error ? err.message : "Could not create document");
    } finally {
      setCreating(false);
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
          {currentList.map((doc) => (
            <li key={doc.id} className="doc-item">
              <button className="doc-link" onClick={() => router.push(`/documents/${doc.id}`)}>
                <span className="doc-title">{doc.title}</span>
                <span className="doc-meta">Updated {new Date(doc.updatedAt).toLocaleString()}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
