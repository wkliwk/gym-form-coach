import type { FormFlag } from "./types";

/**
 * Per-flag severity weights (0-1 scale).
 * Higher = more impactful on score.
 */
const FLAG_SEVERITY: Record<FormFlag, number> = {
  // Squat flags
  knees_caving: 0.85,
  depth_too_shallow: 0.7,
  forward_lean: 0.75,
  // Deadlift flags
  rounded_lower_back: 0.95,
  hips_rising_early: 0.7,
  bar_drift: 0.6,
  // Push-up flags
  hips_sagging: 0.75,
  elbows_flaring: 0.65,
  incomplete_range: 0.7,
  // Overhead press flags
  excessive_back_arch: 0.85,
  uneven_press: 0.6,
  incomplete_lockout: 0.55,
  // Bench press flags
  wrist_rollover: 0.8,
};

/**
 * Compute a numeric score (0-100) for a single rep based on detected flags.
 *
 * Scoring model:
 * - A clean rep starts at 97 (not 100 — accounts for pose estimation noise)
 * - Each flag deducts points proportional to its severity
 * - Multiple flags stack with diminishing returns (sqrt scaling)
 * - Minimum score is 5 (never truly zero — the rep was completed)
 */
export function computeRepScore(flags: FormFlag[]): number {
  if (flags.length === 0) {
    // Clean rep: 95-100 with small random variation
    return 97;
  }

  // Sum severity of all flags
  const totalSeverity = flags.reduce(
    (sum, flag) => sum + (FLAG_SEVERITY[flag] ?? 0.5),
    0
  );

  // Scale deduction: first flag hits hard, additional flags have diminishing returns
  // Using sqrt scaling: 1 flag at 0.8 severity → 0.8 deduction
  // 2 flags at 0.8 each → sqrt(1.6) ≈ 1.26 deduction (not 1.6)
  const scaledDeduction = Math.sqrt(totalSeverity);

  // Map to 0-100: max deduction caps at ~92 points
  const maxDeduction = 92;
  const deduction = Math.min(maxDeduction, scaledDeduction * 55);

  return Math.round(Math.max(5, 97 - deduction));
}

/**
 * Compute average score across multiple reps.
 * Returns 0 if no reps.
 */
export function computeAverageScore(repScores: number[]): number {
  if (repScores.length === 0) return 0;
  const sum = repScores.reduce((a, b) => a + b, 0);
  return Math.round(sum / repScores.length);
}
