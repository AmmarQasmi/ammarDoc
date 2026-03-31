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

## Seeded Users for Testing

**User 1 (Owner):**
- Email: owner@ajaia.local
- Name: Owner User

**User 2 (Editor):**
- Email: editor@ajaia.local
- Name: Editor User

Currently, user selection is mocked. A simple user switcher will be added to the UI.

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
- **File Uploads**: Start with txt/md import only; skip docx parsing for scope.
- **Real-time Collab**: Deferred (out of scope for 2.5-hour timebox).

## Submission

See `SUBMISSION.md` for final deliverables and scoring checklist.

