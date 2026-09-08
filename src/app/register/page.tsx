"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FormErrors = {};
    if (!name.trim()) {
      nextErrors.name = "Full name is required";
    }
    if (!email.endsWith(".edu")) {
      nextErrors.email = "Please use your student email address (.edu)";
    }
    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(nextErrors);
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none"
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest placeholder:text-forest/40 focus:border-forest focus:outline-none"
          />
          {errors.email && <p className="mt-1 text-xs text-ink">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-forest/80">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none"
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
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-ink">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          className="mt-2 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper shadow-sm transition-transform duration-150 hover:scale-105 hover:bg-forest-light hover:shadow-md"
        >
          Create Account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-forest/70">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-forest underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
