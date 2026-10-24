/* eslint-disable @next/next/no-img-element -- photos come from the API server */
import type { Item } from "@/lib/types";

// Shows the item's uploaded photo, or its category icon when there isn't one.
export default function ItemImage({
  item,
  iconClassName,
  className = "flex aspect-[3/4] w-full items-center justify-center overflow-hidden bg-white",
}: {
  item: Pick<Item, "title" | "coverIcon" | "imageUrl">;
  iconClassName: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      ) : (
        <span
          className={`${iconClassName} transition-transform duration-300 ease-out group-hover:scale-125`}
          aria-hidden="true"
        >
          {item.coverIcon}
        </span>
      )}
    </div>
  );
}
