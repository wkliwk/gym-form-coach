import type { Exercise, SessionRecord } from "./types";

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  score: number;
  sessionCount: number;
}

/**
 * Compute daily average form scores for the given sessions.
 * Returns points sorted ascending by date.
 */
export function computeScoreTrend(
  sessions: SessionRecord[],
  exercise: Exercise | null,
  weeksBack: number
): TrendPoint[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeksBack * 7);
  cutoff.setHours(0, 0, 0, 0);

  const filtered = sessions.filter((s) => {
    if (exercise && s.exercise !== exercise) return false;
    return new Date(s.date) >= cutoff;
  });

  // Group by day
  const byDay = new Map<string, { total: number; count: number }>();
  for (const s of filtered) {
    const day = s.date.slice(0, 10);
    const existing = byDay.get(day);
    if (existing) {
      existing.total += s.score;
      existing.count += 1;
    } else {
      byDay.set(day, { total: s.score, count: 1 });
    }
  }

  // Convert to sorted array
  return Array.from(byDay.entries())
    .map(([date, { total, count }]) => ({
      date,
      score: Math.round(total / count),
      sessionCount: count,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}
