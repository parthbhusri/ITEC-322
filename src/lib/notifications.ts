"use client";

import { useEffect, useState } from "react";
import { api, type ApiRentalSummary } from "./api";
import { useAuth } from "./auth";

// Fired after anything that changes a rental (request, approve, pay...)
// so the navbar badge updates straight away.
export const RENTALS_CHANGED_EVENT = "rentals-changed";

export function notifyRentalsChanged() {
  window.dispatchEvent(new Event(RENTALS_CHANGED_EVENT));
}

/** What needs the logged-in student's attention, for the navbar badge. */
export function useRentalSummary(): ApiRentalSummary | null {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ApiRentalSummary | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    function refresh() {
      api
        .rentalSummary()
        .then((data) => {
          if (!cancelled) setSummary(data);
        })
        .catch(() => {
          // A failed badge refresh shouldn't interrupt anything
        });
    }

    refresh();
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener(RENTALS_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(RENTALS_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [user]);

  return user ? summary : null;
}
