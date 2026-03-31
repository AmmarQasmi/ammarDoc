"use client";

import { useMemo, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { DocumentItem, TiptapDoc } from "@/frontend/documents/types";
import { renameDocument, saveDocumentContent } from "@/frontend/documents/api";
import AppHeader from "@/frontend/shared/components/AppHeader";

type Props = {
  initialDocument: DocumentItem;
};

type TiptapNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string }>;
  content?: TiptapNode[];
};

function sanitizeTiptapNode(node: TiptapNode): TiptapNode | null {
  if (node.type === "text") {
    if (!node.text || node.text.length === 0) {
      return null;
    }
    return node;
  }

  const nextContent = Array.isArray(node.content)
    ? node.content.map(sanitizeTiptapNode).filter((child): child is TiptapNode => child !== null)
    : undefined;

  return {
    ...node,
    ...(nextContent ? { content: nextContent } : {}),
  };
}

function sanitizeDocContent(input: TiptapDoc): TiptapDoc {
  const root: TiptapNode = {
    type: input.type,
    content: input.content,
  };

  const sanitized = sanitizeTiptapNode(root);
  if (!sanitized || sanitized.type !== "doc") {
    return {
      type: "doc",
      content: [{ type: "paragraph", content: [] }],
    };
  }

  const safeContent = Array.isArray(sanitized.content) ? sanitized.content : [{ type: "paragraph", content: [] }];

  return {
    type: "doc",
    content: safeContent as TiptapDoc["content"],
  };
}

function ToolbarButton({
  onClick,
  active,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button type="button" className={`btn ${active ? "btn-primary" : "btn-ghost"}`} onClick={onClick}>
      {label}
    </button>
  );
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  const canUnderline = typeof (editor.commands as { toggleUnderline?: () => boolean }).toggleUnderline === "function";

  return (
    <div className="row gap-xs wrap toolbar">
      <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
      {canUnderline ? (
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => (editor.chain() as unknown as { focus: () => { toggleUnderline: () => { run: () => boolean } } }).focus().toggleUnderline().run()}
        />
      ) : null}
      <ToolbarButton label="H1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
      <ToolbarButton label="H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton label="Bullets" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton label="Numbers" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
    </div>
  );
}

export default function DocumentEditor({ initialDocument }: Props) {
  const [doc, setDoc] = useState<DocumentItem>(initialDocument);
  const [title, setTitle] = useState(initialDocument.title);
  const [savingTitle, setSavingTitle] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const initialContent = useMemo(
    () => sanitizeDocContent(doc.contentJson as TiptapDoc),
    [doc.contentJson]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
    ],
    content: initialContent,
  });

  async function onRename() {
    try {
      const nextTitle = title.trim();
      if (!nextTitle) {
        setError("Title cannot be empty");
        return;
      }
      setSavingTitle(true);
      setError("");
      setMessage("");
      const updated = await renameDocument(doc.id, nextTitle);
      setDoc(updated);
      setTitle(updated.title);
      setMessage("Title updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed");
    } finally {
      setSavingTitle(false);
    }
  }

  async function onSaveContent() {
    if (!editor) return;
    try {
      setSavingContent(true);
      setError("");
      setMessage("");
      const nextContent = sanitizeDocContent(editor.getJSON() as TiptapDoc);
      const updated = await saveDocumentContent(doc.id, nextContent);
      setDoc(updated);
      setMessage("Document saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingContent(false);
    }
  }

  return (
    <main className="page-wrap">
      <AppHeader title={title.trim() || "Untitled Document"} />

      <section className="card">
        <div className="row between align-start gap-sm mobile-stack">
          <div className="grow">
            <label className="label" htmlFor="doc-title">Document Title</label>
            <input id="doc-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
          </div>
          <button className="btn btn-primary" onClick={onRename} disabled={savingTitle}>
            {savingTitle ? "Updating..." : "Rename"}
          </button>
        </div>
        <p className="muted">Document ID: {doc.id}</p>
      </section>

      <section className="card">
        <h2 className="section-title">Rich Text Editor</h2>
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
        <div className="row between top-gap">
          <p className="muted">Supports bold, italic, underline, headings, and lists.</p>
          <button className="btn btn-primary" onClick={onSaveContent} disabled={savingContent || !editor}>
            {savingContent ? "Saving..." : "Save"}
          </button>
        </div>
        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </main>
  );
}
