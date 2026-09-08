const FLOATING_ICONS = [
  { icon: "📚", rotate: "-6deg" },
  { icon: "🧮", rotate: "4deg" },
  { icon: "🥼", rotate: "-3deg" },
  { icon: "🥽", rotate: "5deg" },
];

export default function AuthSidePanel() {
  return (
    <div className="hidden flex-1 flex-col justify-center gap-8 bg-forest px-12 text-paper md:flex">
      <div>
        <p className="font-serif text-3xl font-semibold">Campus Rental Hub</p>
        <p className="mt-3 max-w-xs text-paper/70">
          Textbooks, calculators, and lab gear — borrowed and returned right on
          campus. No shipping, no markup, just students helping students.
        </p>
      </div>

      <div className="flex gap-5 text-5xl">
        {FLOATING_ICONS.map(({ icon, rotate }) => (
          <span key={icon} style={{ transform: `rotate(${rotate})` }} className="inline-block">
            {icon}
          </span>
        ))}
      </div>

      <span className="inline-block w-fit -rotate-3 select-none whitespace-nowrap rounded-sm border-2 border-dashed border-paper/50 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-paper/80">
        Verified students only
      </span>
    </div>
  );
}
