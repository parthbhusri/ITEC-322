import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemById } from "@/lib/mock-data";
import StampBadge from "@/components/StampBadge";

export default async function ItemDetailPage({
  params,
}: PageProps<"/items/[id]">) {
  const { id } = await params;
  const item = getItemById(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Link href="/" className="mb-6 inline-block text-sm text-forest/60 hover:text-forest">
        &larr; Back to browsing
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="group mx-auto flex aspect-[3/4] w-full max-w-xs items-center justify-center">
          <span className="text-8xl transition-transform duration-300 ease-out group-hover:scale-125">
            {item.coverIcon}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-forest">{item.title}</h1>
            {item.author && <p className="text-forest/70">{item.author}</p>}
          </div>

          <StampBadge status={item.status} />

          <div className="grid grid-cols-2 gap-4 rounded-lg border border-sage-dark bg-sage p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-forest/60">Condition</p>
              <p className="font-medium text-forest">{item.condition}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-forest/60">Price</p>
              <p className="font-medium text-forest">${item.price}/week</p>
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

          <div>
            <p className="mb-1 text-sm font-medium text-forest/80">Description</p>
            <p className="text-sm text-forest/70">{item.description}</p>
          </div>

          <p className="text-sm text-forest/60">Listed by {item.ownerName}</p>
        </div>
      </div>

      <div className="sticky bottom-4 mt-10 flex justify-center">
        <Link
          href={`/checkout/${item.id}`}
          className="rounded-full bg-forest px-8 py-3 font-medium text-paper shadow-lg transition-transform duration-150 hover:scale-105 hover:bg-forest-light hover:shadow-xl"
        >
          Request to Rent
        </Link>
      </div>
    </div>
  );
}
