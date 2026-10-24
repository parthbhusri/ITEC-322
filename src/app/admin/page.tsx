"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import StampBadge from "@/components/StampBadge";
import { ErrorBox, Loading } from "@/components/PageStatus";
import { api } from "@/lib/api";
import { formatPrice, toItem, type Item } from "@/lib/types";

// Built from the public items endpoint. Rental activity across all users
// needs an admin-only endpoint, which the backend doesn't have yet.
export default function AdminPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .items()
      .then((data) => {
        setItems(data.map(toItem));
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = useMemo(() => {
    const all = items ?? [];
    const owners = new Set(all.map((item) => item.ownerId)).size;
    const avg = all.length ? all.reduce((sum, item) => sum + item.price, 0) / all.length : 0;
    return [
      { label: "Total Listings", value: String(all.length), icon: "📊" },
      {
        label: "Available Now",
        value: String(all.filter((item) => item.status === "Available").length),
        icon: "📦",
      },
      { label: "Students Listing", value: String(owners), icon: "🧑‍🎓" },
      { label: "Avg Price / Day", value: formatPrice(avg.toFixed(2)), icon: "💲" },
    ];
  }, [items]);

  const byCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items ?? []) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <ErrorBox
          message={error}
          onRetry={() => {
            setError(null);
            load();
          }}
        />
      </div>
    );
  }
  if (!items) return <Loading />;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="mb-6 font-serif text-2xl font-semibold text-forest">Admin Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-sage-dark bg-white p-4 text-center shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="text-2xl">{metric.icon}</span>
            <p className="mt-1 font-serif text-3xl font-semibold text-forest">{metric.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-forest/60">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {byCategory.map(([category, count]) => (
          <span
            key={category}
            className="rounded-full border border-sage-dark bg-white px-3 py-1 text-xs text-forest/80"
          >
            {category}: <strong>{count}</strong>
          </span>
        ))}
      </div>

      <h2 className="mb-3 font-serif text-lg font-semibold text-forest">Latest Listings</h2>
      <div className="overflow-x-auto rounded-lg border border-sage-dark">
        <table className="w-full text-left text-sm">
          <thead className="bg-sage text-forest/70">
            <tr>
              <th className="px-4 py-2 font-medium">Item</th>
              <th className="px-4 py-2 font-medium">Listed by</th>
              <th className="px-4 py-2 font-medium">Price</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-dark bg-white">
            {items.slice(0, 10).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-forest">
                  <Link href={`/items/${item.id}`} className="hover:underline">
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-forest/70">{item.ownerName}</td>
                <td className="px-4 py-3 text-forest/70">{formatPrice(item.price)}/day</td>
                <td className="px-4 py-3">
                  <StampBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-forest/50">
        Rental activity across all students needs an admin-only API endpoint, which the
        backend doesn&apos;t have yet.
      </p>
    </div>
  );
}
