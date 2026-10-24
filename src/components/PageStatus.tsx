"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { LogoMark } from "./Logo";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-2 py-20 text-sm text-platinum/60">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="max-w-md text-sm text-danger">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-outline btn-sm">
          Try again
        </button>
      )}
    </div>
  );
}

/** Shown on pages that need a logged-in student. */
export function LoginRequired({ message }: { message: string }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="panel flex w-full flex-col items-center gap-4 px-8 py-10 text-center">
        <LogoMark className="h-14 w-14" />
        <h1 className="font-display text-2xl font-bold">Please log in</h1>
        <p className="text-sm text-mocha-600">{message}</p>
        <div className="mt-1 flex gap-3">
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn btn-primary">
            Log in
          </Link>
          <Link href="/register" className="btn btn-outline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
