"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { FAVORITES_EVENT, isFavorite, toggleFavorite } from "@/lib/favorites";

export default function FavoriteButton({
  itemId,
  className = "flex h-9 w-9 items-center justify-center rounded-full bg-platinum-50/90 shadow-sm ring-1 ring-silver/60 transition-transform duration-150 hover:scale-110",
}: {
  itemId: string;
  className?: string;
}) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    setFavorited(isFavorite(itemId));
    function handleChange() {
      setFavorited(isFavorite(itemId));
    }
    window.addEventListener(FAVORITES_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, [itemId]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(itemId);
      }}
      aria-label={favorited ? "Remove from saved items" : "Save item"}
      aria-pressed={favorited}
      className={className}
    >
      <Heart
        className={`h-[18px] w-[18px] transition-colors ${
          favorited ? "fill-lavender-500 text-lavender-700" : "text-mocha-500"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
