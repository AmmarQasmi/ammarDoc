"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DocumentEditor from "@/frontend/documents/components/DocumentEditor";
import { getDocumentById } from "@/frontend/documents/api";
import type { DocumentItem } from "@/frontend/documents/types";

export default function DocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await getDocumentById(params.id);
        setDoc(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load document");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      void load();
    }
  }, [params.id]);

  if (loading) {
    return <main className="page-wrap"><p className="muted">Loading document...</p></main>;
  }

  if (error || !doc) {
    return (
      <main className="page-wrap">
        <section className="card">
          <h1 className="section-title">Could not open document</h1>
          <p className="error-text">{error || "Document not found"}</p>
          <button className="btn btn-primary" onClick={() => router.push("/")}>Back to dashboard</button>
        </section>
      </main>
    );
  }

  return <DocumentEditor initialDocument={doc} />;
}
