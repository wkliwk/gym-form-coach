import type { SessionRecord } from "../lib/types";
import { computeWeeklyReport } from "../lib/weeklyReportHelpers";

function makeSession(
  daysAgo: number,
  overrides: Partial<SessionRecord> = {}
): SessionRecord {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id: `session-${daysAgo}-${Math.random()}`,
    date: d.toISOString(),
    exercise: "squat",
    reps: 8,
    topFlag: null,
    score: 80,
    ...overrides,
  };
}

describe("computeWeeklyReport", () => {
  it("returns zero for empty sessions", () => {
    const report = computeWeeklyReport([]);
    expect(report.sessionCount).toBe(0);
    expect(report.avgScore).toBe(0);
    expect(report.exercises).toEqual([]);
  });

  it("counts sessions from the past 7 days only", () => {
    const sessions = [
      makeSession(1), // this week
      makeSession(3), // this week
      makeSession(10), // too old
    ];
    const report = computeWeeklyReport(sessions);
    expect(report.sessionCount).toBe(2);
  });

  it("computes average score correctly", () => {
    const sessions = [
      makeSession(1, { score: 90 }),
      makeSession(2, { score: 70 }),
    ];
    const report = computeWeeklyReport(sessions);
    expect(report.avgScore).toBe(80);
  });

  it("identifies top flag", () => {
    const sessions = [
      makeSession(1, { topFlag: "knees_caving" }),
      makeSession(2, { topFlag: "knees_caving" }),
      makeSession(3, { topFlag: "forward_lean" }),
    ];
    const report = computeWeeklyReport(sessions);
    expect(report.topFlag?.flag).toBe("knees_caving");
    expect(report.topFlag?.drill).toBeTruthy();
  });

  it("computes week-over-week comparison", () => {
    const sessions = [
      makeSession(1, { score: 90 }), // this week
      makeSession(10, { score: 70 }), // last week
    ];
    const report = computeWeeklyReport(sessions);
    expect(report.avgScore).toBe(90);
    expect(report.prevWeekAvgScore).toBe(70);
  });

  it("generates daily scores for 7 days", () => {
    const report = computeWeeklyReport([makeSession(1, { score: 85 })]);
    expect(report.dailyScores).toHaveLength(7);
    // At least one day should have a non-zero score
    const nonZero = report.dailyScores.filter((d) => d.avgScore > 0);
    expect(nonZero.length).toBeGreaterThanOrEqual(1);
  });
});
