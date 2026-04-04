import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Exercise, ExercisePreferences, SessionRecord } from "./types";
import { DEFAULT_PREFERENCES } from "./types";

const STORAGE_KEY = "@gym_form_coach/sessions";
const PREFS_KEY = "@gym_form_coach/exercise_preferences";
const MAX_SESSIONS = 50;

export async function saveSessions(
  sessions: SessionRecord[]
): Promise<void> {
  const trimmed = sessions.slice(0, MAX_SESSIONS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export async function loadSessions(): Promise<SessionRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SessionRecord[];
  } catch {
    return [];
  }
}

export async function addSession(session: SessionRecord): Promise<void> {
  const sessions = await loadSessions();
  sessions.unshift(session);
  await saveSessions(sessions);
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await loadSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export async function clearAllSessions(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function findPreviousSession(
  sessions: SessionRecord[],
  exercise: string,
  currentId: string
): SessionRecord | null {
  return (
    sessions.find((s) => s.exercise === exercise && s.id !== currentId) ?? null
  );
}

/** Return the best form score + date for each exercise. */
export function getPersonalBests(
  sessions: SessionRecord[]
): Partial<Record<Exercise, { score: number; date: string }>> {
  const bests: Partial<Record<Exercise, { score: number; date: string }>> = {};
  for (const s of sessions) {
    const current = bests[s.exercise];
    if (!current || s.score > current.score) {
      bests[s.exercise] = { score: s.score, date: s.date };
    }
  }
  return bests;
}

/** Count consecutive calendar days with at least 1 session, and best streak ever. */
export function getWorkoutStreak(
  sessions: SessionRecord[]
): { current: number; best: number } {
  if (sessions.length === 0) return { current: 0, best: 0 };

  // Get unique dates (YYYY-MM-DD), sorted descending
  const uniqueDays = [
    ...new Set(sessions.map((s) => s.date.slice(0, 10))),
  ].sort((a, b) => (a > b ? -1 : 1));

  if (uniqueDays.length === 0) return { current: 0, best: 0 };

  let current = 1;
  let best = 1;
  let streak = 1;

  // Check if the most recent session day is today or yesterday (streak is still active)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mostRecent = new Date(uniqueDays[0] + "T00:00:00");
  const daysSinceLast = Math.round(
    (today.getTime() - mostRecent.getTime()) / 86400000
  );

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1] + "T00:00:00");
    const curr = new Date(uniqueDays[i] + "T00:00:00");
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 1) {
      streak++;
    } else {
      if (streak > best) best = streak;
      streak = 1;
    }
  }
  if (streak > best) best = streak;

  // Current streak: only count if most recent day is today or yesterday
  if (daysSinceLast <= 1) {
    // Walk from the start to find the current streak length
    current = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1] + "T00:00:00");
      const curr = new Date(uniqueDays[i] + "T00:00:00");
      const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
      if (diff === 1) {
        current++;
      } else {
        break;
      }
    }
  } else {
    current = 0;
  }

  return { current, best };
}

/** Total reps across all sessions. */
export function getTotalReps(sessions: SessionRecord[]): number {
  return sessions.reduce((sum, s) => sum + s.reps, 0);
}

/** Score trend: compare to previous session of same exercise. Returns 1 (up), -1 (down), or 0 (same/first). */
export function getScoreTrend(
  sessions: SessionRecord[],
  session: SessionRecord
): number {
  const prev = findPreviousSession(sessions, session.exercise, session.id);
  if (!prev) return 0;
  if (session.score > prev.score) return 1;
  if (session.score < prev.score) return -1;
  return 0;
}

// ── Exercise Preferences ──────────────────────────────────────────────────

export async function loadAllPreferences(): Promise<
  Partial<Record<Exercise, ExercisePreferences>>
> {
  const raw = await AsyncStorage.getItem(PREFS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<Record<Exercise, ExercisePreferences>>;
  } catch {
    return {};
  }
}

export async function loadPreferences(
  exercise: Exercise
): Promise<ExercisePreferences> {
  const all = await loadAllPreferences();
  return all[exercise] ?? { ...DEFAULT_PREFERENCES };
}

export async function savePreferences(
  exercise: Exercise,
  prefs: ExercisePreferences
): Promise<void> {
  const all = await loadAllPreferences();
  all[exercise] = prefs;
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(all));
}
