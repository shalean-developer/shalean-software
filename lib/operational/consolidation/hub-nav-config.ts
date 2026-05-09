/**
 * Stage 18 — Single canonical map for dispatcher operational surfaces (drill-through continuity).
 */

export type OperationalHubSurface = "operations" | "monitoring" | "analytics" | "support" | "digest";

export type OperationalHubLink = {
  id: OperationalHubSurface;
  href: string;
  label: string;
};

export const OPERATIONAL_HUB_LINKS: readonly OperationalHubLink[] = [
  { id: "operations", href: "/admin/operations", label: "Operations" },
  { id: "monitoring", href: "/admin/monitoring", label: "Monitoring" },
  { id: "analytics", href: "/admin/analytics", label: "Analytics" },
  { id: "support", href: "/admin/support", label: "Support" },
  { id: "digest", href: "/admin/operations/digest", label: "Digest" },
] as const;
