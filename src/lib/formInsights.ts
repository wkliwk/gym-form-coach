import type { RepRecord } from "./types";

/**
 * Detect form fatigue: whether later reps have significantly more flags than early reps.
 * Returns a fatigue insight if the last 3 reps have notably more flags than the first 3.
 */
export function detectFatigue(
  repRecords: RepRecord[]
): { detected: boolean; message: string } {
  if (repRecords.length < 6) {
    return { detected: false, message: "" };
  }

  const first3 = repRecords.slice(0, 3);
  const last3 = repRecords.slice(-3);

  const first3Flags = first3.filter((r) => r.flag !== null).length;
  const last3Flags = last3.filter((r) => r.flag !== null).length;

  // Fatigue detected if last 3 reps have at least 2 more flags than first 3
  if (last3Flags - first3Flags >= 2) {
    return {
      detected: true,
      message:
        "Your form declined in later reps. Try reducing reps per set or taking longer rest.",
    };
  }

  return { detected: false, message: "" };
}

/**
 * Find the best and worst rep indices (by flag count — fewer flags = better).
 * Returns null indices if no meaningful difference exists.
 */
export function findBestWorstReps(
  repRecords: RepRecord[]
): { bestRep: number | null; worstRep: number | null } {
  if (repRecords.length === 0) return { bestRep: null, worstRep: null };

  // Best rep = first rep with no flag; worst rep = first rep with a flag
  let bestRep: number | null = null;
  let worstRep: number | null = null;

  for (const r of repRecords) {
    if (r.flag === null && bestRep === null) {
      bestRep = r.repNumber;
    }
    if (r.flag !== null && worstRep === null) {
      worstRep = r.repNumber;
    }
    if (bestRep !== null && worstRep !== null) break;
  }

  return { bestRep, worstRep };
}
