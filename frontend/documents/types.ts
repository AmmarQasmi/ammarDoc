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
