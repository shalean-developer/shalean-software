import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CleanerJobsLoading() {
  return (
    <div className="mx-auto max-w-xl space-y-10 pb-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <div className="flex gap-3">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-9 w-44 max-w-full" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
      </div>
      {[1, 2].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="space-y-3 border-b border-border/60 px-4 py-4">
            <div className="flex justify-between gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-full max-w-xs" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-3 px-4 py-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
