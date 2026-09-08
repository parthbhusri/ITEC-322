"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Browse" },
  { href: "/list-item", label: "List an Item" },
  { href: "/my-rentals", label: "My Rentals" },
  { href: "/admin", label: "Admin" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-sage-dark bg-paper">
      <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-4">
        <Link href="/" className="font-serif text-xl font-semibold text-forest">
          Campus Rental Hub
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
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

        <div className="flex justify-end">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper shadow-sm transition-transform duration-150 hover:scale-105 hover:bg-forest-light hover:shadow-md"
          >
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
            Log In
          </Link>
        </div>
      </div>
    </nav>
  );
}
