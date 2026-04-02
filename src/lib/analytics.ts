/**
 * analytics.ts
 *
 * Thin wrapper around Sentry for event tracking.
 * All methods are no-ops if Sentry is not initialised (e.g., missing DSN).
 *
 * Tracked events:
 *   - session_start   — user begins a workout session
 *   - session_end     — user ends a workout session (with summary stats)
 *   - exercise_selected — user picks an exercise from the Home screen
 *
 * Privacy rules:
 *   - No camera frames, no video, no biometric data
 *   - No user identifiers beyond anonymous Sentry device ID
 */

import * as Sentry from "@sentry/react-native";
import type { Exercise } from "./types";

export function trackSessionStart(exercise: Exercise): void {
  Sentry.addBreadcrumb({
    category: "session",
    message: "session_start",
    data: { exercise },
    level: "info",
  });
}

export function trackSessionEnd(
  exercise: Exercise,
  reps: number,
  score: number
): void {
  Sentry.addBreadcrumb({
    category: "session",
    message: "session_end",
    data: { exercise, reps, score },
    level: "info",
  });
}

export function trackExerciseSelected(exercise: Exercise): void {
  Sentry.addBreadcrumb({
    category: "navigation",
    message: "exercise_selected",
    data: { exercise },
    level: "info",
  });
}
