import type { Metadata } from "next";

import { CustomerDashboardView } from "@/components/prototype-dashboard/customer-dashboard-view";

export const metadata: Metadata = {
  title: "Customer dashboard (prototype)",
  description: "Mock customer lifecycle dashboard — Shalean prototype.",
  robots: { index: false, follow: false },
};

export default function PrototypeCustomerPage() {
  return <CustomerDashboardView />;
}
