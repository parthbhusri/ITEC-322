// Rubber-stamp style status badge. Covers item statuses (Available) and
// rental statuses from the backend (Requested, Approved, Active, ...).

const FOREST = "#1B4332";
const RUST = "#B4471F";
const GREY = "#6B7A6E";

const STAMP_STYLES: Record<string, { color: string; rotate: string; label?: string }> = {
  Available: { color: FOREST, rotate: "-3deg" },
  Requested: { color: RUST, rotate: "2deg" },
  Approved: { color: FOREST, rotate: "-2deg" },
  Active: { color: RUST, rotate: "-2deg", label: "Rented" },
  Rented: { color: RUST, rotate: "-2deg" },
  Completed: { color: GREY, rotate: "3deg", label: "Returned" },
  Returned: { color: GREY, rotate: "3deg" },
  Rejected: { color: GREY, rotate: "2deg" },
  Cancelled: { color: GREY, rotate: "-3deg" },
  Paid: { color: FOREST, rotate: "2deg" },
  Unpaid: { color: RUST, rotate: "-2deg" },
};

export default function StampBadge({ status }: { status: string }) {
  const { color, rotate, label } = STAMP_STYLES[status] ?? { color: GREY, rotate: "0deg" };

  return (
    <span
      className="inline-block select-none whitespace-nowrap rounded-sm border-2 border-dashed px-2.5 py-1 font-mono text-xs font-bold tracking-widest uppercase"
      style={{ color, borderColor: color, transform: `rotate(${rotate})` }}
    >
      {label ?? status}
    </span>
  );
}
