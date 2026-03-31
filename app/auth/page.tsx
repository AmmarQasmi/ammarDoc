"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "signup";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit() {
    try {
      setSubmitting(true);
      setError("");

      if (mode === "signup") {
        if (!EMAIL_REGEX.test(email.trim().toLowerCase())) {
          setError("Please enter a valid email address");
          return;
        }
        if (!PASSWORD_RULE.test(password)) {
          setError("Password must include upper, lower, number, special char (8+ length)");
          return;
        }
      }

      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload = mode === "login" ? { email, password } : { name, email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as ApiEnvelope<{ id: string }>;
      if (!response.ok || !json.success) {
        setError(json.error?.message || "Authentication failed");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="auth-title">AQ Doc</h1>
        <p className="auth-subtitle">{mode === "login" ? "Log in to continue" : "Create an account"}</p>

        <div className="row gap-xs top-gap">
          <button className={`btn ${mode === "login" ? "btn-primary" : "btn-ghost"}`} onClick={() => setMode("login")}>
            Login
          </button>
          <button className={`btn ${mode === "signup" ? "btn-primary" : "btn-ghost"}`} onClick={() => setMode("signup")}>
            Sign up
          </button>
        </div>

        {mode === "signup" ? (
          <div className="top-gap">
            <label className="label" htmlFor="auth-name">Name</label>
            <input id="auth-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        ) : null}

        <div className="top-gap">
          <label className="label" htmlFor="auth-email">Email</label>
          <input id="auth-email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="top-gap">
          <label className="label" htmlFor="auth-password">Password</label>
          <div className="auth-password-wrap">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-ghost auth-password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {mode === "signup" ? (
            <p className="muted top-gap">Use 8+ chars with uppercase, lowercase, number, and special symbol.</p>
          ) : null}
        </div>

        <button className="btn btn-primary top-gap auth-submit" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
        </button>

        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </main>
  );
}
