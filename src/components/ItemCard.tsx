import Link from "next/link";
import { formatPrice, type Item } from "@/lib/types";
import StampBadge from "./StampBadge";
import FavoriteButton from "./FavoriteButton";
import ItemImage from "./ItemImage";

export default function ItemCard({ item }: { item: Item }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-sage-dark bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-forest/40 hover:shadow-xl">
      <FavoriteButton
        itemId={item.id}
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm transition-transform duration-150 hover:scale-110"
      />
      <Link href={`/items/${item.id}`} className="flex flex-1 flex-col">
        <ItemImage item={item} iconClassName="text-6xl" />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-semibold leading-snug text-forest group-hover:underline">
            {item.title}
          </h3>
          <p className="text-sm text-forest/60">{item.category}</p>
          <div className="mt-auto flex items-center justify-between pt-1 text-sm">
            <span className="text-forest/70">{item.condition}</span>
            <span className="font-semibold text-forest">{formatPrice(item.price)}/day</span>
          </div>
          <div className="mt-2">
            <StampBadge status={item.status} />
          </div>
        </div>
      </Link>
    </div>
  );
}
