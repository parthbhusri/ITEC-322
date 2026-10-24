"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import AuthSidePanel from "@/components/AuthSidePanel";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface FormErrors {
  name?: string;
  email?: string;
  university?: string;
  campus?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

// Student emails end in .edu (US) or .edu.au (Australia)
const STUDENT_EMAIL = /^[^\s@]+@[^\s@]+\.edu(\.[a-z]{2})?$/i;

const inputClass =
  "w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest placeholder:text-forest/40 focus:border-forest focus:outline-none";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [campus, setCampus] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const { login, setUser } = useAuth();
  const router = useRouter();
  const showToast = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FormErrors = {};
    if (name.trim().length < 2) {
      nextErrors.name = "Full name is required";
    }
    if (!STUDENT_EMAIL.test(email.trim())) {
      nextErrors.email = "Please use your student email (ending in .edu or .edu.au)";
    }
    if (!university.trim()) {
      nextErrors.university = "University is required";
    }
    if (!campus.trim()) {
      nextErrors.campus = "Campus is required";
    }
    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      // 1. create the account, 2. log in, 3. save university + campus
      // (the backend only takes name/email/password at sign-up, and
      // needs university + campus before someone can list an item)
      await api.register(name.trim(), email.trim(), password);
      await login(email.trim(), password);
      const updated = await api.updateMe({
        university: university.trim(),
        campus: campus.trim(),
      });
      setUser(updated);
      showToast("Account created!");
      router.push("/");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Registration failed" });
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1">
      <AuthSidePanel />

      <div className="flex w-full flex-col justify-center px-6 py-16 md:flex-1">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="mb-1 font-serif text-2xl font-semibold text-forest">Create Account</h1>
          <p className="mb-8 text-sm text-forest/70">
            We&apos;ll verify with your student email to keep the hub campus-only.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-forest/80">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
              {errors.name && <p className="mt-1 text-xs text-ink">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-forest/80">
                Student email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu.au"
                className={inputClass}
              />
              {errors.email && <p className="mt-1 text-xs text-ink">{errors.email}</p>}
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label
                  htmlFor="university"
                  className="mb-1 block text-sm font-medium text-forest/80"
                >
                  University
                </label>
                <input
                  id="university"
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. ACU"
                  className={inputClass}
                />
                {errors.university && (
                  <p className="mt-1 text-xs text-ink">{errors.university}</p>
                )}
              </div>
              <div className="flex-1">
                <label htmlFor="campus" className="mb-1 block text-sm font-medium text-forest/80">
                  Campus
                </label>
                <input
                  id="campus"
                  type="text"
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  placeholder="e.g. North Sydney"
                  className={inputClass}
                />
                {errors.campus && <p className="mt-1 text-xs text-ink">{errors.campus}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-forest/80">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              {errors.password && <p className="mt-1 text-xs text-ink">{errors.password}</p>}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-forest/80"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-ink">{errors.confirmPassword}</p>
              )}
            </div>

            {errors.form && (
              <p className="rounded-md border border-ink/40 bg-ink/5 px-3 py-2 text-sm text-ink">
                {errors.form}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper shadow-sm transition-transform duration-150 hover:scale-105 hover:bg-forest-light hover:shadow-md disabled:cursor-wait disabled:opacity-60 disabled:hover:scale-100"
            >
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-forest/70">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-forest underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
