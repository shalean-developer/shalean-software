import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-0 py-1">
      <div className="space-y-3">
        <Skeleton className="h-9 w-56 max-w-full sm:h-10" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-11 w-full rounded-lg sm:w-44" />
        <Skeleton className="h-11 w-full rounded-lg sm:w-40" />
      </div>
      <div className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
      <div className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}
