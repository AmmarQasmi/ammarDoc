"use client";

import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import type { DocumentItem, ShareItem, TiptapDoc, UserItem } from "@/frontend/documents/types";
import {
  getDocumentShares,
  getUsers,
  importTextOrMarkdownFile,
  renameDocument,
  saveDocumentContent,
  shareDocument,
  unshareDocument,
} from "@/frontend/documents/api";
import AppHeader from "@/frontend/shared/components/AppHeader";

type Props = {
  initialDocument: DocumentItem;
};

type ImageAlign = "left" | "center" | "right";

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      displayWidth: {
        default: "100%",
      },
      align: {
        default: "center",
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const width = String(HTMLAttributes.displayWidth || "100%");
    const align = String(HTMLAttributes.align || "center") as ImageAlign;

    const style = [
      `width:${width}`,
      "max-width:100%",
      "height:auto",
      "display:block",
      align === "left" ? "margin:10px auto 10px 0" : "",
      align === "center" ? "margin:10px auto" : "",
      align === "right" ? "margin:10px 0 10px auto" : "",
    ]
      .filter(Boolean)
      .join(";");

    return ["img", mergeAttributes(HTMLAttributes, { style })];
  },
});

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
  const [importing, setImporting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
  const [imageWidth, setImageWidth] = useState(70);
  const [imageAlign, setImageAlign] = useState<ImageAlign>("center");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isViewer = doc.permission === "VIEWER";
  const canEdit = doc.canEdit !== undefined ? doc.canEdit : !isViewer;
  const canShare = doc.canShare !== undefined ? doc.canShare : doc.permission === "OWNER";

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
      ResizableImage.configure({
        allowBase64: true,
        inline: false,
      }),
    ],
    content: initialContent,
    editable: canEdit,
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
  }, [editor, canEdit]);

  useEffect(() => {
    async function loadSharingState() {
      try {
        const [availableUsers, currentShares] = await Promise.all([
          getUsers(),
          getDocumentShares(doc.id),
        ]);
        setUsers(availableUsers);
        setShares(currentShares);
      } catch {
        setUsers([]);
        setShares([]);
      }
    }

    void loadSharingState();
  }, [doc.id]);

  async function onRename() {
    if (!canEdit) {
      setError("You have read-only access. Only editors or owner can edit.");
      return;
    }
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
    if (!canEdit) {
      setError("You have read-only access. Save is disabled.");
      return;
    }
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

  async function onImportIntoCurrentDocument(file: File | null) {
    if (!canEdit) {
      setError("You have read-only access. Import is disabled.");
      return;
    }
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
      setMessage("");
      const updated = await importTextOrMarkdownFile(file, doc.id);
      setDoc(updated);
      if (editor) {
        editor.commands.setContent(updated.contentJson as TiptapDoc);
      }
      setMessage("File imported into current document");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function onShareDocument() {
    if (!canShare) {
      setError("Only document owner can change sharing access");
      return;
    }
    if (!shareEmail) {
      setError("Enter email of the user to share with");
      return;
    }

    try {
      setSharing(true);
      setError("");
      setMessage("");
      const result = await shareDocument(doc.id, shareEmail, shareRole);
      const currentShares = await getDocumentShares(doc.id);
      setShares(currentShares);
      const inviteState = result.emailSent
        ? `Email sent to ${result.emailedTo || shareEmail}`
        : `Email not sent (${result.emailError || "configure EmailJS envs"})`;
      setMessage(result.invitedUserCreated ? `User invited and shared. ${inviteState}` : `Sharing updated. ${inviteState}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sharing failed");
    } finally {
      setSharing(false);
    }
  }

  async function onImageUpload(file: File | null) {
    if (!canEdit) {
      setError("You have read-only access. Image upload is disabled.");
      return;
    }
    if (!file || !editor) return;

    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported for note image upload");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("Image is too large. Max allowed size is 3MB.");
      return;
    }

    try {
      setUploadingImage(true);
      setError("");
      setMessage("");

      const dataUrl = await fileToDataUrl(file);
      editor
        .chain()
        .focus()
        .setImage({
          src: dataUrl,
          alt: file.name,
        })
        .updateAttributes("image", {
          displayWidth: `${imageWidth}%`,
          align: imageAlign,
        })
        .run();

      setMessage("Image added. You can resize/reposition then Save.");
    } catch {
      setError("Failed to add image");
    } finally {
      setUploadingImage(false);
    }
  }

  function applyImageLayoutToSelection() {
    if (!editor || !editor.isActive("image")) {
      setError("Select an image in the editor first");
      return;
    }

    setError("");
    editor.commands.updateAttributes("image", {
      displayWidth: `${imageWidth}%`,
      align: imageAlign,
    });
    setMessage("Image layout updated");
  }

  async function onRevokeShare(targetUserId: string) {
    if (!canShare) {
      setError("Only document owner can revoke access");
      return;
    }
    try {
      setSharing(true);
      setError("");
      setMessage("");
      await unshareDocument(doc.id, targetUserId);
      const currentShares = await getDocumentShares(doc.id);
      setShares(currentShares);
      setMessage("Access revoked");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoke failed");
    } finally {
      setSharing(false);
    }
  }

  return (
    <main className="page-wrap">
      <AppHeader title={title.trim() || "Untitled Document"} />

      <section className="card">
        <h2 className="section-title">Share Document</h2>
        <p className="muted">Sharing currently supports Gmail users only.</p>
        <div className="row gap-sm mobile-stack">
          <input
            className="input"
            value={shareEmail}
            list="share-user-suggestions"
            placeholder="Enter user email"
            onChange={(e) => setShareEmail(e.target.value)}
          />
          <datalist id="share-user-suggestions">
            {users.map((u) => (
              <option key={u.id} value={u.email}>
                {u.name} ({u.email})
              </option>
            ))}
          </datalist>
          <select
            className="input"
            value={shareRole}
            onChange={(e) => setShareRole(e.target.value as "VIEWER" | "EDITOR")}
          >
            <option value="VIEWER">Viewer</option>
            <option value="EDITOR">Editor</option>
          </select>
          <button className="btn btn-primary" onClick={onShareDocument} disabled={sharing || !canShare}>
            {sharing ? "Saving..." : "Share"}
          </button>
        </div>
        {!canShare ? <p className="error-text">Only owner can change access for this document.</p> : null}
        <ul className="doc-list top-gap">
          {shares.map((share) => (
            <li key={share.userId} className="doc-item">
              <div className="share-row">
                <div>
                  <span className="doc-title">{share.name}</span>
                  <span className="doc-meta">{share.email} - {share.accessRole}</span>
                </div>
                <button className="btn btn-ghost" onClick={() => onRevokeShare(share.userId)} disabled={sharing || !canShare}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <div className="row between align-start gap-sm mobile-stack">
          <div className="grow">
            <label className="label" htmlFor="doc-title">Document Title</label>
            <input id="doc-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
          </div>
          <button className="btn btn-primary" onClick={onRename} disabled={savingTitle || !canEdit}>
            {savingTitle ? "Updating..." : "Rename"}
          </button>
        </div>
        {isViewer ? <p className="error-text">You have read-only access. Owner can upgrade your access role.</p> : null}
        <p className="muted">Document ID: {doc.id}</p>
      </section>

      <section className="card">
        <h2 className="section-title">Rich Text Editor</h2>
        <div className="upload-inline">
          <label className="label" htmlFor="import-current-doc">Import .txt/.md into this document</label>
          <input
            id="import-current-doc"
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            className="input"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              void onImportIntoCurrentDocument(file);
              e.currentTarget.value = "";
            }}
            disabled={importing || !canEdit}
          />
          <p className="muted">Imported content is appended below existing content.</p>
        </div>
        <div className="upload-inline">
          <label className="label" htmlFor="image-upload">Upload image into note</label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="input"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              void onImageUpload(file);
              e.currentTarget.value = "";
            }}
            disabled={uploadingImage || !canEdit}
          />
          <p className="muted">Supported: image files. Max size 3MB. Image embeds into document content.</p>
        </div>
        <div className="image-layout-controls">
          <label className="label" htmlFor="image-width">Image width: {imageWidth}%</label>
          <input
            id="image-width"
            className="range-input"
            type="range"
            min={20}
            max={100}
            step={5}
            value={imageWidth}
            onChange={(e) => setImageWidth(Number(e.target.value))}
          />
          <div className="row gap-xs wrap top-gap">
            <button
              type="button"
              className={`btn ${imageAlign === "left" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setImageAlign("left")}
            >
              Left
            </button>
            <button
              type="button"
              className={`btn ${imageAlign === "center" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setImageAlign("center")}
            >
              Center
            </button>
            <button
              type="button"
              className={`btn ${imageAlign === "right" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setImageAlign("right")}
            >
              Right
            </button>
            <button type="button" className="btn btn-primary" onClick={applyImageLayoutToSelection} disabled={!canEdit}>
              Apply to selected image
            </button>
          </div>
        </div>
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
        <div className="row between top-gap">
          <p className="muted">Supports bold, italic, underline, headings, and lists.</p>
          <button className="btn btn-primary" onClick={onSaveContent} disabled={savingContent || !editor || !canEdit}>
            {savingContent ? "Saving..." : "Save"}
          </button>
        </div>
        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </main>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
