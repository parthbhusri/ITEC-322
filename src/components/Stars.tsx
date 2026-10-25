"use client";

import { useState } from "react";
import { Star } from "lucide-react";

/** Read-only star rating, e.g. 4.5 out of 5. */
export function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className="relative inline-block" aria-hidden="true">
            <Star className={`${className} text-silver`} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${className} fill-lavender-500 text-lavender-700`} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** Clickable 1–5 star picker. */
export function StarPicker({
  value,
  onChange,
  label = "Rating",
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const words = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div className="flex items-center gap-3">
      <div
        role="radiogroup"
        aria-label={label}
        className="flex items-center gap-1"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="rounded-md p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`h-7 w-7 ${
                n <= shown ? "fill-lavender-500 text-lavender-700" : "text-silver"
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-mocha-600">{words[shown]}</span>
    </div>
  );
}
