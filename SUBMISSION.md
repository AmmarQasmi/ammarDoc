# Submission Checklist

## Included in this package

- Source code (this repository)
- README with local setup and run instructions: README.md
- Architecture note: ARCHITECTURE.md
- AI workflow note: AI_WORKFLOW.md
- Submission manifest: SUBMISSION.md
- Live product URL: LIVE_URL.txt
- Walkthrough video URL: WALKTHROUGH_VIDEO_URL.txt
- Testing credentials and QA notes: TEST_CREDENTIALS.md

## Live Deployment

- https://ammar-doc.vercel.app

## Review Credentials

- Email: ammarsqasmi@gmail.com
- Password: aq123456-

## Feature Status

### Working

- Document create, rename, edit, save, reopen
- Rich text formatting (bold, italic, underline, headings, lists)
- File import (`.txt`, `.md`) to new or existing documents
- Sharing with role-based access (owner/editor/viewer)
- Owned vs shared document lists
- Persistence via Supabase + Prisma
- JWT cookie authentication (signup/login/logout)
- Owner-only document delete on dashboard
- Pagination in "Your Documents" (5 per page)
- Global loading screen

### Known Constraints

- Invite emails depend on EmailJS provider configuration (service/template/oauth)
- Local `npm run dev` may be unstable in OneDrive-synced folder due `.next` lock/caching behavior

## If a feature appears partial

- Sharing data persistence works even when provider-side email delivery fails
- Email delivery errors are surfaced through API/UI to aid debugging

## Next 2-4 Hours (if extended)

- Real-time collaboration indicators
- Document version history
- Export to Markdown/PDF
- Additional integration tests for share + auth flows
