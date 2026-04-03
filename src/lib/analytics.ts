/**
 * analytics.ts
 *
 * Event tracking stubs. Sentry integration deferred until native build is stable.
 * All methods are no-ops for now — they log to console in dev mode only.
 */

import type { Exercise } from "./types";

export function trackSessionStart(exercise: Exercise): void {
  if (__DEV__) console.log("[analytics] session_start:", exercise);
}

export function trackSessionEnd(
  exercise: Exercise,
  reps: number,
  score: number
): void {
  if (__DEV__) console.log("[analytics] session_end:", exercise, reps, score);
}

export function trackExerciseSelected(exercise: Exercise): void {
  if (__DEV__) console.log("[analytics] exercise_selected:", exercise);
}
