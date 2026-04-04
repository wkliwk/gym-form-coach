import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addSession,
  loadSessions,
  saveSessions,
  deleteSession,
  clearAllSessions,
  findPreviousSession,
} from "../lib/sessionStorage";
import type { SessionRecord } from "../lib/types";

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: "test-id-1",
    date: "2026-01-01T12:00:00.000Z",
    exercise: "squat",
    reps: 5,
    topFlag: null,
    score: 100,
    ...overrides,
  };
}

describe("sessionStorage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("loadSessions returns empty array when storage is empty", async () => {
    const sessions = await loadSessions();
    expect(sessions).toEqual([]);
  });

  it("addSession + loadSessions round-trip", async () => {
    const session = makeSession();
    await addSession(session);
    const loaded = await loadSessions();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(session);
  });

  it("addSession prepends new sessions (most recent first)", async () => {
    const first = makeSession({ id: "id-1", date: "2026-01-01T00:00:00.000Z" });
    const second = makeSession({ id: "id-2", date: "2026-01-02T00:00:00.000Z" });

    await addSession(first);
    await addSession(second);

    const loaded = await loadSessions();
    expect(loaded).toHaveLength(2);
    expect(loaded[0]?.id).toBe("id-2"); // most recently added is first
    expect(loaded[1]?.id).toBe("id-1");
  });

  it("saveSessions persists and loadSessions retrieves correctly", async () => {
    const sessions = [
      makeSession({ id: "a", exercise: "squat" }),
      makeSession({ id: "b", exercise: "deadlift" }),
    ];
    await saveSessions(sessions);
    const loaded = await loadSessions();
    expect(loaded).toHaveLength(2);
    expect(loaded[0]?.id).toBe("a");
    expect(loaded[1]?.id).toBe("b");
  });

  it("deleteSession removes the session with the matching id", async () => {
    await addSession(makeSession({ id: "keep" }));
    await addSession(makeSession({ id: "remove" }));

    await deleteSession("remove");

    const loaded = await loadSessions();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.id).toBe("keep");
  });

  it("clearAllSessions empties storage", async () => {
    await addSession(makeSession());
    await clearAllSessions();
    const loaded = await loadSessions();
    expect(loaded).toHaveLength(0);
  });

  it("loadSessions returns empty array when storage contains invalid JSON", async () => {
    await AsyncStorage.setItem("@gym_form_coach/sessions", "not-valid-json{");
    const loaded = await loadSessions();
    expect(loaded).toEqual([]);
  });

  describe("findPreviousSession", () => {
    it("finds the most recent previous session for the same exercise", () => {
      const sessions: SessionRecord[] = [
        makeSession({ id: "current", exercise: "squat" }),
        makeSession({ id: "prev", exercise: "squat" }),
        makeSession({ id: "other", exercise: "deadlift" }),
      ];
      const found = findPreviousSession(sessions, "squat", "current");
      expect(found?.id).toBe("prev");
    });

    it("returns null when no matching previous session exists", () => {
      const sessions: SessionRecord[] = [
        makeSession({ id: "current", exercise: "squat" }),
      ];
      const found = findPreviousSession(sessions, "squat", "current");
      expect(found).toBeNull();
    });
  });
});
