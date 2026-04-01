# AQ Doc — Candidate Assessment Submission

## App Overview

**AQ Doc** is a lightweight collaborative document editor built for the Ajaia AI-Native Full Stack Developer assignment.

### Core Features
- **Document creation & editing** with rich text (bold, italic, underline, headings, lists)
- **File import** (.txt, .md files → new documents or append to existing)
- **Document sharing** with owner/editor/viewer roles
- **Persistence** via Supabase + Prisma
- **Authentication** with signup/login and JWT cookies
- **Image embed** in notes with resize/alignment controls
- **Email invites** for shared documents
- **Document deletion** (owner-only)
- **Pagination** in document list (5 per page)

---

## Test Credentials

### Primary Test Account
- **Email**: `ammarsqasmi@gmail.com`
- **Password**: `aq123456-`
- **Role**: Owner (can create, share, delete documents)

### Secondary Test Account (for sharing)
- **Email**: `qasmiammar60@gmail.com`
- **Password**: `aq123456-`
- **Role**: Viewer/Editor (receives shared documents)

---

## Setup & Testing Flow

### Local Setup
```bash
git clone <your-repo>
cd ajaia.ai
npm install
npm run prisma:push
npm run prisma:seed
npm run dev
```

### Live Testing (Vercel)
1. Go to https://ammar-doc.vercel.app
2. Sign up or use test credentials above
3. **Create a document** → type content → Save
4. **Share the document** → enter `qasmiammar60@gmail.com` → select role (Viewer/Editor)
5. **Check email** for invite (if EmailJS configured)
6. **Switch to secondary account** → view shared document
7. **Verify viewer read-only** → shared user cannot edit if role = Viewer
8. **Return to primary** → Delete document (only owner can)

---

## Key Architectural Decisions

### Scope
- **Rich text**: Tiptap instead of contentEditable for reliability
- **No real-time collab**: Single-user edits preserve simplicity
- **Simplified sharing**: 3-tier roles (owner/editor/viewer) vs. granular ACLs
- **File upload**: Inline text import only (no cloud storage overhead)

### Tech Stack
- **Frontend**: Next.js 16 App Router + React + TypeScript
- **Backend**: Next.js API routes + Prisma ORM
- **Database**: Supabase PostgreSQL
- **Auth**: JWT cookies (httpOnly, sameSite=lax)
- **Email**: EmailJS (for share invites)
- **Deployment**: Vercel

### UX Choices
- Global loader on page transitions
- Custom delete confirmation modal (not native confirm)
- Pagination in document list for UX clarity
- Permission metadata on document responses (UI knows what user can do)
- Read-only enforcement client-side + server-side permission checks

---

## Environment Variables (Deployed)

```
DATABASE_URL=postgresql://[pooler-url]
DIRECT_URL=postgresql://[direct-url]
JWT_SECRET=[long-random-string]
EMAILJS_PUBLIC_KEY=[your-key]
EMAILJS_PRIVATE_KEY=[your-key]
EMAILJS_TEMPLATE_ID=[your-template]
EMAILJS_SERVICE_ID=[your-service]
NEXT_PUBLIC_APP_URL=https://ammar-doc.vercel.app
```

---

## Testing Notes

### Sharing Feature
1. Share creates access record in DB (always succeeds)
2. Email invite is async and depends on EmailJS config
3. If invite email fails → app still shows the share succeeded + error reason
4. Recipient must sign up with same email to claim shared access

### Viewer Read-Only
1. Viewer sees UI with disabled Save/Delete/Upload buttons
2. Backend rejects PUT/DELETE attempts with 403 Forbidden
3. Viewer CAN read document content and see shares

### File Import
- Dashboard upload → creates new document
- Open document + upload → appends to current document
- Supports .txt and .md only

### Persistence
- All changes auto-save on document edit
- Shared access persists across sessions
- User list is pre-seeded + dynamically grows on signup

---

## What's Included

✅ Working document CRUD  
✅ Rich text editing + image embed  
✅ File import (txt/md)  
✅ Sharing with role-based access  
✅ Email invites (via EmailJS)  
✅ Persistence via Supabase  
✅ Auth with signup/login  
✅ Global loader + custom delete modal  
✅ Pagination (5 docs per page)  
✅ Production build + Vercel deployment  
✅ README.md with setup instructions  
✅ Basic validation + error handling  
✅ TypeScript strict mode  

---

## Time & Prioritization

**4-hour timebox used for:**
- 40% Core doc CRUD + rich text
- 25% File import + sharing logic
- 20% Auth + persistence
- 10% UX polish (loader, modal, pagination) + deployment

**Intentionally deferred (< 2 hrs remaining):**
- Real-time collaboration
- Document history/versions
- Export (PDF/Markdown)
- Comments/suggestions
- Advanced ACLs

This reflects the assignment constraint: "Strong candidates make deliberate scope cuts and explain them clearly."

---

## Support

For questions, refer to:
- [README.md](README.md) — Build & deployment
- [Architecture notes](ARCHITECTURE.md) — Design decisions
- GitHub issues — Bug reports
