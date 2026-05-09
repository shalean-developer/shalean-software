import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CleanerBookingDetailLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Skeleton className="h-6 w-40" />
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
