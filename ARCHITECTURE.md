# Architecture Notes

## Key Design Decisions

### 1. Monolithic Next.js (No Separate NestJS Backend)

**Why:** Under a 2.5-hour timebox, a separate NestJS API would add overhead in project setup, CORS configuration, dual deployment, and type synchronization. Next.js app router + server actions provides:
- Single codebase to version, test, deploy
- TypeScript types shared between frontend and backend
- Faster iteration
- Simpler local development

**Trade-offs:**
- Loses service boundary separation (acceptable for assignment scope)
- API routes live in same repo as UI (manageable with folders)

### 2. PostgreSQL + Supabase (Not SQLite)

**Why:** Supabase provides:
- Free managed PostgreSQL with session pooling
- No infrastructure management
- Shareable connection strings for reviewers
- Session pooler URL for app runtime + direct URL for Prisma migrations

**Connection Strategy:**
- `DATABASE_URL` (pooler): used by running app queries (Prisma client at runtime)
- `DIRECT_URL` (direct): used by Prisma schema/migration operations

### 3. Prisma ORM (Not Raw SQL)

**Why:**
- Type-safe queries with full TypeScript support
- Built-in seeding and migrations
- Easy to introspect and refactor schema
- Fewer bugs from manual query building

**Schema:** 3NF normalized to avoid data duplication:
- `users` – identity only
- `documents` – record with owner FK
- `document_access` – sharing relationship (composite PK: document_id + user_id)
- `file_imports` – metadata for uploads

### 4. Tiptap for Rich Text Editor

**Why:**
- Lightweight, headless editor (no opinionated UI)
- JSON output (stores easily in Prisma)
- Extensible (can add more formats later)
- Good TS support

**Alternatives considered:** ProseMirror (too low-level), Draft.js (not maintained), Slate (good but slower setup)

### 5. Demo Auth with Seeded Users

**Why:** For a take-home assignment:
- Fast to implement (no OAuth/registration flow)
- Reviewers can easily test sharing without creating accounts
- Acceptable per prompt: "You may simulate users with seeded accounts or mocked auth"

**How:** Simple user switcher in header; `lib/auth.ts` provides hardcoded user list.

---

## Database Schema

### `users`
```sql
id (cuid) [PK]
email (unique)
name
createdAt
```

### `documents`
```sql
id (cuid) [PK]
ownerUserId (FK users.id)
title
contentJson (JSON, Tiptap format)
createdAt
updatedAt

Indexes:
- (ownerUserId, updatedAt) for owner's recent docs
- (updatedAt) for sorting
```

### `document_access`
```sql
documentId (FK documents.id) [PK1]
userId (FK users.id) [PK2]
accessRole (enum: VIEWER | EDITOR)
grantedByUserId (FK users.id)
grantedAt

Indexes:
- (userId, documentId) for "shared with me" queries
```

### `file_imports`
```sql
id (cuid) [PK]
documentId (nullable FK documents.id)
uploadedByUserId (FK users.id)
originalFilename
mimeType
sizeBytes
storageUrlOrPath
importedText (optional, for audit)
createdAt

Indexes:
- (documentId) for listing imports per doc
```

---

## API Routes / Server Actions

### Document Operations
- `GET /api/documents` – List owned + shared docs
- `POST /api/documents` – Create new document
- `PUT /api/documents/[id]` – Rename/update metadata
- `DELETE /api/documents/[id]` – Delete document
- `GET /api/documents/[id]` – Fetch document + content
- `PUT /api/documents/[id]/content` – Save editor content

### Sharing
- `POST /api/documents/[id]/share` – Grant access to user
- `DELETE /api/documents/[id]/share/[userId]` – Revoke access

### File Import
- `POST /api/upload` – Handle file upload + import

### Auth (Mock)
- Session/user context via middleware or function calls

---

## Access Control Logic

A user can **read** a document if:
- They own it (owner_user_id = current_user_id), OR
- A document_access row exists for (document_id, current_user_id) with any role

A user can **edit** a document if:
- They own it, OR
- A document_access row exists with accessRole = EDITOR

Read-only users see editor in view mode, cannot save changes.

---

## Content Storage Format

Rich-text content is stored as JSON following Tiptap's spec:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Hello " }, { "type": "text", "marks": [{ "type": "bold" }], "text": "world" }]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "Subheading" }]
    }
  ]
}
```

### Supported Marks:
- bold
- italic
- underline

### Supported Blocks:
- paragraph
- heading (h1, h2, h3)
- bullet_list / list_item
- ordered_list

This format:
- Is human-readable (for debugging)
- Survives migrations easily
- Can render back to HTML or plain text
- Allows future search indexing

---

## Deployment Plan

### Frontend + Backend: Vercel
- `npm run build` → `.next/` static + dynamic routes
- Auto-deploys on git push

### Database: Supabase
- No deployment needed (managed)
- Connection string in Vercel environment variables

### File Storage: TBD (Out of Scope for MVP)
- For now: skip persistent storage
- Metadata stored in `file_imports` table
- Content stored in database

---

## What Was Prioritized (Scope Cuts)

✓ **In Scope (MVP):**
- Document CRUD (create, read, rename, delete)
- Rich-text editing (bold, italic, underline, h1–h3, lists)
- Sharing (owner grants read/edit to other user)
- File import (txt, md → new document)
- Permission logic (owner/editor/viewer)
- Seeded users for demo
- One meaningful automated test (access control)
- Local + production-ready setup

✗ **Out of Scope (Deferred):**
- Real-time collaboration (WebSocket, Operational Transform)
- Docx/PDF file support
- Version history / undo stack
- Comments / suggestions mode
- Email notifications
- Full OAuth / password resets
- Production auth (rollout NextAuth later)
- Advanced role management (granular permissions)
- Document templates
- Markdown export
- Search / full-text indexing

---

## Testing Strategy

### Unit Tests
- Permission functions (`canView()`, `canEdit()`)
- Helper utilities

### Integration Tests
- Share flow (grant, revoke, verify access)
- Upload + import flow (text extraction, storage)

### Manual QA Checklist
- Owner can create, edit, delete
- Owner can share with editor (editor can save)
- Owner can share with viewer (viewer cannot save)
- Viewer sees read-only editor
- Shared doc appears in "Shared with me" list
- File import creates new document
- Content persists across refresh

---

## Time Budget (2.5 hours)

| Phase | Time | Focus |
|-------|------|-------|
| 0:00–0:20 | Setup | Prisma, Next.js scaffold (DONE) |
| 0:20–0:55 | Core list + create | Pages, API routes, Prisma hooks |
| 0:55–1:25 | Editor integration | Tiptap, save, load JSON |
| 1:25–1:45 | Sharing | Share dialog, access grants, lists |
| 1:45–1:55 | File import | Upload handler, txt/md parsing |
| 1:55–2:00 | Tests + docs | Permission test, README, ARCH |
| 2:00–2:30 | Buffer | Polish, fixes, final touches |

---

## Metrics for Success (Grading Rubric)

- ✅ All 5 core features working (doc CRUD, rich text, upload, sharing, persistence)
- ✅ Fast setup (reviewers can `npm install && npm run dev` in 1 min)
- ✅ Clear code (readable, typed, no magic strings)
- ✅ One passing automated test
- ✅ Thoughtful tradeoff documentation (this file)
- ✅ Honest submission note (what works vs. incomplete)
- ✅ Clean deployment URL
- ✅ Walkthrough video <5 mins (clear demo of core flows)
