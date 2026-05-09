import type { Metadata } from "next";

import { AdminDashboardView } from "@/components/prototype-dashboard/admin-dashboard-view";

export const metadata: Metadata = {
  title: "Admin dashboard (prototype)",
  description: "Operations control center prototype — bookings, dispatch, cleaners, customers, earnings, insights.",
  robots: { index: false, follow: false },
};

export default function PrototypeAdminPage() {
  return <AdminDashboardView />;
}
