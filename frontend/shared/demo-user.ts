const DEMO_USER_STORAGE_KEY = "aq_doc_demo_user_email";

export const DEFAULT_DEMO_USER_EMAIL = "owner@ajaia.local";

export function getDemoUserEmail(): string {
  if (typeof window === "undefined") {
    return DEFAULT_DEMO_USER_EMAIL;
  }
  return localStorage.getItem(DEMO_USER_STORAGE_KEY) || DEFAULT_DEMO_USER_EMAIL;
}

export function setDemoUserEmail(email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_USER_STORAGE_KEY, email);
}
