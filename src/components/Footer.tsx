import { LogoMark } from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-platinum/10 bg-mocha-900">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-8 text-sm text-platinum/55 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <LogoMark className="h-7 w-7" />
          <p className="font-display font-semibold text-platinum/85">Campus Rental Hub</p>
        </div>
        <p>Built by students, for students. Not affiliated with your campus bookstore.</p>
      </div>
    </footer>
  );
}
