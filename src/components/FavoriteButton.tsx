"use client";

import { useEffect, useState } from "react";
import { FAVORITES_EVENT, isFavorite, toggleFavorite } from "@/lib/favorites";

export default function FavoriteButton({
  itemId,
  className,
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
      className={
        className ??
        "flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm transition-transform duration-150 hover:scale-110"
      }
    >
      {favorited ? "❤️" : "🤍"}
    </button>
  );
}
