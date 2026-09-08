"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Browse" },
  { href: "/list-item", label: "List an Item" },
  { href: "/my-rentals", label: "My Rentals" },
  { href: "/admin", label: "Admin" },
];

function LoginIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-sage-dark bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 md:grid md:grid-cols-[1fr_auto_1fr]">
        <Link
          href="/"
          className="font-serif text-xl font-semibold text-forest"
          onClick={() => setMenuOpen(false)}
        >
          Campus Rental Hub
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium md:flex md:justify-self-center">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "text-forest underline decoration-2 underline-offset-4"
                    : "text-forest/60 hover:text-forest"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex md:justify-end">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper shadow-sm transition-transform duration-150 hover:scale-105 hover:bg-forest-light hover:shadow-md"
          >
            <LoginIcon />
            Log In
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-md text-forest hover:bg-sage md:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            {menuOpen ? (
              <>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </>
            ) : (
              <>
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-sage-dark px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4 text-sm font-medium">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={
                    isActive
                      ? "text-forest underline decoration-2 underline-offset-4"
                      : "text-forest/60 hover:text-forest"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper shadow-sm hover:bg-forest-light"
            >
              <LoginIcon />
              Log In
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
