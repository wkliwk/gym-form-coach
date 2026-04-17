import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SessionRecord } from "./types";
import { getWorkoutStreak, getTotalReps } from "./sessionStorage";

const BADGES_KEY = "@gym_form_coach/badges";

export type BadgeCategory = "consistency" | "volume" | "form";

export interface BadgeDefinition {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: BadgeCategory;
  /** Returns true if the badge is now earned given all sessions + latest session. */
  check: (sessions: SessionRecord[], latest: SessionRecord) => boolean;
}

export interface EarnedBadge {
  id: string;
  unlockedAt: string; // ISO date string
}

export const BADGES: BadgeDefinition[] = [
  // ── Consistency ──────────────────────────────────────────────────────────
  {
    id: "first_rep",
    emoji: "🎯",
    name: "First Rep",
    description: "Complete your first ever session",
    category: "consistency",
    check: (sessions) => sessions.length >= 1,
  },
  {
    id: "three_peat",
    emoji: "🔥",
    name: "Three-Peat",
    description: "Achieve a 3-day workout streak",
    category: "consistency",
    check: (sessions) => getWorkoutStreak(sessions).current >= 3,
  },
  {
    id: "week_warrior",
    emoji: "⚡",
    name: "Week Warrior",
    description: "Achieve a 7-day workout streak",
    category: "consistency",
    check: (sessions) => getWorkoutStreak(sessions).current >= 7,
  },
  {
    id: "iron_habit",
    emoji: "🏆",
    name: "Iron Habit",
    description: "Achieve a 30-day workout streak",
    category: "consistency",
    check: (sessions) => getWorkoutStreak(sessions).current >= 30,
  },

  // ── Volume ───────────────────────────────────────────────────────────────
  {
    id: "century",
    emoji: "💯",
    name: "Century",
    description: "Log 100 total reps",
    category: "volume",
    check: (sessions) => getTotalReps(sessions) >= 100,
  },
  {
    id: "grinder",
    emoji: "⚙️",
    name: "Grinder",
    description: "Log 1,000 total reps",
    category: "volume",
    check: (sessions) => getTotalReps(sessions) >= 1000,
  },
  {
    id: "five_sets",
    emoji: "💪",
    name: "Five Sets",
    description: "Complete a session with 5 or more sets",
    category: "volume",
    check: (_sessions, latest) =>
      (latest.sets?.length ?? 0) >= 5,
  },

  // ── Form Quality ─────────────────────────────────────────────────────────
  {
    id: "clean_sheet",
    emoji: "✨",
    name: "Clean Sheet",
    description: "Complete a session with zero form flags",
    category: "form",
    check: (_sessions, latest) => latest.topFlag === null,
  },
  {
    id: "form_check",
    emoji: "🎖️",
    name: "Form Check",
    description: "Achieve a form score of 90 or higher",
    category: "form",
    check: (_sessions, latest) => latest.score >= 90,
  },
  {
    id: "all_rounder",
    emoji: "🌟",
    name: "All-Rounder",
    description: "Complete sessions in 3 different exercises",
    category: "form",
    check: (sessions) => {
      const exercises = new Set(sessions.map((s) => s.exercise));
      return exercises.size >= 3;
    },
  },
  {
    id: "perfect_week",
    emoji: "👑",
    name: "Perfect Week",
    description: "3+ sessions in a week, all with average score ≥ 80",
    category: "form",
    check: (sessions) => {
      // Group sessions by ISO week (Mon–Sun)
      const byWeek = new Map<string, SessionRecord[]>();
      for (const s of sessions) {
        const d = new Date(s.date.slice(0, 10) + "T00:00:00");
        const day = d.getDay(); // 0=Sun
        const daysFromMon = (day + 6) % 7;
        d.setDate(d.getDate() - daysFromMon);
        const weekKey = d.toISOString().slice(0, 10);
        const list = byWeek.get(weekKey) ?? [];
        list.push(s);
        byWeek.set(weekKey, list);
      }
      for (const weekSessions of byWeek.values()) {
        if (
          weekSessions.length >= 3 &&
          weekSessions.every((s) => s.score >= 80)
        ) {
          return true;
        }
      }
      return false;
    },
  },
  {
    id: "personal_best",
    emoji: "🥇",
    name: "Personal Best",
    description: "Hit a new personal best in any exercise",
    category: "form",
    check: (sessions, latest) => {
      // Find if any earlier session for the same exercise has a lower score
      const prev = sessions.filter(
        (s) => s.exercise === latest.exercise && s.id !== latest.id
      );
      if (prev.length === 0) return false; // first session for this exercise, not a "new" best
      const prevBest = Math.max(...prev.map((s) => s.score));
      return latest.score > prevBest;
    },
  },
];

// ── Persistence ──────────────────────────────────────────────────────────────

export async function loadEarnedBadges(): Promise<EarnedBadge[]> {
  const raw = await AsyncStorage.getItem(BADGES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as EarnedBadge[];
  } catch {
    return [];
  }
}

export async function saveEarnedBadges(
  badges: EarnedBadge[]
): Promise<void> {
  await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(badges));
}

/**
 * Check all badges against the current sessions + latest session.
 * Returns the list of newly unlocked badges (not previously earned).
 * Persists the updated earned set to AsyncStorage.
 */
export async function checkAndAwardBadges(
  sessions: SessionRecord[],
  latest: SessionRecord
): Promise<BadgeDefinition[]> {
  const earned = await loadEarnedBadges();
  const earnedIds = new Set(earned.map((b) => b.id));
  const newlyEarned: EarnedBadge[] = [];
  const newlyEarnedDefs: BadgeDefinition[] = [];

  for (const badge of BADGES) {
    if (earnedIds.has(badge.id)) continue; // already earned
    if (badge.check(sessions, latest)) {
      const entry: EarnedBadge = {
        id: badge.id,
        unlockedAt: new Date().toISOString(),
      };
      newlyEarned.push(entry);
      newlyEarnedDefs.push(badge);
    }
  }

  if (newlyEarned.length > 0) {
    await saveEarnedBadges([...earned, ...newlyEarned]);
  }

  return newlyEarnedDefs;
}
