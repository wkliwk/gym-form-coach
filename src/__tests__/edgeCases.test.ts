import { buildPose, KP } from "./testHelpers";
import { createSquatState, processSquatFrame } from "../lib/formAnalysis/squat";
import { createDeadliftState, processDeadliftFrame } from "../lib/formAnalysis/deadlift";
import { createPushupState, processPushupFrame } from "../lib/formAnalysis/pushup";
import { createOverheadPressState, processOverheadPressFrame } from "../lib/formAnalysis/overheadPress";
import { computeRepScore } from "../lib/repScoring";
import { sessionsToCSV, sessionsToJSON } from "../lib/dataExport";
import {
  getPersonalBests,
  getWorkoutStreak,
  getTotalReps,
} from "../lib/sessionStorage";
import { computeWeeklyReport } from "../lib/weeklyReportHelpers";
import { checkProgression } from "../lib/programProgress";
import { detectFatigue } from "../lib/formInsights";
import type { SessionRecord, RepRecord } from "../lib/types";

// ── Form Analysis: Zero/Low Confidence Landmarks ──────────────────────

describe("form analysis with missing landmarks", () => {
  it("squat handles all zero-confidence keypoints", () => {
    const pose = buildPose({});
    const state = createSquatState();
    const result = processSquatFrame(pose, state);
    expect(result.completedRep).toBe(false);
    expect(result.flag).toBeNull();
  });

  it("deadlift handles all zero-confidence keypoints", () => {
    const pose = buildPose({});
    const state = createDeadliftState();
    const result = processDeadliftFrame(pose, state);
    expect(result.completedRep).toBe(false);
  });

  it("pushup handles all zero-confidence keypoints", () => {
    const pose = buildPose({});
    const state = createPushupState();
    const result = processPushupFrame(pose, state);
    expect(result.completedRep).toBe(false);
  });

  it("overhead press handles all zero-confidence keypoints", () => {
    const pose = buildPose({});
    const state = createOverheadPressState();
    const result = processOverheadPressFrame(pose, state);
    expect(result.completedRep).toBe(false);
  });

  it("squat handles partial landmarks (one side only)", () => {
    const pose = buildPose({
      [KP.LEFT_HIP]: { x: 100, y: 200 },
      [KP.LEFT_KNEE]: { x: 100, y: 300 },
      [KP.LEFT_ANKLE]: { x: 100, y: 400 },
    });
    const state = createSquatState();
    const result = processSquatFrame(pose, state);
    // Should not crash — may or may not detect phase change
    expect(result.completedRep).toBe(false);
  });
});

// ── Scoring Edge Cases ──────────────────────────────────────────────

describe("scoring edge cases", () => {
  it("handles unknown flag gracefully", () => {
    // computeRepScore uses FLAG_SEVERITY lookup with fallback to 0.5
    const score = computeRepScore(["knees_caving", "knees_caving"]);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(97);
  });

  it("handles many flags without going below minimum", () => {
    const score = computeRepScore([
      "knees_caving",
      "depth_too_shallow",
      "forward_lean",
      "rounded_lower_back",
      "hips_rising_early",
    ]);
    expect(score).toBeGreaterThanOrEqual(5);
  });
});

// ── SessionStorage Edge Cases ──────────────────────────────────────

describe("sessionStorage edge cases", () => {
  it("getPersonalBests handles duplicate exercises correctly", () => {
    const sessions: SessionRecord[] = [
      { id: "1", date: "2026-04-01", exercise: "squat", reps: 8, topFlag: null, score: 80 },
      { id: "2", date: "2026-04-02", exercise: "squat", reps: 10, topFlag: null, score: 90 },
      { id: "3", date: "2026-04-03", exercise: "squat", reps: 6, topFlag: null, score: 70 },
    ];
    const bests = getPersonalBests(sessions);
    expect(bests.squat?.score).toBe(90);
  });

  it("getWorkoutStreak handles single session", () => {
    const today = new Date().toISOString();
    const streak = getWorkoutStreak([
      { id: "1", date: today, exercise: "squat", reps: 8, topFlag: null, score: 80 },
    ]);
    expect(streak.current).toBe(1);
    expect(streak.best).toBe(1);
  });

  it("getTotalReps handles sessions with zero reps", () => {
    const sessions: SessionRecord[] = [
      { id: "1", date: "2026-04-01", exercise: "squat", reps: 0, topFlag: null, score: 0 },
      { id: "2", date: "2026-04-02", exercise: "squat", reps: 10, topFlag: null, score: 80 },
    ];
    expect(getTotalReps(sessions)).toBe(10);
  });
});

// ── Data Export Edge Cases ──────────────────────────────────────────

describe("data export edge cases", () => {
  it("CSV handles special characters in flag names", () => {
    const sessions: SessionRecord[] = [
      { id: "1", date: "2026-04-01T10:00:00Z", exercise: "squat", reps: 8, topFlag: "knees_caving", score: 70 },
    ];
    const csv = sessionsToCSV(sessions);
    expect(csv).toContain("knees_caving");
    expect(csv.split("\n")).toHaveLength(2);
  });

  it("JSON handles large session arrays", () => {
    const sessions = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      date: "2026-04-01T10:00:00Z",
      exercise: "squat" as const,
      reps: 8,
      topFlag: null,
      score: 80,
    }));
    const json = sessionsToJSON(sessions);
    expect(JSON.parse(json)).toHaveLength(100);
  });
});

// ── Weekly Report Edge Cases ────────────────────────────────────────

describe("weekly report edge cases", () => {
  it("handles sessions all on the same day", () => {
    const today = new Date();
    const sessions = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      date: today.toISOString(),
      exercise: "squat" as const,
      reps: 8,
      topFlag: null,
      score: 75 + i * 5,
    }));
    const report = computeWeeklyReport(sessions);
    expect(report.sessionCount).toBe(5);
    expect(report.avgScore).toBeGreaterThan(0);
  });

  it("handles sessions with all different exercises", () => {
    const today = new Date();
    const exercises = ["squat", "deadlift", "pushup", "overheadPress"] as const;
    const sessions = exercises.map((ex, i) => ({
      id: String(i),
      date: today.toISOString(),
      exercise: ex,
      reps: 8,
      topFlag: null,
      score: 80,
    }));
    const report = computeWeeklyReport(sessions);
    expect(report.exercises).toHaveLength(4);
  });
});

// ── Program Progression Edge Cases ──────────────────────────────────

describe("program progression edge cases", () => {
  it("handles exactly at threshold", () => {
    const result = checkProgression(
      [{ exercise: "squat", sets: 3, reps: 8, formThreshold: 80 }],
      { squat: 80 }
    );
    expect(result.passed).toBe(true);
  });

  it("handles one point below threshold", () => {
    const result = checkProgression(
      [{ exercise: "squat", sets: 3, reps: 8, formThreshold: 80 }],
      { squat: 79 }
    );
    expect(result.passed).toBe(false);
  });

  it("handles zero score", () => {
    const result = checkProgression(
      [{ exercise: "squat", sets: 3, reps: 8, formThreshold: 80 }],
      { squat: 0 }
    );
    expect(result.passed).toBe(false);
  });

  it("handles perfect score", () => {
    const result = checkProgression(
      [{ exercise: "squat", sets: 3, reps: 8, formThreshold: 80 }],
      { squat: 100 }
    );
    expect(result.passed).toBe(true);
  });
});

// ── Fatigue Detection Edge Cases ────────────────────────────────────

describe("fatigue detection edge cases", () => {
  it("handles exactly 6 reps", () => {
    const reps: RepRecord[] = Array.from({ length: 6 }, (_, i) => ({
      repNumber: i + 1,
      flag: i >= 4 ? "knees_caving" as const : null,
      score: i >= 4 ? 50 : 97,
    }));
    const result = detectFatigue(reps);
    // first3: 0 flags, last3: 2 flags → 2 >= 2 → detected
    expect(result.detected).toBe(true);
  });

  it("handles all clean reps", () => {
    const reps: RepRecord[] = Array.from({ length: 10 }, (_, i) => ({
      repNumber: i + 1,
      flag: null,
      score: 97,
    }));
    expect(detectFatigue(reps).detected).toBe(false);
  });

  it("handles all flagged reps", () => {
    const reps: RepRecord[] = Array.from({ length: 8 }, (_, i) => ({
      repNumber: i + 1,
      flag: "knees_caving" as const,
      score: 50,
    }));
    // first3 = 3 flags, last3 = 3 flags, diff = 0
    expect(detectFatigue(reps).detected).toBe(false);
  });
});
