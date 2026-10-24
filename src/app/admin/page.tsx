"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import StampBadge from "@/components/StampBadge";
import { ErrorBox, Loading } from "@/components/PageStatus";
import { api } from "@/lib/api";
import { formatPrice, toItem, type Item } from "@/lib/types";
import { GraduationCap, LayoutGrid, PackageCheck, Wallet } from "lucide-react";

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
      { label: "Total listings", value: String(all.length), icon: LayoutGrid },
      {
        label: "Available now",
        value: String(all.filter((item) => item.status === "Available").length),
        icon: PackageCheck,
      },
      { label: "Students listing", value: String(owners), icon: GraduationCap },
      { label: "Average price per day", value: formatPrice(avg.toFixed(2)), icon: Wallet },
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
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
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
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-platinum sm:text-4xl">Admin dashboard</h1>
      <p className="mb-6 mt-1.5 text-platinum/65">What&apos;s listed on the hub right now.</p>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="panel flex items-center gap-3 p-4"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lavender-100">
              <metric.icon className="h-5 w-5 text-lavender-700" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-2xl font-bold leading-none">{metric.value}</p>
              <p className="mt-1 text-xs text-mocha-500">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {byCategory.map(([category, count]) => (
          <span
            key={category}
            className="rounded-full border border-platinum/20 bg-mocha-800/60 px-3 py-1 text-xs text-platinum/80"
          >
            {category} <strong className="ml-1 text-platinum">{count}</strong>
          </span>
        ))}
      </div>

      <h2 className="mb-3 font-display text-xl font-semibold text-platinum">Latest listings</h2>
      <div className="panel overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-platinum text-mocha-600">
            <tr>
              <th className="px-4 py-2.5 font-medium">Item</th>
              <th className="px-4 py-2.5 font-medium">Listed by</th>
              <th className="px-4 py-2.5 font-medium">Price</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-silver/60">
            {items.slice(0, 10).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/items/${item.id}`} className="hover:underline">
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-mocha-600">{item.ownerName}</td>
                <td className="px-4 py-3 text-mocha-600">{formatPrice(item.price)} per day</td>
                <td className="px-4 py-3">
                  <StampBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-platinum/45">
        Rental activity across all students needs an admin-only API endpoint, which the
        backend doesn&apos;t have yet.
      </p>
    </div>
  );
}
