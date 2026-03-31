"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [user, setUser] = useState<MePayload | null>(null);

  useEffect(() => {
    async function loadMe() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const json = (await response.json()) as ApiEnvelope<MePayload>;
        if (response.ok && json.success && json.data) {
          setUser(json.data);
        }
      } catch {
        setUser(null);
      }
    }

    void loadMe();
  }, []);

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
        <span className="app-user-name">{user?.name || "Demo User"}</span>
      </div>
    </header>
  );
}
