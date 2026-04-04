import type { SessionRecord } from "./types";

export type ExportFormat = "csv" | "json";

/**
 * Convert sessions to CSV string.
 * One row per set (or one row per session if no sets).
 */
export function sessionsToCSV(sessions: SessionRecord[]): string {
  const header = "date,exercise,set,reps,score,topFlag";
  const rows: string[] = [header];

  for (const s of sessions) {
    const date = s.date.slice(0, 10);
    if (s.sets && s.sets.length > 0) {
      for (const set of s.sets) {
        rows.push(
          `${date},${s.exercise},${set.setNumber},${set.reps},${set.score},${set.topFlag ?? ""}`
        );
      }
    } else {
      rows.push(
        `${date},${s.exercise},1,${s.reps},${s.score},${s.topFlag ?? ""}`
      );
    }
  }

  return rows.join("\n");
}

/**
 * Convert sessions to pretty-printed JSON string.
 */
export function sessionsToJSON(sessions: SessionRecord[]): string {
  return JSON.stringify(sessions, null, 2);
}

/**
 * Generate a filename with today's date.
 */
export function getExportFilename(format: ExportFormat): string {
  const date = new Date().toISOString().slice(0, 10);
  return `gym-form-coach-export-${date}.${format === "csv" ? "csv" : "json"}`;
}
