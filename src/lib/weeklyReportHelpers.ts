import type { Exercise, FormFlag, SessionRecord } from "./types";
import { DRILL_SUGGESTIONS, FLAG_LABELS } from "./types";

export interface WeeklyReportData {
  sessionCount: number;
  exercises: Exercise[];
  avgScore: number;
  prevWeekAvgScore: number | null;
  topFlag: { flag: FormFlag; label: string; drill: string } | null;
  newPersonalBests: { exercise: Exercise; score: number }[];
  dailyScores: { day: string; avgScore: number }[];
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

function isInRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr);
  return d >= start && d < end;
}

/**
 * Compute weekly report data from session history.
 */
export function computeWeeklyReport(
  sessions: SessionRecord[],
  allSessions?: SessionRecord[]
): WeeklyReportData {
  const now = new Date();
  const weekStart = daysAgo(7);
  const prevWeekStart = daysAgo(14);
  const weekEnd = startOfDay(now);
  weekEnd.setDate(weekEnd.getDate() + 1); // include today

  // This week's sessions
  const thisWeek = sessions.filter((s) => isInRange(s.date, weekStart, weekEnd));
  const prevWeek = sessions.filter((s) =>
    isInRange(s.date, prevWeekStart, weekStart)
  );

  // Session count and exercises
  const exercises = [...new Set(thisWeek.map((s) => s.exercise))];

  // Average score
  const avgScore =
    thisWeek.length > 0
      ? Math.round(
          thisWeek.reduce((sum, s) => sum + s.score, 0) / thisWeek.length
        )
      : 0;

  const prevWeekAvgScore =
    prevWeek.length > 0
      ? Math.round(
          prevWeek.reduce((sum, s) => sum + s.score, 0) / prevWeek.length
        )
      : null;

  // Top flag
  const flagCounts: Partial<Record<FormFlag, number>> = {};
  for (const s of thisWeek) {
    if (s.topFlag) {
      flagCounts[s.topFlag] = (flagCounts[s.topFlag] ?? 0) + 1;
    }
  }
  let topFlag: WeeklyReportData["topFlag"] = null;
  let maxFlagCount = 0;
  for (const [flag, count] of Object.entries(flagCounts)) {
    if (count! > maxFlagCount) {
      maxFlagCount = count!;
      const f = flag as FormFlag;
      topFlag = {
        flag: f,
        label: FLAG_LABELS[f],
        drill: DRILL_SUGGESTIONS[f],
      };
    }
  }

  // New personal bests — check if any session this week has the highest score for its exercise
  const all = allSessions ?? sessions;
  const newPersonalBests: WeeklyReportData["newPersonalBests"] = [];
  for (const ex of exercises) {
    const bestThisWeek = Math.max(
      ...thisWeek.filter((s) => s.exercise === ex).map((s) => s.score)
    );
    const bestAllTime = Math.max(
      ...all.filter((s) => s.exercise === ex).map((s) => s.score)
    );
    if (bestThisWeek >= bestAllTime && bestThisWeek > 0) {
      newPersonalBests.push({ exercise: ex, score: bestThisWeek });
    }
  }

  // Daily scores for past 7 days
  const dailyScores: WeeklyReportData["dailyScores"] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = daysAgo(i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const daySessions = thisWeek.filter((s) =>
      isInRange(s.date, dayStart, dayEnd)
    );
    const dayLabel = dayStart.toLocaleDateString(undefined, { weekday: "short" });

    if (daySessions.length > 0) {
      const avg = Math.round(
        daySessions.reduce((sum, s) => sum + s.score, 0) / daySessions.length
      );
      dailyScores.push({ day: dayLabel, avgScore: avg });
    } else {
      dailyScores.push({ day: dayLabel, avgScore: 0 });
    }
  }

  return {
    sessionCount: thisWeek.length,
    exercises,
    avgScore,
    prevWeekAvgScore,
    topFlag,
    newPersonalBests,
    dailyScores,
  };
}
