import Link from "next/link";

/** Brand mark: a rental hang-tag with swap arrows (borrow ⇄ return). */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      {/* string */}
      <path
        d="M20 9.5C17 5 11 3.5 6.5 5.5"
        fill="none"
        stroke="#c9b8ec"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* tag */}
      <path
        d="M13 11.5 20 5l7 6.5V33a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3Z"
        fill="#dcd0f3"
        stroke="#f6f2fd"
        strokeWidth="1"
      />
      {/* hole */}
      <circle cx="20" cy="11.2" r="1.9" fill="#2c1e17" />
      {/* swap arrows */}
      <path
        d="M15.5 20.5h9m0 0-2.4-2.4m2.4 2.4-2.4 2.4M24.5 28h-9m0 0 2.4-2.4M15.5 28l2.4 2.4"
        fill="none"
        stroke="#2c1e17"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="group flex items-center gap-2.5" aria-label="Campus Rental Hub home">
      <LogoMark className="h-10 w-10 transition-transform duration-300 group-hover:-rotate-6" />
      <span className="font-display text-[1.15rem] font-bold leading-[1.05] tracking-tight text-platinum">
        Campus
        <br />
        <span className="font-semibold text-platinum/75">Rental Hub</span>
      </span>
    </Link>
  );
}
