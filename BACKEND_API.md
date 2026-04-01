# Backend API Documentation

## Overview

Complete REST API for document management with full CRUD operations, permission-based access control, and comprehensive error handling.

**Base URL:** `/api`

---

## Endpoints

### Documents

#### Create Document
```
POST /api/documents
```

**Request Body:**
```json
{
  "title": "My Document",
  "contentJson": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Hello world" }]
      }
    ]
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "doc-123",
    "title": "My Document",
    "ownerUserId": "user-1",
    "contentJson": { ... },
    "createdAt": "2026-03-31T12:00:00.000Z",
    "updatedAt": "2026-03-31T12:00:00.000Z"
  },
  "timestamp": "2026-03-31T12:00:00.000Z"
}
```

**Errors:**
- `400 VALIDATION_ERROR` - Invalid title or content format
- `403 FORBIDDEN` - Cannot create document for another user

---

#### List Documents
```
GET /api/documents
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "owned": [
      {
        "id": "doc-1",
        "title": "My Document",
        "ownerUserId": "user-1",
        "contentJson": { ... },
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "shared": [
      {
        "id": "doc-2",
        "title": "Shared Document",
        "ownerUserId": "user-2",
        "contentJson": { ... },
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  },
  "timestamp": "..."
}
```

---

#### Get Document
```
GET /api/documents/:id
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "doc-123",
    "title": "My Document",
    "ownerUserId": "user-1",
    "contentJson": { ... },
    "createdAt": "...",
    "updatedAt": "..."
  },
  "timestamp": "..."
}
```

**Errors:**
- `404 NOT_FOUND` - Document does not exist
- `403 FORBIDDEN` - No access to document

---

#### Rename Document
```
PUT /api/documents/:id
```

**Request Body:**
```json
{
  "title": "Updated Title"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "doc-123",
    "title": "Updated Title",
    "ownerUserId": "user-1",
    "contentJson": { ... },
    "createdAt": "...",
    "updatedAt": "..."
  },
  "timestamp": "..."
}
```

**Errors:**
- `400 VALIDATION_ERROR` - Invalid title
- `403 FORBIDDEN` - Not an editor/owner
- `404 NOT_FOUND` - Document not found

---

#### Update Document Content
```
PUT /api/documents/:id/content
```

**Request Body:**
```json
{
  "contentJson": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Updated content" }]
      }
    ]
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "doc-123",
    "title": "My Document",
    "ownerUserId": "user-1",
    "contentJson": { ... },
    "createdAt": "...",
    "updatedAt": "..."
  },
  "timestamp": "..."
}
```

**Errors:**
- `400 VALIDATION_ERROR` - Invalid content format
- `403 FORBIDDEN` - Not an editor/owner
- `404 NOT_FOUND` - Document not found

---

#### Delete Document
```
DELETE /api/documents/:id
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": { "id": "doc-123" },
  "timestamp": "..."
}
```

**Errors:**
- `403 FORBIDDEN` - Only owner can delete
- `404 NOT_FOUND` - Document not found

---

## Permission Model

### Owner
- ✅ View
- ✅ Edit (rename, update content)
- ✅ Delete
- ✅ Share

### Editor (Shared)
- ✅ View
- ✅ Edit (rename, update content)
- ❌ Delete
- ❌ Share

### Viewer (Shared)
- ✅ View
- ❌ Edit
- ❌ Delete
- ❌ Share

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to edit this document",
    "details": {
      "documentId": "doc-123",
      "requiredPermission": "EDITOR"
    }
  },
  "timestamp": "2026-03-31T12:00:00.000Z"
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Permission denied |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Conflict (e.g., duplicate title) |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Content Format (Tiptap JSON)

Documents store rich text as JSON following Tiptap's document model:

```typescript
interface DocumentContent {
  type: "doc";
  content: Array<{
    type: string;  // "paragraph", "heading", "bulletList", etc.
    attrs?: Record<string, any>;
    content?: Array<{
      type: string;  // "text"
      text?: string;
      marks?: Array<{ type: string }>;  // "bold", "italic", "underline"
    }>;
  }>;
}
```

### Example with Formatting

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Title" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "This is " },
        { "type": "text", "marks": [{ "type": "bold" }], "text": "bold" },
        { "type": "text", "text": " text" }
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            { "type": "paragraph", "content": [{ "type": "text", "text": "Item 1" }] }
          ]
        }
      ]
    }
  ]
}
```

---

## Authentication

Currently using mock authentication. In production, integrate with:
- NextAuth.js
- Clerk
- Auth0
- Supabase Auth

The current mock provides:
- `getCurrentUserId()` - Returns current user ID
- `getCurrentUser(userId)` - Returns user object
- Seeded users: `owner@ajaia.local`, `editor@ajaia.local`

---

## Testing

Run tests with:

```bash
# Run all tests
npm test

# Run with UI
npm test:ui

# Run with coverage
npm test:coverage
```

Test file: `backend/documents/service.test.ts`

Covers:
- ✅ Create operations
- ✅ Read operations
- ✅ Update operations
- ✅ Delete operations
- ✅ Permission logic
- ✅ Validation rules
- ✅ Error handling

---

## Deployment

### Environment Variables Required

```bash
DATABASE_URL="postgresql://..."  # Session pooler URL
DIRECT_URL="postgresql://..."    # Direct DB URL (for migrations)
```

### Build

```bash
npm run build
```

### Start

```bash
npm start
```

Server will be available at `http://localhost:3000`

---

## Project Structure

```
backend/
├── documents/
│   ├── service.ts        # Business logic (CRUD, permissions)
│   ├── types.ts          # TypeScript interfaces
│   └── service.test.ts   # Unit tests
├── shared/
│   ├── api-types.ts      # Generic API response types
│   ├── permissions.ts    # Permission checking utilities
│   └── validation.ts     # Input validation rules
app/
└── api/
    └── documents/
        ├── route.ts                    # GET /api/documents, POST /api/documents
        ├── [id]/route.ts               # GET, PUT, DELETE /api/documents/[id]
        └── [id]/content/route.ts       # PUT /api/documents/[id]/content
```

---

## Next Steps (Frontend)

- Build document list page
- Integrate Tiptap editor
- Create sharing UI
- Add file upload handler
