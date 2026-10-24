import Link from "next/link";
import { formatPrice, type Item } from "@/lib/types";
import StampBadge from "./StampBadge";
import FavoriteButton from "./FavoriteButton";
import ItemImage from "./ItemImage";

// The rental hang-tag outline: chamfered top corners like a luggage tag
export const TAG_SHAPE = "polygon(16% 0, 84% 0, 100% 2.6rem, 100% 100%, 0 100%, 0 2.6rem)";

/** Item card shaped like a rental hang-tag, with a hole and a string. */
export default function ItemCard({ item, preview = false }: { item: Item; preview?: boolean }) {
  return (
    <div className="group relative pt-5 [filter:drop-shadow(0_14px_22px_rgb(20_12_8/0.45))]">
      {/* string through the hole */}
      <svg
        viewBox="0 0 60 44"
        className="pointer-events-none absolute left-1/2 top-0 z-10 h-[44px] w-[60px] -translate-x-1/2"
        aria-hidden="true"
      >
        <path
          d="M30 41C27 26 34 11 54 3"
          fill="none"
          stroke="#c9b8ec"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>

      <div
        className="relative flex h-full flex-col bg-platinum-50 text-mocha-900 transition-transform duration-200 group-hover:-rotate-1"
        style={{ clipPath: TAG_SHAPE }}
      >
        <span className="tag-hole" aria-hidden="true" />

        <Link
          href={preview ? "#" : `/items/${item.id}`}
          onClick={preview ? (e) => e.preventDefault() : undefined}
          tabIndex={preview ? -1 : undefined}
          className="flex flex-1 flex-col pt-10 focus-visible:outline-none"
        >
          <div className="mx-3 overflow-hidden rounded-xl">
            <ItemImage title={item.title} category={item.category} imageUrl={item.imageUrl} />
          </div>

          <div className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-3">
            <p className="text-xs font-medium text-mocha-500">{item.category}</p>
            <h3 className="font-display text-[1.05rem] font-semibold leading-snug text-mocha-900 group-hover:underline group-focus-visible:underline">
              {item.title}
            </h3>
            <div className="mt-auto flex items-end justify-between gap-2 pt-3">
              <StampBadge status={item.status} />
              <p className="text-right leading-none">
                <span className="font-display text-xl font-bold text-mocha-900">
                  {formatPrice(item.price)}
                </span>
                <span className="text-xs text-mocha-500"> / day</span>
              </p>
            </div>
            <p className="text-xs text-silver-600">Condition: {item.condition}</p>
          </div>
        </Link>

        {!preview && <FavoriteButton itemId={item.id} className="absolute right-5 top-[3.25rem] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-platinum-50/90 shadow-sm ring-1 ring-silver/60 transition-transform duration-150 hover:scale-110" />}
      </div>
    </div>
  );
}
