import { CalendarDays, GraduationCap, Handshake } from "lucide-react";
import { LogoMark } from "./Logo";

const POINTS = [
  { icon: GraduationCap, text: "Only students with a university email can join." },
  { icon: CalendarDays, text: "Rent by the day, so you only pay for the days you need it." },
  { icon: Handshake, text: "Meet on campus to hand things over and give them back." },
];

/** Two-part card used by the login and register pages. */
export default function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-10 sm:px-6">
      <div className="panel grid w-full overflow-hidden md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-mocha-900 p-10 text-platinum md:flex">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-lavender-200/15 blur-3xl"
            aria-hidden="true"
          />
          <div>
            <LogoMark className="h-16 w-16" />
            <p className="mt-6 max-w-xs font-display text-3xl font-bold leading-tight">
              The things you need for class, borrowed from the people in it.
            </p>
          </div>
          <ul className="space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3 text-sm text-platinum/75">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lavender-200/15">
                  <Icon className="h-4 w-4 text-lavender-200" aria-hidden="true" />
                </span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 py-10 sm:px-12 sm:py-12">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mb-8 mt-1.5 text-sm text-mocha-600">{subtitle}</p>
            {children}
            <p className="mt-6 text-center text-sm text-mocha-600">{footer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
