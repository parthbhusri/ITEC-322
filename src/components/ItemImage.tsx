/* eslint-disable @next/next/no-img-element -- photos come from the API server */
"use client";

import { createElement, useState } from "react";
import { itemIcon, itemTint } from "@/lib/itemArt";

// Shows the item's uploaded photo, or a picture of what the item is
// (headphones, a book, a stethoscope...) when there's no photo.
export default function ItemImage({
  title,
  category,
  imageUrl,
  size = "lg",
  className = "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden",
}: {
  title: string;
  category?: string | null;
  imageUrl?: string | null;
  size?: "sm" | "lg" | "xl";
  className?: string;
}) {
  // If a photo can't be loaded (e.g. it was saved on a laptop that isn't
  // the live server), show the item's picture instead of a broken image
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (imageUrl && failedUrl !== imageUrl) {
    return (
      <div className={className}>
        <img
          src={imageUrl}
          alt={title}
          onError={() => setFailedUrl(imageUrl)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  const tint = itemTint(category);
  const iconSize = size === "sm" ? "h-6 w-6" : size === "xl" ? "h-24 w-24" : "h-16 w-16";
  const ring = size === "sm" ? "" : size === "xl" ? "h-44 w-44" : "h-28 w-28";

  return (
    <div
      className={className}
      style={{ background: `linear-gradient(150deg, ${tint.from} 0%, ${tint.to} 100%)` }}
      role="img"
      aria-label={title}
    >
      {size !== "sm" && (
        <span
          className={`absolute rounded-full ${ring}`}
          style={{
            background: "rgb(255 255 255 / 0.45)",
            boxShadow: "0 0 0 10px rgb(255 255 255 / 0.18)",
          }}
          aria-hidden="true"
        />
      )}
      {/* createElement: the icon is picked from a fixed set, not created here */}
      {createElement(itemIcon(title, category), {
        className: `relative ${iconSize}`,
        style: { color: tint.ink },
        strokeWidth: size === "sm" ? 1.75 : 1.25,
        "aria-hidden": true,
      })}
    </div>
  );
}
