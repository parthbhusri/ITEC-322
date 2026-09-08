import type { RentalStatus } from "@/lib/types";

const STAMP_STYLES: Record<RentalStatus, { color: string; rotate: string }> = {
  Available: { color: "#1B4332", rotate: "-3deg" },
  Requested: { color: "#B4471F", rotate: "2deg" },
  Rented: { color: "#B4471F", rotate: "-2deg" },
  Returned: { color: "#6B7A6E", rotate: "3deg" },
};

export default function StampBadge({ status }: { status: RentalStatus }) {
  const { color, rotate } = STAMP_STYLES[status];

  return (
    <span
      className="inline-block select-none whitespace-nowrap rounded-sm border-2 border-dashed px-2.5 py-1 font-mono text-xs font-bold tracking-widest uppercase"
      style={{ color, borderColor: color, transform: `rotate(${rotate})` }}
    >
      {status}
    </span>
  );
}
