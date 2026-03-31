// Validation utilities

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export function validateDocumentTitle(title: string): ValidationError | null {
  if (!title || typeof title !== "string") {
    return { field: "title", message: "Title is required and must be a string" };
  }

  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { field: "title", message: "Title cannot be empty" };
  }

  if (trimmed.length > 255) {
    return { field: "title", message: "Title must not exceed 255 characters" };
  }

  return null;
}

export function validateDocumentContent(content: any): ValidationError | null {
  if (!content) {
    return null; // Content is optional on create
  }

  if (typeof content !== "object" || content.type !== "doc") {
    return {
      field: "contentJson",
      message: "Content must be a valid Tiptap document object",
    };
  }

  if (!Array.isArray(content.content)) {
    return {
      field: "contentJson",
      message: "Content must have a content array",
    };
  }

  return null;
}

export function validateDocumentId(id: string): ValidationError | null {
  if (!id || typeof id !== "string") {
    return { field: "id", message: "Document ID is required" };
  }

  if (id.trim().length === 0) {
    return { field: "id", message: "Document ID cannot be empty" };
  }

  return null;
}

export function validateUserId(id: string): ValidationError | null {
  if (!id || typeof id !== "string") {
    return { field: "userId", message: "User ID is required" };
  }

  if (id.trim().length === 0) {
    return { field: "userId", message: "User ID cannot be empty" };
  }

  return null;
}

export function combineValidationErrors(
  ...errors: (ValidationError | null)[]
): ValidationResult {
  const validationErrors = errors.filter((e) => e !== null) as ValidationError[];

  return {
    isValid: validationErrors.length === 0,
    errors: validationErrors,
  };
}
