import type { Metadata } from "next";

import { CleanerDashboardView } from "@/components/prototype-dashboard/cleaner-dashboard-view";

export const metadata: Metadata = {
  title: "Cleaner dashboard (prototype)",
  description: "Mock cleaner operational companion — schedules, visits, earnings, availability.",
  robots: { index: false, follow: false },
};

export default function PrototypeCleanerPage() {
  return <CleanerDashboardView />;
}
