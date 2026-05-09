export type ScaleRegionRole = "primary" | "read_replica" | "edge" | "worker";

export type RuntimeRegion = {
  code: string;
  role: ScaleRegionRole;
  provider: "vercel" | "supabase" | "external";
  latencyBudgetMs: number;
};

export type RegionTopology = {
  currentRegion: string | null;
  primaryRegion: string | null;
  allowedRegions: string[];
  regions: RuntimeRegion[];
};

function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getRegionTopology(): RegionTopology {
  const currentRegion = process.env.VERCEL_REGION?.trim() || null;
  const primaryRegion = process.env.SCALE_PRIMARY_REGION?.trim() || null;
  const allowedRegions = parseList(process.env.SCALE_ALLOWED_REGIONS);
  const regionCodes = Array.from(
    new Set([primaryRegion, currentRegion, ...allowedRegions].filter((item): item is string => Boolean(item))),
  );

  return {
    currentRegion,
    primaryRegion,
    allowedRegions,
    regions: regionCodes.map((code) => ({
      code,
      role: code === primaryRegion ? "primary" : "edge",
      provider: "vercel",
      latencyBudgetMs: Number.parseInt(process.env.SCALE_REGION_LATENCY_BUDGET_MS ?? "350", 10),
    })),
  };
}

export function isKnownRegion(topology: RegionTopology, region: string | null): boolean {
  if (!region) return false;
  if (topology.allowedRegions.length === 0) return true;
  return topology.allowedRegions.includes(region) || topology.primaryRegion === region;
}
