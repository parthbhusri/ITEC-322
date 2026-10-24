// Rubber-stamp status badge, used on platinum surfaces. Covers item
// statuses (Available) and rental statuses (Requested, Approved, Active...).

const LAVENDER = "#5e4b99";
const MOCHA = "#8a5638";
const SILVER = "#7d7c79";
const GREEN = "#3f6b4f";

const STAMP_STYLES: Record<string, { color: string; rotate: string; label?: string }> = {
  Available: { color: LAVENDER, rotate: "-3deg" },
  Requested: { color: MOCHA, rotate: "2deg" },
  Approved: { color: GREEN, rotate: "-2deg" },
  Active: { color: MOCHA, rotate: "-2deg", label: "Rented" },
  Rented: { color: MOCHA, rotate: "-2deg" },
  Completed: { color: SILVER, rotate: "3deg", label: "Returned" },
  Returned: { color: SILVER, rotate: "3deg" },
  Rejected: { color: SILVER, rotate: "2deg" },
  Cancelled: { color: SILVER, rotate: "-3deg" },
  Paid: { color: GREEN, rotate: "2deg" },
  Unpaid: { color: MOCHA, rotate: "-2deg" },
};

export default function StampBadge({ status }: { status: string }) {
  const { color, rotate, label } = STAMP_STYLES[status] ?? { color: SILVER, rotate: "0deg" };

  return (
    <span
      className="inline-block select-none whitespace-nowrap rounded-[5px] border-2 border-dashed px-2 py-0.5 font-display text-[0.7rem] font-extrabold tracking-[0.14em] uppercase"
      style={{ color, borderColor: color, transform: `rotate(${rotate})` }}
    >
      {label ?? status}
    </span>
  );
}
