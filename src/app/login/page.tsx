"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import AuthSidePanel from "@/components/AuthSidePanel";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: { email?: string; password?: string } = {};
    if (!email.endsWith(".edu")) {
      nextErrors.email = "Please use your student email address (.edu)";
    }
    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }
    setErrors(nextErrors);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1">
      <AuthSidePanel />

      <div className="flex w-full flex-col justify-center px-6 py-16 md:flex-1">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="mb-1 font-serif text-2xl font-semibold text-forest">Log In</h1>
          <p className="mb-8 text-sm text-forest/70">
            Verify with your student email to access the hub.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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

            <button
              type="submit"
              className="mt-2 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper shadow-sm transition-transform duration-150 hover:scale-105 hover:bg-forest-light hover:shadow-md"
            >
              Log In
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-forest/70">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-forest underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
