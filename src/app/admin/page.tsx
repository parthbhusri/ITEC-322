import StampBadge from "@/components/StampBadge";
import { getItemById, items, rentalHistory } from "@/lib/mock-data";

export default function AdminPage() {
  const activeListings = items.filter((item) => item.status === "Available").length;
  const activeRentals = items.filter((item) => item.status === "Rented").length;
  const pendingRequests = items.filter((item) => item.status === "Requested").length;
  const totalListings = items.length;

  const metrics = [
    { label: "Active Listings", value: activeListings },
    { label: "Active Rentals", value: activeRentals },
    { label: "Pending Requests", value: pendingRequests },
    { label: "Total Listings", value: totalListings },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="mb-6 font-serif text-2xl font-semibold text-forest">Admin Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-sage-dark bg-sage p-4 text-center"
          >
            <p className="font-serif text-3xl font-semibold text-forest">{metric.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-forest/60">
              {metric.label}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 font-serif text-lg font-semibold text-forest">Recent Activity</h2>
      <div className="overflow-x-auto rounded-lg border border-sage-dark">
        <table className="w-full text-left text-sm">
          <thead className="bg-sage text-forest/70">
            <tr>
              <th className="px-4 py-2 font-medium">Item</th>
              <th className="px-4 py-2 font-medium">Renter</th>
              <th className="px-4 py-2 font-medium">Requested</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-dark bg-white">
            {rentalHistory.map((record) => {
              const item = getItemById(record.itemId);
              return (
                <tr key={record.id}>
                  <td className="px-4 py-3 text-forest">{item?.title ?? "Unknown item"}</td>
                  <td className="px-4 py-3 text-forest/70">{record.renterName}</td>
                  <td className="px-4 py-3 text-forest/70">{record.requestedAt}</td>
                  <td className="px-4 py-3">
                    <StampBadge status={record.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
