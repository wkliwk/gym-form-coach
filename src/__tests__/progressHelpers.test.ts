import type { SessionRecord } from "../lib/types";
import {
  getPersonalBests,
  getWorkoutStreak,
  getTotalReps,
  getScoreTrend,
} from "../lib/sessionStorage";

function makeSession(
  overrides: Partial<SessionRecord> & { id: string }
): SessionRecord {
  return {
    date: "2026-04-01T10:00:00.000Z",
    exercise: "squat",
    reps: 10,
    topFlag: null,
    score: 80,
    ...overrides,
  };
}

describe("getPersonalBests", () => {
  it("returns empty for no sessions", () => {
    expect(getPersonalBests([])).toEqual({});
  });

  it("returns best score per exercise", () => {
    const sessions: SessionRecord[] = [
      makeSession({ id: "1", exercise: "squat", score: 70, date: "2026-04-01T10:00:00Z" }),
      makeSession({ id: "2", exercise: "squat", score: 90, date: "2026-04-02T10:00:00Z" }),
      makeSession({ id: "3", exercise: "deadlift", score: 85, date: "2026-04-01T10:00:00Z" }),
    ];
    const bests = getPersonalBests(sessions);
    expect(bests.squat).toEqual({ score: 90, date: "2026-04-02T10:00:00Z" });
    expect(bests.deadlift).toEqual({ score: 85, date: "2026-04-01T10:00:00Z" });
    expect(bests.pushup).toBeUndefined();
  });
});

describe("getWorkoutStreak", () => {
  it("returns zero for no sessions", () => {
    expect(getWorkoutStreak([])).toEqual({ current: 0, best: 0 });
  });

  it("counts consecutive days", () => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const sessions: SessionRecord[] = [
      makeSession({ id: "1", date: fmt(today) }),
      makeSession({ id: "2", date: fmt(yesterday) }),
      makeSession({ id: "3", date: fmt(twoDaysAgo) }),
    ];
    const streak = getWorkoutStreak(sessions);
    expect(streak.current).toBe(3);
    expect(streak.best).toBe(3);
  });

  it("treats multiple sessions on same day as 1 day", () => {
    const today = new Date();
    const sessions: SessionRecord[] = [
      makeSession({ id: "1", date: today.toISOString() }),
      makeSession({ id: "2", date: today.toISOString() }),
    ];
    const streak = getWorkoutStreak(sessions);
    expect(streak.current).toBe(1);
    expect(streak.best).toBe(1);
  });

  it("resets current streak if last session was >1 day ago", () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const sessions: SessionRecord[] = [
      makeSession({ id: "1", date: threeDaysAgo.toISOString() }),
      makeSession({ id: "2", date: fourDaysAgo.toISOString() }),
    ];
    const streak = getWorkoutStreak(sessions);
    expect(streak.current).toBe(0);
    expect(streak.best).toBe(2);
  });
});

describe("getTotalReps", () => {
  it("returns 0 for empty", () => {
    expect(getTotalReps([])).toBe(0);
  });

  it("sums reps across sessions", () => {
    const sessions: SessionRecord[] = [
      makeSession({ id: "1", reps: 10 }),
      makeSession({ id: "2", reps: 15 }),
      makeSession({ id: "3", reps: 8 }),
    ];
    expect(getTotalReps(sessions)).toBe(33);
  });
});

describe("getScoreTrend", () => {
  it("returns 0 for first session of exercise", () => {
    const session = makeSession({ id: "1", exercise: "squat", score: 80 });
    expect(getScoreTrend([session], session)).toBe(0);
  });

  it("returns 1 when score improved", () => {
    const sessions: SessionRecord[] = [
      makeSession({ id: "2", exercise: "squat", score: 90 }),
      makeSession({ id: "1", exercise: "squat", score: 80 }),
    ];
    expect(getScoreTrend(sessions, sessions[0])).toBe(1);
  });

  it("returns -1 when score declined", () => {
    const sessions: SessionRecord[] = [
      makeSession({ id: "2", exercise: "squat", score: 70 }),
      makeSession({ id: "1", exercise: "squat", score: 80 }),
    ];
    expect(getScoreTrend(sessions, sessions[0])).toBe(-1);
  });

  it("returns 0 when score is same", () => {
    const sessions: SessionRecord[] = [
      makeSession({ id: "2", exercise: "squat", score: 80 }),
      makeSession({ id: "1", exercise: "squat", score: 80 }),
    ];
    expect(getScoreTrend(sessions, sessions[0])).toBe(0);
  });
});
