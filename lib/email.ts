type ShareEmailPayload = {
  toEmail: string;
  toName: string;
  ownerName: string;
  ownerEmail: string;
  documentTitle: string;
  documentId: string;
  role: "VIEWER" | "EDITOR";
};

export type ShareEmailResult = {
  sent: boolean;
  error?: string;
};

export async function sendShareEmail(payload: ShareEmailPayload): Promise<ShareEmailResult> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!serviceId || !templateId || !publicKey) {
    return {
      sent: false,
      error: "Missing EmailJS configuration: EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY",
    };
  }

  try {
    const baseUrl = appUrl.replace(/\/+$/, "");
    const documentUrl = `${baseUrl}/documents/${payload.documentId}`;
    const inviteMessage = `${payload.ownerName} (${payload.ownerEmail}) shared \"${payload.documentTitle}\" with you as ${payload.role}. Open this document: ${documentUrl}`;

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        ...(privateKey ? { accessToken: privateKey } : {}),
        template_params: {
          // Preferred share-template variables
          to_email: payload.toEmail,
          email: payload.toEmail,
          recipient_email: payload.toEmail,
          user_email: payload.toEmail,
          to_name: payload.toName,
          owner_name: payload.ownerName,
          owner_email: payload.ownerEmail,
          document_title: payload.documentTitle,
          document_id: payload.documentId,
          access_role: payload.role,
          app_url: appUrl,
          document_url: documentUrl,
          doc_url: documentUrl,
          subject: `AQ Doc Invite: ${payload.documentTitle}`,
          reply_to: payload.ownerEmail,

          // Legacy contact-form style variables for compatibility
          from_name: payload.ownerName,
          from_email: payload.ownerEmail,
          phone: "N/A",
          request_type: "Document Share Invite",
          message: inviteMessage,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        sent: false,
        error: `EmailJS ${response.status}: ${body || "Unknown error"}`,
      };
    }

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unexpected EmailJS error",
    };
  }
}
