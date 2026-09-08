import { notFound } from "next/navigation";
import { getItemById } from "@/lib/mock-data";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage({
  params,
}: PageProps<"/checkout/[id]">) {
  const { id } = await params;
  const item = getItemById(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10 md:flex-row">
      <div className="flex-1">
        <h1 className="mb-6 font-serif text-2xl font-semibold text-forest">Checkout</h1>
        <CheckoutForm />
      </div>

      <aside className="w-full shrink-0 rounded-lg border border-sage-dark bg-sage p-5 md:w-72">
        <h2 className="mb-4 font-serif text-lg font-semibold text-forest">Order Summary</h2>
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-sage-dark bg-white text-xl">
            {item.coverIcon}
          </div>
          <div>
            <p className="text-sm font-medium text-forest">{item.title}</p>
            <p className="text-xs text-forest/60">{item.condition}</p>
          </div>
        </div>
        <dl className="mt-4 space-y-2 border-t border-sage-dark pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-forest/70">Rental price</dt>
            <dd className="font-medium text-forest">${item.price}/week</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-forest/70">Hand-off location</dt>
            <dd className="text-right font-medium text-forest">{item.campusLocation}</dd>
          </div>
          <div className="flex justify-between border-t border-sage-dark pt-2">
            <dt className="font-semibold text-forest">Total due</dt>
            <dd className="font-semibold text-forest">${item.price}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
