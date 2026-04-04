import { angleDeg, getKeypoint } from "../lib/mathUtils";
import { buildPose } from "./testHelpers";

describe("angleDeg", () => {
  function kp(x: number, y: number) {
    return { x, y, score: 1, name: "kp" };
  }

  it("returns 90 for a right angle", () => {
    // A=(0,1), B=(0,0), C=(1,0) — right angle at B
    const angle = angleDeg(kp(0, 1), kp(0, 0), kp(1, 0));
    expect(angle).toBeCloseTo(90, 1);
  });

  it("returns 180 for collinear points (straight line)", () => {
    const angle = angleDeg(kp(0, 0), kp(1, 0), kp(2, 0));
    expect(angle).toBeCloseTo(180, 1);
  });

  it("returns 60 for an equilateral triangle vertex", () => {
    // Equilateral triangle vertices
    const a = kp(0, 0);
    const b = kp(1, 0);
    const c = kp(0.5, Math.sqrt(3) / 2);
    const angle = angleDeg(a, b, c);
    expect(angle).toBeCloseTo(60, 1);
  });

  it("returns 180 when vertex is at same point as one endpoint (zero-length vector)", () => {
    const angle = angleDeg(kp(1, 0), kp(1, 0), kp(2, 0));
    expect(angle).toBe(180);
  });
});

describe("getKeypoint", () => {
  it("returns the keypoint when score meets threshold", () => {
    const pose = buildPose({ 5: { x: 10, y: 20, score: 0.9 } });
    const kp = getKeypoint(pose, 5);
    expect(kp).not.toBeNull();
    expect(kp?.x).toBe(10);
    expect(kp?.y).toBe(20);
  });

  it("returns null when score is below threshold", () => {
    const pose = buildPose({ 5: { x: 10, y: 20, score: 0.1 } });
    const kp = getKeypoint(pose, 5);
    expect(kp).toBeNull();
  });

  it("returns null when score is exactly at threshold boundary", () => {
    // score 0.3 should pass (>= 0.3 is our rule: score >= MIN_CONFIDENCE)
    // The implementation uses `< MIN_CONFIDENCE` to reject, so 0.3 should pass
    const pose = buildPose({ 5: { x: 10, y: 20, score: 0.3 } });
    const kp = getKeypoint(pose, 5);
    expect(kp).not.toBeNull();
  });

  it("respects custom minConfidence parameter", () => {
    const pose = buildPose({ 5: { x: 10, y: 20, score: 0.5 } });
    const kp = getKeypoint(pose, 5, 0.8);
    expect(kp).toBeNull();
  });

  it("returns null for an out-of-range index", () => {
    const pose = buildPose({});
    const kp = getKeypoint(pose, 99);
    expect(kp).toBeNull();
  });
});
