"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-20 text-sm text-forest/60">
      <span className="animate-pulse">{label}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-ink/50 bg-white px-6 py-12 text-center">
      <p className="text-sm text-ink">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-forest px-3 py-1.5 text-sm font-medium text-forest hover:bg-sage"
        >
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
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="font-serif text-xl font-semibold text-forest">Please log in</p>
      <p className="text-sm text-forest/70">{message}</p>
      <div className="flex gap-3">
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper shadow-sm hover:bg-forest-light"
        >
          Log In
        </Link>
        <Link
          href="/register"
          className="rounded-md border border-forest px-4 py-2 text-sm font-medium text-forest hover:bg-sage"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
