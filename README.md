# Ajaia Document Editor

A lightweight collaborative document editor built with Next.js, Prisma, and PostgreSQL for the Ajaia AI-Native Full Stack Developer assignment.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript
- **Backend**: Next.js API routes & Server Actions
- **Database**: Prisma ORM + Supabase PostgreSQL
- **Editor**: Tiptap (rich text)
- **Styling**: Tailwind CSS (via vanilla CSS)
- **Deployment**: Vercel ready

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account with PostgreSQL database

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ajaia.ai
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then update both variables with your Supabase credentials:

```
DATABASE_URL="postgresql://postgres.egdqjtijzvbizfegwihz:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.egdqjtijzvbizfegwihz.supabase.co:5432/postgres"
```

**Where to find these:**
- **DATABASE_URL**: Supabase > Project Settings > Database > Connection Pooling (Session mode)
- **DIRECT_URL**: Supabase > Project Settings > Database > Connection string (Direct)

### 3. Initialize Database

```bash
npm run prisma:push
npm run prisma:seed
```

This will:
1. Create the schema in your Supabase database
2. Seed two test users for demo purposes

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Authentication

The app now uses cookie-based JWT auth with signup/login.

Signup validation rules:

- Valid email format is required
- Password must be 8-64 characters and include uppercase, lowercase, number, and special character

Reviewer test credentials:

- Email: `ammarsqasmi@gmail.com`
- Password: `aq123456-`

Additional sharing test account:

- Email: `qasmiammar60@gmail.com`
- Password: `aq123456-`

### 6. Sharing + Email Invites

- Sharing currently supports Gmail recipients only (`@gmail.com`).
- Owner can share by entering recipient email and choosing Viewer/Editor.
- If recipient is not registered yet, the app creates an invited user placeholder and sends invite email (when EmailJS is configured).

Required environment variables for invite email:

- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_PRIVATE_KEY` (optional, recommended)
- `NEXT_PUBLIC_APP_URL` (for example, `https://ammar-doc.vercel.app`)

For Vercel deployment, add all auth and db envs too:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`

## Project Structure

```
.
├── app/                    # Next.js app directory (pages, layouts, API routes)
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   └── auth.ts            # Demo auth & seeded users
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.mjs           # Database seeding script
├── public/                # Static assets
├── .env.example           # Environment template
├── .env.local             # Local env (not committed)
├── next.config.js         # Next.js config
├── tsconfig.json          # TypeScript config
└── package.json
```

## Available Commands

```bash
npm run dev                # Start development server
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run linting
npm run prisma:generate    # Generate Prisma client
npm run prisma:push        # Push schema to database
npm run prisma:seed        # Seed demo data
```

## Testing Accounts

- Primary: `ammarsqasmi@gmail.com` / `aq123456-`
- Secondary: `qasmiammar60@gmail.com` / `aq123456-`

## Architecture Notes

### Database Schema (3NF)
- **users**: Authentication/identity records
- **documents**: Document metadata and content (stored as JSON)
- **document_access**: Sharing records with role-based access (VIEWER/EDITOR)
- **file_imports**: Metadata for uploaded files

### Access Control

A user can view/edit a document if:
1. They are the owner (`documents.owner_user_id`)
2. OR a row exists in `document_access` for their user

### Editor Content

Rich text content is stored as JSON (Tiptap format) in the `documents.content_json` column. This allows:
- Full formatting (bold, italic, underline, headings, lists)
- Easy serialization
- Future compatibility with collaborative editing

## Development Roadmap (Next Steps)

- [ ] Document list page (owned + shared)
- [ ] Document editor page with Tiptap
- [ ] Create, rename, delete flows
- [ ] Share dialog (grant access to user)
- [ ] File upload/import (txt, md)
- [ ] Permission tests
- [ ] Walkthrough video recording
- [ ] Deployment (Vercel + Supabase)

## Notes

- **Demo Auth**: For this assignment, user switching is mocked. In production, use NextAuth, Clerk, or similar.
- **File Uploads**: Supports `.txt` and `.md` only.
- **Image Uploads in Notes**: Supported in the editor (embedded into rich-text content as part of document JSON).
- **Import Behavior**:
	1. From dashboard: upload creates a new editable document automatically.
	2. From an open document: upload appends imported content to the current document.
- **Sharing**:
	1. Open a document and use the Share panel.
	2. Enter recipient email and choose Viewer/Editor role.
	3. Revoke access from the same panel.
- **Real-time Collab**: Deferred (out of scope for 2.5-hour timebox).

## Submission

See `SUBMISSION.md` for final deliverables and scoring checklist.

