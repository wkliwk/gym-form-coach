import { computeRepScore, computeAverageScore } from "../lib/repScoring";

describe("computeRepScore", () => {
  it("scores a clean rep at 97", () => {
    expect(computeRepScore([])).toBe(97);
  });

  it("scores a rep with one minor flag between 50-70", () => {
    const score = computeRepScore(["incomplete_lockout"]);
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThanOrEqual(70);
  });

  it("scores a rep with one major flag between 45-65", () => {
    const score = computeRepScore(["rounded_lower_back"]);
    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThanOrEqual(65);
  });

  it("scores a rep with multiple flags lower than single flag", () => {
    const singleFlag = computeRepScore(["knees_caving"]);
    const multiFlag = computeRepScore(["knees_caving", "forward_lean"]);
    expect(multiFlag).toBeLessThan(singleFlag);
  });

  it("never returns below 5", () => {
    const score = computeRepScore([
      "knees_caving",
      "depth_too_shallow",
      "forward_lean",
    ]);
    expect(score).toBeGreaterThanOrEqual(5);
  });

  it("scores 3 flags significantly lower than 1 flag", () => {
    const oneFlag = computeRepScore(["knees_caving"]);
    const threeFlags = computeRepScore([
      "knees_caving",
      "depth_too_shallow",
      "forward_lean",
    ]);
    expect(threeFlags).toBeLessThan(oneFlag - 10);
  });
});

describe("computeAverageScore", () => {
  it("returns 0 for empty array", () => {
    expect(computeAverageScore([])).toBe(0);
  });

  it("computes correct average", () => {
    expect(computeAverageScore([100, 80, 60])).toBe(80);
  });

  it("rounds to nearest integer", () => {
    expect(computeAverageScore([97, 50])).toBe(74);
  });
});
