"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import AuthShell from "@/components/AuthShell";
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
    <AuthShell
      title="Create your account"
      subtitle="Use your student email so the hub stays campus-only."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-lavender-700 underline-offset-2 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="name" className="field-label">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="field-label">
            Student email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu.au"
            className="field"
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label
              htmlFor="university"
              className="field-label"
            >
              University
            </label>
            <input
              id="university"
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="e.g. ACU"
              className="field"
            />
            {errors.university && (
              <p className="field-error">{errors.university}</p>
            )}
          </div>
          <div className="flex-1">
            <label htmlFor="campus" className="field-label">
              Campus
            </label>
            <input
              id="campus"
              type="text"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              placeholder="e.g. North Sydney"
              className="field"
            />
            {errors.campus && <p className="field-error">{errors.campus}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="field-label"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="field"
          />
          {errors.confirmPassword && (
            <p className="field-error">{errors.confirmPassword}</p>
          )}
        </div>

        {errors.form && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
            {errors.form}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn btn-primary mt-2 py-3 text-base">
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
