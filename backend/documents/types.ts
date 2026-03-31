// Document-specific types

export interface DocumentContent {
  type: "doc";
  content: Array<{
    type: string;
    attrs?: Record<string, any>;
    content?: Array<{
      type: string;
      text?: string;
      marks?: Array<{ type: string }>;
      content?: any[];
    }>;
  }>;
}

export interface CreateDocumentInput {
  title: string;
  ownerUserId: string;
  contentJson?: DocumentContent;
}

export interface UpdateDocumentInput {
  title?: string;
  contentJson?: DocumentContent;
}

export interface DocumentDTO {
  id: string;
  ownerUserId: string;
  title: string;
  contentJson: DocumentContent;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentListDTO extends DocumentDTO {
  isOwned: boolean;
  isEditor: boolean;
}

export const DEFAULT_DOCUMENT_CONTENT: DocumentContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [],
    },
  ],
};
