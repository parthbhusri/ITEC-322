"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import StampBadge from "@/components/StampBadge";
import FavoriteButton from "@/components/FavoriteButton";
import ItemImage from "@/components/ItemImage";
import { ErrorBox, Loading } from "@/components/PageStatus";
import { useToast } from "@/components/ToastProvider";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice, toItem, type Item } from "@/lib/types";

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const showToast = useToast();

  const load = useCallback(() => {
    api
      .item(id)
      .then((data) => {
        setItem(toItem(data));
        setError(null);
      })
      .catch((err: Error) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(err.message);
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !item) return;
    setUploading(true);
    try {
      const updated = await api.uploadItemImage(Number(item.id), file);
      setItem(toItem(updated));
      showToast("Photo updated!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="font-serif text-xl font-semibold text-forest">Item not found</p>
        <p className="text-sm text-forest/70">It may have been removed by its owner.</p>
        <Link href="/" className="text-sm font-medium text-forest underline">
          Back to browsing
        </Link>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        {error ? <ErrorBox
            message={error}
            onRetry={() => {
              setError(null);
              load();
            }}
          /> : <Loading />}
      </div>
    );
  }

  const isOwner = user?.id === item.ownerId;
  const canRent = item.status === "Available" && !isOwner;

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Link href="/" className="mb-6 inline-block text-sm text-forest/60 hover:text-forest">
        &larr; Back to browsing
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="group mx-auto w-full max-w-xs">
          <ItemImage
            item={item}
            iconClassName="text-8xl"
            className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border border-sage-dark bg-white"
          />
          {isOwner && (
            <label className="mt-3 block cursor-pointer rounded-md border border-forest px-3 py-2 text-center text-sm font-medium text-forest hover:bg-sage">
              {uploading ? "Uploading…" : item.imageUrl ? "Change photo" : "Add a photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhoto}
                disabled={uploading}
                className="sr-only"
              />
            </label>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-forest">{item.title}</h1>
              {item.isbn && <p className="text-sm text-forest/60">ISBN {item.isbn}</p>}
            </div>
            <FavoriteButton
              itemId={item.id}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sage-dark bg-white text-xl shadow-sm transition-transform duration-150 hover:scale-110"
            />
          </div>

          <div>
            <StampBadge status={item.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-lg border border-sage-dark bg-sage p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-forest/60">Condition</p>
              <p className="font-medium text-forest">{item.condition}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-forest/60">Price</p>
              <p className="font-medium text-forest">{formatPrice(item.price)}/day</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-forest/60">Category</p>
              <p className="font-medium text-forest">{item.category}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-forest/60">Hand-off</p>
              <p className="font-medium text-forest">{item.campusLocation}</p>
            </div>
          </div>

          {item.description && (
            <div>
              <p className="mb-1 text-sm font-medium text-forest/80">Description</p>
              <p className="whitespace-pre-line text-sm text-forest/70">{item.description}</p>
            </div>
          )}

          <p className="text-sm text-forest/60">
            Listed by {isOwner ? "you" : item.ownerName}
          </p>
          {error && <p className="text-sm text-ink">{error}</p>}
        </div>
      </div>

      <div className="sticky bottom-4 mt-10 flex justify-center">
        {isOwner ? (
          <Link
            href="/my-rentals?tab=requests"
            className="rounded-full border border-forest bg-white px-8 py-3 font-medium text-forest shadow-lg hover:bg-sage"
          >
            This is your listing · See requests
          </Link>
        ) : canRent ? (
          <Link
            href={`/checkout/${item.id}`}
            className="rounded-full bg-forest px-8 py-3 font-medium text-paper shadow-lg transition-transform duration-150 hover:scale-105 hover:bg-forest-light hover:shadow-xl"
          >
            Request to Rent
          </Link>
        ) : (
          <span className="rounded-full bg-sage-dark px-8 py-3 font-medium text-forest/60">
            Not available to rent
          </span>
        )}
      </div>
    </div>
  );
}
