import { computeScoreTrend } from "../lib/trendData";
import type { SessionRecord } from "../lib/types";

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: Math.random().toString(),
    date: "2026-04-01T12:00:00.000Z",
    exercise: "squat",
    reps: 5,
    topFlag: null,
    score: 80,
    ...overrides,
  };
}

describe("computeScoreTrend", () => {
  it("returns empty array for no sessions", () => {
    expect(computeScoreTrend([], null, 4)).toEqual([]);
  });

  it("groups sessions by day and averages scores", () => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const sessions = [
      makeSession({ date: `${today}T10:00:00.000Z`, score: 80 }),
      makeSession({ date: `${today}T14:00:00.000Z`, score: 60 }),
    ];
    const result = computeScoreTrend(sessions, null, 4);
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(70); // (80+60)/2
    expect(result[0].sessionCount).toBe(2);
  });

  it("filters by exercise when specified", () => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const sessions = [
      makeSession({ date: `${today}T10:00:00.000Z`, exercise: "squat", score: 90 }),
      makeSession({ date: `${today}T11:00:00.000Z`, exercise: "deadlift", score: 60 }),
    ];
    const result = computeScoreTrend(sessions, "squat", 4);
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(90);
  });

  it("returns all exercises when filter is null", () => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const sessions = [
      makeSession({ date: `${today}T10:00:00.000Z`, exercise: "squat", score: 90 }),
      makeSession({ date: `${today}T11:00:00.000Z`, exercise: "deadlift", score: 70 }),
    ];
    const result = computeScoreTrend(sessions, null, 4);
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(80); // (90+70)/2
  });

  it("excludes sessions older than weeksBack", () => {
    const old = new Date();
    old.setDate(old.getDate() - 35); // 5 weeks ago
    const recent = new Date();
    const sessions = [
      makeSession({ date: old.toISOString(), score: 50 }),
      makeSession({ date: recent.toISOString(), score: 90 }),
    ];
    const result = computeScoreTrend(sessions, null, 4);
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(90);
  });

  it("sorts results by date ascending", () => {
    const now = new Date();
    const day1 = new Date(now);
    day1.setDate(day1.getDate() - 2);
    const day2 = new Date(now);
    day2.setDate(day2.getDate() - 1);
    const sessions = [
      makeSession({ date: day2.toISOString(), score: 80 }),
      makeSession({ date: day1.toISOString(), score: 70 }),
    ];
    const result = computeScoreTrend(sessions, null, 4);
    expect(result).toHaveLength(2);
    expect(result[0].score).toBe(70); // older first
    expect(result[1].score).toBe(80);
  });

  it("rounds averaged scores", () => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const sessions = [
      makeSession({ date: `${today}T10:00:00.000Z`, score: 77 }),
      makeSession({ date: `${today}T11:00:00.000Z`, score: 78 }),
      makeSession({ date: `${today}T12:00:00.000Z`, score: 79 }),
    ];
    const result = computeScoreTrend(sessions, null, 4);
    expect(result[0].score).toBe(78); // (77+78+79)/3 = 78
  });
});
