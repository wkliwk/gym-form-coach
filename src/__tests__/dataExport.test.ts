import type { SessionRecord } from "../lib/types";
import { sessionsToCSV, sessionsToJSON, getExportFilename } from "../lib/dataExport";

const mockSession: SessionRecord = {
  id: "1",
  date: "2026-04-04T10:00:00.000Z",
  exercise: "squat",
  reps: 8,
  topFlag: "knees_caving",
  score: 78,
};

const mockSessionWithSets: SessionRecord = {
  id: "2",
  date: "2026-04-04T12:00:00.000Z",
  exercise: "deadlift",
  reps: 16,
  topFlag: "rounded_lower_back",
  score: 72,
  sets: [
    { setNumber: 1, reps: 8, score: 80, topFlag: null, repRecords: [] },
    { setNumber: 2, reps: 8, score: 64, topFlag: "rounded_lower_back", repRecords: [] },
  ],
};

describe("sessionsToCSV", () => {
  it("returns header only for empty sessions", () => {
    const csv = sessionsToCSV([]);
    expect(csv).toBe("date,exercise,set,reps,score,topFlag");
  });

  it("converts single-set session to one row", () => {
    const csv = sessionsToCSV([mockSession]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe("2026-04-04,squat,1,8,78,knees_caving");
  });

  it("converts multi-set session to one row per set", () => {
    const csv = sessionsToCSV([mockSessionWithSets]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 sets
    expect(lines[1]).toContain("deadlift,1,8,80,");
    expect(lines[2]).toContain("deadlift,2,8,64,rounded_lower_back");
  });

  it("handles null topFlag as empty string", () => {
    const session: SessionRecord = { ...mockSession, topFlag: null };
    const csv = sessionsToCSV([session]);
    expect(csv).toContain(",78,");
  });
});

describe("sessionsToJSON", () => {
  it("returns empty array for empty sessions", () => {
    expect(sessionsToJSON([])).toBe("[]");
  });

  it("returns pretty-printed JSON", () => {
    const json = sessionsToJSON([mockSession]);
    expect(json).toContain('"exercise": "squat"');
    expect(json).toContain("\n"); // pretty-printed
  });
});

describe("getExportFilename", () => {
  it("generates CSV filename with date", () => {
    const name = getExportFilename("csv");
    expect(name).toMatch(/^gym-form-coach-export-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("generates JSON filename with date", () => {
    const name = getExportFilename("json");
    expect(name).toMatch(/^gym-form-coach-export-\d{4}-\d{2}-\d{2}\.json$/);
  });
});
