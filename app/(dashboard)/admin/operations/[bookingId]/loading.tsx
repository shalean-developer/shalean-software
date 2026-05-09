import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBookingDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <div className="flex flex-col gap-3 border-b border-border/60 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-7 w-full max-w-md sm:h-8" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28 shrink-0 rounded-full" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/40">
          <div className="border-b border-border/60 p-6 pb-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-full max-w-sm" />
          </div>
          <div className="space-y-4 p-6 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/40">
          <div className="border-b border-border/60 p-6 pb-4">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-2 h-4 w-full max-w-xs" />
          </div>
          <div className="space-y-3 p-6 pt-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card/40">
        <div className="border-b border-border/60 p-6 pb-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="space-y-3 p-6 pt-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card/40">
        <div className="border-b border-border/60 p-6 pb-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="space-y-4 p-6 pt-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
