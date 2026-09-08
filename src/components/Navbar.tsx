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
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
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
          <Link
            href="/login"
            className="rounded-md bg-forest px-4 py-2 text-paper hover:bg-forest-light"
          >
            Log In
          </Link>
        </div>
      </div>
    </nav>
  );
}
