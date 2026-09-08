import Link from "next/link";
import type { Item } from "@/lib/types";
import StampBadge from "./StampBadge";

export default function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-sage-dark bg-sage transition-shadow hover:shadow-md"
    >
      <div
        className="flex h-32 items-center justify-center text-3xl font-serif font-semibold text-paper"
        style={{ backgroundColor: item.coverColor }}
      >
        {item.title.charAt(0)}
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
