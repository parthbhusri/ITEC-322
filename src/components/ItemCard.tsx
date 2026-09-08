import Link from "next/link";
import type { Item } from "@/lib/types";
import StampBadge from "./StampBadge";

export default function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-sage-dark bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-forest/40 hover:shadow-xl"
    >
      <div
        className="relative flex aspect-[3/4] items-center justify-center overflow-hidden"
        style={{ backgroundColor: item.coverColor }}
      >
        <div
          className="absolute inset-y-0 left-0 w-2 bg-black/15"
          aria-hidden
        />
        <span className="font-serif text-5xl font-semibold text-paper drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
          {item.title.charAt(0)}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug text-forest group-hover:underline">
            {item.title}
          </h3>
        </div>
        {item.author && <p className="text-sm text-forest/70">{item.author}</p>}
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-forest/70">{item.condition}</span>
          <span className="font-semibold text-forest">${item.price}/wk</span>
        </div>
        <div className="mt-2">
          <StampBadge status={item.status} />
        </div>
      </div>
    </Link>
  );
}
