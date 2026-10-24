import { imageSrc, type ApiItem } from "./api";

// Categories offered when listing an item. The backend accepts any text,
// so items created elsewhere (e.g. the sample data) may use others too.
export const LISTING_CATEGORIES = [
  "Textbook",
  "Calculator",
  "Lab Equipment",
  "Electronics",
  "Tool",
  "Nursing Equipment",
  "Camera Equipment",
  "Study Equipment",
  "Other",
] as const;

export const CONDITIONS = ["New", "Like New", "Good", "Fair", "Worn"] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  Textbook: "📚",
  Calculator: "🧮",
  "Lab Equipment": "🥼",
  Electronics: "💻",
  Tool: "🔧",
  "Nursing Equipment": "🩺",
  "Camera Equipment": "📷",
  "Study Equipment": "📝",
  Other: "📦",
};

export function categoryIcon(category: string | null | undefined): string {
  return (category && CATEGORY_ICONS[category]) || "📦";
}

/** An item as the UI uses it (converted from the backend's shape). */
export interface Item {
  id: string;
  ownerId: number;
  title: string;
  isbn?: string;
  category: string;
  condition: string;
  /** Price per day in AUD */
  price: number;
  status: string;
  description: string;
  campusLocation: string;
  ownerName: string;
  coverIcon: string;
  imageUrl: string | null;
}

export function toItem(api: ApiItem): Item {
  return {
    id: String(api.id),
    ownerId: api.owner_id,
    title: api.title,
    isbn: api.isbn ?? undefined,
    category: api.category,
    condition: api.condition,
    price: Number(api.price_per_day),
    status: api.status,
    description: api.description ?? "",
    campusLocation:
      api.pickup_location || [api.campus, api.university].filter(Boolean).join(", ") || "Ask the owner",
    ownerName: api.owner_name ?? "A student",
    coverIcon: categoryIcon(api.category),
    imageUrl: imageSrc(api.image_url),
  };
}

export function formatPrice(value: number | string): string {
  const n = Number(value);
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

/** Number of days in an inclusive date range, like the backend calculates. */
export function rentalDays(start: string, end: string): number {
  const ms = Date.parse(end) - Date.parse(start);
  if (Number.isNaN(ms) || ms < 0) return 0;
  return Math.round(ms / 86_400_000) + 1;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

/** Today's date as YYYY-MM-DD in the user's own time zone. */
export function todayISO(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
