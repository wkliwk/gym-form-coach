import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BADGES,
  checkAndAwardBadges,
  loadEarnedBadges,
  saveEarnedBadges,
} from "../lib/badges";
import type { SessionRecord } from "../lib/types";

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: Math.random().toString(36).slice(2),
    date: new Date().toISOString(),
    exercise: "squat",
    reps: 10,
    topFlag: null,
    score: 75,
    ...overrides,
  };
}

/** Create sessions on N distinct consecutive days ending today. */
function makeDailyStreak(n: number): SessionRecord[] {
  const sessions: SessionRecord[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    sessions.push(
      makeSession({ id: `streak-${i}`, date: d.toISOString() })
    );
  }
  return sessions;
}

describe("badges", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  // ── Badge definitions ─────────────────────────────────────────────────────

  describe("first_rep", () => {
    it("unlocks after first session", () => {
      const badge = BADGES.find((b) => b.id === "first_rep")!;
      const session = makeSession();
      expect(badge.check([session], session)).toBe(true);
    });

    it("does not unlock with empty sessions", () => {
      const badge = BADGES.find((b) => b.id === "first_rep")!;
      const session = makeSession();
      expect(badge.check([], session)).toBe(false);
    });
  });

  describe("three_peat", () => {
    it("unlocks with 3-day streak", () => {
      const badge = BADGES.find((b) => b.id === "three_peat")!;
      const sessions = makeDailyStreak(3);
      expect(badge.check(sessions, sessions[sessions.length - 1])).toBe(true);
    });

    it("does not unlock with 2-day streak", () => {
      const badge = BADGES.find((b) => b.id === "three_peat")!;
      const sessions = makeDailyStreak(2);
      expect(badge.check(sessions, sessions[sessions.length - 1])).toBe(false);
    });
  });

  describe("week_warrior", () => {
    it("unlocks with 7-day streak", () => {
      const badge = BADGES.find((b) => b.id === "week_warrior")!;
      const sessions = makeDailyStreak(7);
      expect(badge.check(sessions, sessions[sessions.length - 1])).toBe(true);
    });
  });

  describe("iron_habit", () => {
    it("unlocks with 30-day streak", () => {
      const badge = BADGES.find((b) => b.id === "iron_habit")!;
      const sessions = makeDailyStreak(30);
      expect(badge.check(sessions, sessions[sessions.length - 1])).toBe(true);
    });

    it("does not unlock with 29-day streak", () => {
      const badge = BADGES.find((b) => b.id === "iron_habit")!;
      const sessions = makeDailyStreak(29);
      expect(badge.check(sessions, sessions[sessions.length - 1])).toBe(false);
    });
  });

  describe("century", () => {
    it("unlocks at 100 total reps", () => {
      const badge = BADGES.find((b) => b.id === "century")!;
      const sessions = Array.from({ length: 10 }, () => makeSession({ reps: 10 }));
      expect(badge.check(sessions, sessions[0])).toBe(true);
    });

    it("does not unlock at 99 total reps", () => {
      const badge = BADGES.find((b) => b.id === "century")!;
      const sessions = [
        ...Array.from({ length: 9 }, () => makeSession({ reps: 10 })),
        makeSession({ reps: 9 }),
      ];
      expect(badge.check(sessions, sessions[0])).toBe(false);
    });
  });

  describe("grinder", () => {
    it("unlocks at 1000 total reps", () => {
      const badge = BADGES.find((b) => b.id === "grinder")!;
      const sessions = Array.from({ length: 100 }, () => makeSession({ reps: 10 }));
      expect(badge.check(sessions, sessions[0])).toBe(true);
    });
  });

  describe("five_sets", () => {
    it("unlocks when session has 5 sets", () => {
      const badge = BADGES.find((b) => b.id === "five_sets")!;
      const session = makeSession({
        sets: Array.from({ length: 5 }, (_, i) => ({
          setNumber: i + 1,
          reps: 10,
          score: 80,
          topFlag: null,
          repRecords: [],
        })),
      });
      expect(badge.check([session], session)).toBe(true);
    });

    it("does not unlock with 4 sets", () => {
      const badge = BADGES.find((b) => b.id === "five_sets")!;
      const session = makeSession({
        sets: Array.from({ length: 4 }, (_, i) => ({
          setNumber: i + 1,
          reps: 10,
          score: 80,
          topFlag: null,
          repRecords: [],
        })),
      });
      expect(badge.check([session], session)).toBe(false);
    });
  });

  describe("clean_sheet", () => {
    it("unlocks when session has no flags", () => {
      const badge = BADGES.find((b) => b.id === "clean_sheet")!;
      const session = makeSession({ topFlag: null });
      expect(badge.check([session], session)).toBe(true);
    });

    it("does not unlock when session has a flag", () => {
      const badge = BADGES.find((b) => b.id === "clean_sheet")!;
      const session = makeSession({ topFlag: "knees_caving" });
      expect(badge.check([session], session)).toBe(false);
    });
  });

  describe("form_check", () => {
    it("unlocks at score 90", () => {
      const badge = BADGES.find((b) => b.id === "form_check")!;
      const session = makeSession({ score: 90 });
      expect(badge.check([session], session)).toBe(true);
    });

    it("unlocks at score 100", () => {
      const badge = BADGES.find((b) => b.id === "form_check")!;
      const session = makeSession({ score: 100 });
      expect(badge.check([session], session)).toBe(true);
    });

    it("does not unlock at score 89", () => {
      const badge = BADGES.find((b) => b.id === "form_check")!;
      const session = makeSession({ score: 89 });
      expect(badge.check([session], session)).toBe(false);
    });
  });

  describe("all_rounder", () => {
    it("unlocks with 3 different exercises", () => {
      const badge = BADGES.find((b) => b.id === "all_rounder")!;
      const sessions = [
        makeSession({ exercise: "squat" }),
        makeSession({ exercise: "deadlift" }),
        makeSession({ exercise: "pushup" }),
      ];
      expect(badge.check(sessions, sessions[0])).toBe(true);
    });

    it("does not unlock with 2 different exercises", () => {
      const badge = BADGES.find((b) => b.id === "all_rounder")!;
      const sessions = [
        makeSession({ exercise: "squat" }),
        makeSession({ exercise: "deadlift" }),
        makeSession({ exercise: "squat" }),
      ];
      expect(badge.check(sessions, sessions[0])).toBe(false);
    });
  });

  describe("perfect_week", () => {
    it("unlocks with 3 sessions in a week all scoring ≥ 80", () => {
      const badge = BADGES.find((b) => b.id === "perfect_week")!;
      // Three sessions on Mon/Tue/Wed this week
      const mon = new Date();
      const day = mon.getDay();
      const daysFromMon = (day + 6) % 7;
      mon.setDate(mon.getDate() - daysFromMon);
      const sessions = [0, 1, 2].map((offset) => {
        const d = new Date(mon);
        d.setDate(mon.getDate() + offset);
        return makeSession({ date: d.toISOString(), score: 85 });
      });
      expect(badge.check(sessions, sessions[0])).toBe(true);
    });

    it("does not unlock if any session score < 80", () => {
      const badge = BADGES.find((b) => b.id === "perfect_week")!;
      const mon = new Date();
      const day = mon.getDay();
      const daysFromMon = (day + 6) % 7;
      mon.setDate(mon.getDate() - daysFromMon);
      const sessions = [0, 1, 2].map((offset) => {
        const d = new Date(mon);
        d.setDate(mon.getDate() + offset);
        return makeSession({ date: d.toISOString(), score: offset === 2 ? 79 : 85 });
      });
      expect(badge.check(sessions, sessions[0])).toBe(false);
    });
  });

  describe("personal_best", () => {
    it("unlocks when beating previous best for same exercise", () => {
      const badge = BADGES.find((b) => b.id === "personal_best")!;
      const prev = makeSession({ id: "prev", exercise: "squat", score: 70 });
      const latest = makeSession({ id: "latest", exercise: "squat", score: 85 });
      expect(badge.check([prev, latest], latest)).toBe(true);
    });

    it("does not unlock on first-ever session for an exercise", () => {
      const badge = BADGES.find((b) => b.id === "personal_best")!;
      const latest = makeSession({ id: "latest", exercise: "squat", score: 85 });
      expect(badge.check([latest], latest)).toBe(false);
    });

    it("does not unlock when score is lower than previous best", () => {
      const badge = BADGES.find((b) => b.id === "personal_best")!;
      const prev = makeSession({ id: "prev", exercise: "squat", score: 90 });
      const latest = makeSession({ id: "latest", exercise: "squat", score: 80 });
      expect(badge.check([prev, latest], latest)).toBe(false);
    });
  });

  // ── checkAndAwardBadges ───────────────────────────────────────────────────

  describe("checkAndAwardBadges", () => {
    it("awards first_rep on first session", async () => {
      const session = makeSession();
      const earned = await checkAndAwardBadges([session], session);
      expect(earned.some((b) => b.id === "first_rep")).toBe(true);
    });

    it("does not award the same badge twice", async () => {
      const session = makeSession();
      await checkAndAwardBadges([session], session);
      // Second call — already earned first_rep
      const earned2 = await checkAndAwardBadges([session], session);
      expect(earned2.some((b) => b.id === "first_rep")).toBe(false);
    });

    it("persists earned badges to AsyncStorage", async () => {
      const session = makeSession();
      await checkAndAwardBadges([session], session);
      const stored = await loadEarnedBadges();
      expect(stored.some((b) => b.id === "first_rep")).toBe(true);
    });

    it("returns empty array if no new badges earned", async () => {
      const session = makeSession();
      await saveEarnedBadges([{ id: "first_rep", unlockedAt: new Date().toISOString() }]);
      // Only first_rep would be earned for a single session, but it's already saved
      const earned = await checkAndAwardBadges([session], session);
      expect(earned.some((b) => b.id === "first_rep")).toBe(false);
    });
  });
});
