"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import AuthShell from "@/components/AuthShell";
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/lib/auth";

/** Only allow redirects back to pages on this site. */
function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const showToast = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: { email?: string; password?: string } = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = "Enter your email address";
    }
    if (!password) {
      nextErrors.password = "Enter your password";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      showToast(`Welcome back, ${user.full_name.split(" ")[0]}!`);
      router.push(nextPath());
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Login failed" });
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in with your student email."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-semibold text-lavender-700 underline-offset-2 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="email" className="field-label">
            Student email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu.au"
            autoComplete="email"
            className="field"
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>

        {errors.form && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
            {errors.form}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn btn-primary mt-2 py-3 text-base">
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
