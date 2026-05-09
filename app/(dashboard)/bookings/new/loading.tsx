import { Skeleton } from "@/components/ui/skeleton";

export default function NewBookingLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-full max-w-xs rounded-full" />
        <Skeleton className="h-9 w-72 max-w-full sm:h-10" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
        <div className="mt-8 hidden lg:mt-0 lg:block">
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
