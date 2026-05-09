import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOperationsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-10">
      <div className="space-y-3 border-b border-border/60 pb-6">
        <Skeleton className="h-9 w-48 sm:h-10" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="rounded-xl border border-border/70 bg-card/40 p-5">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-6 h-24 w-full rounded-lg" />
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="space-y-3 lg:hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="hidden h-72 w-full rounded-xl lg:block" />
      </div>
    </div>
  );
}
