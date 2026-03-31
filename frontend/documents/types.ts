export type TiptapDoc = {
  type: "doc";
  content: Array<{
    type: string;
    attrs?: Record<string, unknown>;
    content?: Array<{
      type: string;
      text?: string;
      marks?: Array<{ type: string }>;
    }>;
  }>;
};

export type DocumentItem = {
  id: string;
  ownerUserId: string;
  title: string;
  contentJson: TiptapDoc;
  createdAt: string;
  updatedAt: string;
  permission?: "OWNER" | "EDITOR" | "VIEWER";
  canEdit?: boolean;
  canShare?: boolean;
};

export type DocumentsPayload = {
  owned: DocumentItem[];
  shared: DocumentItem[];
};

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
};

export type UserItem = {
  id: string;
  name: string;
  email: string;
};

export type ShareItem = {
  userId: string;
  email: string;
  name: string;
  accessRole: "VIEWER" | "EDITOR";
  grantedAt: string;
};
