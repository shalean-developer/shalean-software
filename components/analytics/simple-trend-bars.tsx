import type { DailyCount } from "@/lib/analytics/types";

const BAR_MAX_PX = 72;

export function SimpleTrendBars({
  series,
  caption,
}: {
  series: DailyCount[];
  caption: string;
}) {
  const max = Math.max(1, ...series.map((s) => s.count));

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{caption}</p>
      <div className="flex h-[5.5rem] items-end gap-1 overflow-x-auto pb-6">
        {series.map((s) => {
          const h = s.count === 0 ? 2 : Math.max(4, Math.round((s.count / max) * BAR_MAX_PX));
          return (
            <div key={s.date} className="flex min-w-[1.25rem] flex-1 flex-col items-center gap-1">
              <div
                className="w-full max-w-[14px] rounded-sm bg-zinc-800/85 dark:bg-zinc-200/80"
                style={{ height: `${h}px` }}
                title={`${s.date}: ${s.count}`}
              />
              <span className="whitespace-nowrap font-mono text-[9px] leading-none text-muted-foreground">
                {s.date.slice(8)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">UTC days · oldest → newest</p>
    </div>
  );
}
