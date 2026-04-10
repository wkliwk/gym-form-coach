import type { Pose, Keypoint } from "@tensorflow-models/pose-detection";
import {
  computeExerciseConfidence,
  getConfidenceLevel,
  CONFIDENCE_GOOD,
  CONFIDENCE_LOW,
} from "../lib/poseConfidence";

function makeKeypoint(name: string, score: number): Keypoint {
  return { x: 0, y: 0, score, name };
}

function makePose(keypoints: Keypoint[]): Pose {
  return { keypoints, score: 0.9 };
}

describe("computeExerciseConfidence", () => {
  it("returns average of relevant landmark scores for squat", () => {
    const pose = makePose([
      makeKeypoint("left_hip", 0.9),
      makeKeypoint("right_hip", 0.8),
      makeKeypoint("left_knee", 0.7),
      makeKeypoint("right_knee", 0.6),
      makeKeypoint("left_ankle", 0.5),
      makeKeypoint("right_ankle", 0.4),
      // Irrelevant landmark — should be ignored
      makeKeypoint("nose", 0.99),
    ]);
    const score = computeExerciseConfidence(pose, "squat");
    // (0.9+0.8+0.7+0.6+0.5+0.4) / 6 = 0.65
    expect(score).toBeCloseTo(0.65, 2);
  });

  it("returns 0 when keypoints array is empty", () => {
    const pose = makePose([]);
    expect(computeExerciseConfidence(pose, "squat")).toBe(0);
  });

  it("returns 0 when no relevant landmarks are found", () => {
    const pose = makePose([
      makeKeypoint("nose", 0.9),
      makeKeypoint("left_eye", 0.8),
    ]);
    expect(computeExerciseConfidence(pose, "squat")).toBe(0);
  });

  it("handles pushup with all 8 relevant landmarks", () => {
    const landmarks = [
      "left_shoulder",
      "right_shoulder",
      "left_elbow",
      "right_elbow",
      "left_wrist",
      "right_wrist",
      "left_hip",
      "right_hip",
    ];
    const pose = makePose(
      landmarks.map((name) => makeKeypoint(name, 0.8))
    );
    expect(computeExerciseConfidence(pose, "pushup")).toBeCloseTo(0.8, 2);
  });

  it("handles overheadPress with 6 relevant landmarks", () => {
    const pose = makePose([
      makeKeypoint("left_shoulder", 0.95),
      makeKeypoint("right_shoulder", 0.85),
      makeKeypoint("left_elbow", 0.75),
      makeKeypoint("right_elbow", 0.65),
      makeKeypoint("left_wrist", 0.55),
      makeKeypoint("right_wrist", 0.45),
    ]);
    // (0.95+0.85+0.75+0.65+0.55+0.45) / 6 = 0.7
    expect(computeExerciseConfidence(pose, "overheadPress")).toBeCloseTo(
      0.7,
      2
    );
  });

  it("handles partial landmarks (only some found)", () => {
    const pose = makePose([
      makeKeypoint("left_hip", 0.9),
      makeKeypoint("right_hip", 0.7),
      // Missing knees and ankles
    ]);
    // Only 2 of 6 squat landmarks found: (0.9+0.7)/2 = 0.8
    expect(computeExerciseConfidence(pose, "squat")).toBeCloseTo(0.8, 2);
  });
});

describe("getConfidenceLevel", () => {
  it("returns 'good' for scores >= 0.7", () => {
    expect(getConfidenceLevel(0.7)).toBe("good");
    expect(getConfidenceLevel(0.95)).toBe("good");
    expect(getConfidenceLevel(1.0)).toBe("good");
  });

  it("returns 'warn' for scores 0.4-0.69", () => {
    expect(getConfidenceLevel(0.4)).toBe("warn");
    expect(getConfidenceLevel(0.5)).toBe("warn");
    expect(getConfidenceLevel(0.69)).toBe("warn");
  });

  it("returns 'critical' for scores < 0.4", () => {
    expect(getConfidenceLevel(0.39)).toBe("critical");
    expect(getConfidenceLevel(0.1)).toBe("critical");
    expect(getConfidenceLevel(0)).toBe("critical");
  });

  it("threshold constants match expected values", () => {
    expect(CONFIDENCE_GOOD).toBe(0.7);
    expect(CONFIDENCE_LOW).toBe(0.4);
  });
});
