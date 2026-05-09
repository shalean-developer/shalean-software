import { BookingCardSkeleton } from "@/components/bookings/booking-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookingsIndexLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-10 px-0">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-52 max-w-full sm:h-10" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <BookingCardSkeleton />
        <BookingCardSkeleton />
      </div>
      <Skeleton className="mx-auto h-11 w-full max-w-xs rounded-lg" />
    </div>
  );
}
