"use client";

import { useEffect, useState } from "react";

import { BookingPrototypeFlow } from "@/components/booking-prototype/booking-prototype-flow";

/**
 * Mounts the flow on the client after hydration so extensions that inject attributes
 * on buttons cannot mismatch SSR HTML. Fonts + `.booking-flow-brand` come from
 * `app/prototype/layout.tsx` (`PrototypeRealmLayout`).
 */
export function BookingPrototypePageClient({ supportEmail }: { supportEmail: string | null }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[13px] text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <BookingPrototypeFlow supportEmail={supportEmail} />;
}
