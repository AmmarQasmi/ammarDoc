# AI Workflow Note

## AI Tools Used

- GitHub Copilot Chat (GPT-5.3-Codex) for implementation support, debugging, and fast iteration.

## Where AI Materially Sped Up Work

- Rapid scaffolding of Next.js + Prisma project structure
- API route and service-layer implementation for document CRUD, sharing, and auth flows
- Fast TypeScript error resolution and build-fix loops
- Drafting and refining EmailJS integration and diagnostics
- UI polishing tasks (loader, modal, pagination)

## What AI Output Was Changed or Rejected

- Reworked initial Prisma/data assumptions to support actual persistence and sharing relationships (`users`, `documents`, `document_access`, `file_imports`) with production-safe validation and access checks.
- Replaced mock/demo auth suggestions with a real JWT cookie login/signup/logout flow, password hashing, and protected API behavior.
- Updated signup logic to support invited placeholder users completing account setup without breaking sharing flows.
- Tightened permission model from generic access checks to explicit owner/editor/viewer behavior, including read-only enforcement in UI and backend route guards.
- Refined file import flow from basic upload handling to product behavior: dashboard upload creates new document, editor upload appends into current document.
- Extended editor functionality beyond base rich text by adding image embed support with resize/alignment controls and saving image layout attributes in document content.
- Replaced browser-native delete confirmation with a custom modal UI and added owner-only delete actions on the dashboard.
- Added whole-site loading UX and pagination for document lists to improve usability under realistic data growth.
- Reworked invite/email flow to return explicit provider errors, corrected template variable mapping, and added direct document-link params for invite messages.

## Verification Approach

- Repeated production builds (`npm run build`) after each major feature or fix
- Manual end-to-end testing of:
  - create/rename/edit/save/reopen
  - share owner/editor/viewer behavior
  - file import (`.txt`, `.md`)
  - auth signup/login/logout
  - owner-only delete behavior
- Confirmed API responses include actionable error messages for failed invite delivery
- Verified role-based access checks on both frontend UI and backend API routes

## Reliability and UX Quality Checks

- Added error-safe API envelopes and user-visible error feedback
- Added global route loading screen and list pagination for usability
- Enforced read-only behavior for viewers in editor actions and save/import flows
- Preserved compile safety with strict TypeScript and successful production builds
