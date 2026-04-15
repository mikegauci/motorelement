import Image from "next/image";
import { getAllIllustrations } from "@/lib/supabase/queries/illustrations";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-900/30 text-yellow-400",
  processing: "bg-blue-900/30 text-blue-400",
  completed: "bg-green-900/30 text-green-400",
  failed: "bg-red-900/30 text-red-400",
};

export default async function AdminIllustrationsPage() {
  const { data: illustrations, error } = await getAllIllustrations();

  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="font-heading text-display text-white">ILLUSTRATIONS</h1>

      {error && (
        <p className="mt-4 font-body text-sm text-redline">{error}</p>
      )}

      {illustrations && illustrations.length === 0 && (
        <p className="mt-8 text-sm text-muted">No illustrations yet.</p>
      )}

      {illustrations && illustrations.length > 0 && (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {illustrations.map((ill) => (
            <div key={ill.id} className="border border-border bg-obsidian p-4">
              <div className="flex gap-4">
                {ill.generatedImageUrl && (
                  <Image
                    src={ill.generatedImageUrl}
                    alt={`${ill.carMake} ${ill.carModel}`}
                    width={96}
                    height={96}
                    className="h-24 w-24 object-cover bg-carbon"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-lg text-white truncate">
                    {ill.carYear} {ill.carMake} {ill.carModel}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-none px-2 py-1 font-sub text-xs font-bold uppercase tracking-widest ${STATUS_COLORS[ill.status] ?? "bg-carbon text-muted"}`}
                  >
                    {ill.status}
                  </span>
                  {ill.notes && (
                    <p className="mt-2 font-body text-xs text-muted truncate">
                      {ill.notes}
                    </p>
                  )}
                  <p className="mt-1 font-body text-xs text-muted">
                    {new Date(ill.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
