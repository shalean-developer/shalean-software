import { getRegionTopology, isKnownRegion, type RegionTopology } from "@/lib/scale";

export type GlobalTopologySnapshot = {
  currentRegion: string | null;
  primaryRegion: string | null;
  allowedRegions: string[];
  knownCurrentRegion: boolean;
  canonicalRegionCount: number;
  summary: string;
};

export function normalizeGlobalTopology(topology: RegionTopology = getRegionTopology()): GlobalTopologySnapshot {
  const knownCurrentRegion = isKnownRegion(topology, topology.currentRegion);
  return {
    currentRegion: topology.currentRegion,
    primaryRegion: topology.primaryRegion,
    allowedRegions: topology.allowedRegions,
    knownCurrentRegion,
    canonicalRegionCount: topology.regions.length,
    summary: knownCurrentRegion
      ? "Current region participates in the canonical global topology."
      : "Current region is outside the canonical global topology and requires governance review.",
  };
}

export function explainRoutingDecision(input: {
  originRegion: string | null;
  targetRegion: string | null;
  primaryRegion: string | null;
  reason: string;
}): string[] {
  return [
    `Origin region: ${input.originRegion ?? "unknown"}.`,
    `Target region: ${input.targetRegion ?? "not selected"}.`,
    `Primary region: ${input.primaryRegion ?? "not configured"}.`,
    input.reason,
  ];
}
