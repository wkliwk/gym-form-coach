import type { RepRecord } from "../lib/types";
import { detectFatigue, findBestWorstReps } from "../lib/formInsights";

describe("detectFatigue", () => {
  it("returns not detected for fewer than 6 reps", () => {
    const reps: RepRecord[] = [
      { repNumber: 1, flag: null },
      { repNumber: 2, flag: null },
      { repNumber: 3, flag: "knees_caving" },
    ];
    expect(detectFatigue(reps).detected).toBe(false);
  });

  it("returns not detected when form is consistent", () => {
    const reps: RepRecord[] = [
      { repNumber: 1, flag: null },
      { repNumber: 2, flag: null },
      { repNumber: 3, flag: null },
      { repNumber: 4, flag: null },
      { repNumber: 5, flag: null },
      { repNumber: 6, flag: null },
    ];
    expect(detectFatigue(reps).detected).toBe(false);
  });

  it("detects fatigue when late reps have more flags", () => {
    const reps: RepRecord[] = [
      { repNumber: 1, flag: null },
      { repNumber: 2, flag: null },
      { repNumber: 3, flag: null },
      { repNumber: 4, flag: "knees_caving" },
      { repNumber: 5, flag: "depth_too_shallow" },
      { repNumber: 6, flag: "knees_caving" },
      { repNumber: 7, flag: "forward_lean" },
      { repNumber: 8, flag: "knees_caving" },
    ];
    const result = detectFatigue(reps);
    expect(result.detected).toBe(true);
    expect(result.message).toContain("form declined");
  });

  it("does not detect fatigue when early reps also have flags", () => {
    const reps: RepRecord[] = [
      { repNumber: 1, flag: "knees_caving" },
      { repNumber: 2, flag: "forward_lean" },
      { repNumber: 3, flag: "knees_caving" },
      { repNumber: 4, flag: "knees_caving" },
      { repNumber: 5, flag: "forward_lean" },
      { repNumber: 6, flag: "knees_caving" },
    ];
    // first3 flags = 3, last3 flags = 3, diff = 0
    expect(detectFatigue(reps).detected).toBe(false);
  });
});

describe("findBestWorstReps", () => {
  it("returns nulls for empty records", () => {
    expect(findBestWorstReps([])).toEqual({ bestRep: null, worstRep: null });
  });

  it("finds best (no flag) and worst (has flag) reps", () => {
    const reps: RepRecord[] = [
      { repNumber: 1, flag: "knees_caving" },
      { repNumber: 2, flag: null },
      { repNumber: 3, flag: "forward_lean" },
    ];
    expect(findBestWorstReps(reps)).toEqual({ bestRep: 2, worstRep: 1 });
  });

  it("returns null for best if all reps have flags", () => {
    const reps: RepRecord[] = [
      { repNumber: 1, flag: "knees_caving" },
      { repNumber: 2, flag: "forward_lean" },
    ];
    expect(findBestWorstReps(reps)).toEqual({ bestRep: null, worstRep: 1 });
  });

  it("returns null for worst if all reps are clean", () => {
    const reps: RepRecord[] = [
      { repNumber: 1, flag: null },
      { repNumber: 2, flag: null },
    ];
    expect(findBestWorstReps(reps)).toEqual({ bestRep: 1, worstRep: null });
  });
});
