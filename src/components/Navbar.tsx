"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogIn, LogOut, Menu, Plus, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Logo from "./Logo";

const links = [
  { href: "/", label: "Browse" },
  { href: "/my-rentals", label: "My Rentals" },
  { href: "/admin", label: "Admin" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const firstName = user?.full_name.split(" ")[0];
  const initial = firstName?.[0]?.toUpperCase();

  function linkClass(href: string) {
    const isActive = pathname === href;
    return isActive
      ? "rounded-full bg-platinum/10 px-3.5 py-1.5 text-platinum"
      : "rounded-full px-3.5 py-1.5 text-platinum/65 transition-colors hover:bg-platinum/5 hover:text-platinum";
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-platinum/10 bg-mocha-900/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo onClick={() => setMenuOpen(false)} />

        <div className="hidden items-center gap-1 text-sm font-medium md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/list-item" className="btn btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            List an item
          </Link>
          {loading ? (
            <span className="h-9 w-9" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <span
                title={user.full_name}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-mocha-300 font-display text-sm font-bold text-mocha-950"
              >
                {initial}
              </span>
              <button
                type="button"
                onClick={logout}
                aria-label="Log out"
                title="Log out"
                className="flex h-9 w-9 items-center justify-center rounded-full text-platinum/60 transition-colors hover:bg-platinum/10 hover:text-platinum"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-ghost">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Log in
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-full text-platinum hover:bg-platinum/10 md:hidden"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-platinum/10 px-4 pb-5 pt-3 md:hidden">
          <div className="flex flex-col gap-1 text-sm font-medium">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={linkClass(link.href)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/list-item"
              onClick={() => setMenuOpen(false)}
              className="btn btn-primary mt-3"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              List an item
            </Link>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="btn btn-ghost mt-2"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out ({firstName})
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="btn btn-ghost mt-2"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
