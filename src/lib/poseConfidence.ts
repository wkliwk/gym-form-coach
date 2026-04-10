import type { Pose, Keypoint } from "@tensorflow-models/pose-detection";
import type { Exercise } from "./types";

/**
 * Maps exercise types to the landmark names most critical for form analysis.
 * MoveNet keypoint names follow the COCO topology.
 */
const EXERCISE_LANDMARKS: Record<Exercise, string[]> = {
  squat: [
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle",
  ],
  deadlift: [
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_shoulder",
    "right_shoulder",
  ],
  pushup: [
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist",
    "left_hip",
    "right_hip",
  ],
  overheadPress: [
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist",
  ],
};

export const CONFIDENCE_GOOD = 0.7;
export const CONFIDENCE_LOW = 0.4;

export type ConfidenceLevel = "good" | "warn" | "critical";

/**
 * Compute composite confidence from the exercise-relevant landmarks.
 * Returns a value between 0 and 1.
 */
export function computeExerciseConfidence(
  pose: Pose,
  exercise: Exercise
): number {
  const relevantNames = EXERCISE_LANDMARKS[exercise];
  if (!relevantNames || relevantNames.length === 0) return 1;

  const keypoints = pose.keypoints;
  if (!keypoints || keypoints.length === 0) return 0;

  const keypointMap = new Map<string, Keypoint>();
  for (const kp of keypoints) {
    if (kp.name) keypointMap.set(kp.name, kp);
  }

  let totalScore = 0;
  let count = 0;

  for (const name of relevantNames) {
    const kp = keypointMap.get(name);
    if (kp && kp.score != null) {
      totalScore += kp.score;
      count++;
    }
  }

  if (count === 0) return 0;
  return totalScore / count;
}

/**
 * Classify a confidence score into a level.
 */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= CONFIDENCE_GOOD) return "good";
  if (score >= CONFIDENCE_LOW) return "warn";
  return "critical";
}
