import { BookingDetailSkeleton } from "@/components/bookings/booking-skeletons";

export default function CustomerBookingDetailLoading() {
  return (
    <div className="mx-auto max-w-xl px-0 py-1">
      <BookingDetailSkeleton />
    </div>
  );
}

