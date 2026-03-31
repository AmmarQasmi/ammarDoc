"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type MePayload = {
  id: string;
  name: string;
  email: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message: string };
};

type Props = {
  title: string;
};

export default function AppHeader({ title }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<MePayload | null>(null);

  useEffect(() => {
    async function loadMe() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const json = (await response.json()) as ApiEnvelope<MePayload>;
        if (response.ok && json.success && json.data) {
          setUser(json.data);
          return;
        }
        router.push("/auth");
      } catch {
        setUser(null);
        router.push("/auth");
      }
    }

    void loadMe();
  }, [router]);

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
    router.refresh();
  }

  return (
    <header className="app-header">
      <div className="app-header-left">
        <Link href="/" className="app-logo-link" aria-label="Go to home page">
          <span className="app-logo-badge">AQ</span>
          <span className="app-logo-text">Doc</span>
        </Link>
        <span className="app-header-divider" aria-hidden="true">|</span>
        <h1 className="app-header-title">{title}</h1>
      </div>
      <div className="app-header-right">
        <span className="app-user-label">Logged in as</span>
        <span className="app-user-name">{user?.name || "User"}</span>
        <button className="btn btn-ghost app-logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
