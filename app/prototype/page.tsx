import type { Metadata } from "next";

import { PrototypeHubView } from "@/components/prototype-dashboard/prototype-hub-view";

export const metadata: Metadata = {
  title: "Prototype hub",
  description: "Shalean prototype dashboards and booking previews — mock data only.",
  robots: { index: false, follow: false },
};

export default function PrototypeHubPage() {
  return <PrototypeHubView />;
}
