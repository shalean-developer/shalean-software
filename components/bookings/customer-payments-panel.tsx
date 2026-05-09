import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CustomerPaymentListRow } from "@/lib/bookings/customer-flow";

import { PaymentStatusBadge } from "./status-badge";

function formatStarted(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function CustomerPaymentsPanel({ payments }: { payments: CustomerPaymentListRow[] }) {
  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-5 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">No payment attempts yet</p>
        <p className="mt-2">
          After you start checkout, each secure attempt appears here so you can see what succeeded or needs a retry.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {payments.map((p) => (
          <li
            key={p.id}
            className="rounded-xl border border-border/80 bg-card/50 px-4 py-3 text-sm shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <PaymentStatusBadge status={p.status} customerFacing />
              <span className="text-right font-semibold">
                {(p.amount_cents / 100).toLocaleString()} {p.currency}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {p.provider} · {formatStarted(p.created_at)}
            </p>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-md border border-border/80 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="hidden sm:table-cell">Provider</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Started</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <PaymentStatusBadge status={p.status} customerFacing />
                </TableCell>
                <TableCell className="hidden text-xs sm:table-cell">{p.provider}</TableCell>
                <TableCell className="text-right text-xs font-medium">
                  {(p.amount_cents / 100).toLocaleString()} {p.currency}
                </TableCell>
                <TableCell className="hidden text-right text-xs text-muted-foreground lg:table-cell">
                  {formatStarted(p.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
