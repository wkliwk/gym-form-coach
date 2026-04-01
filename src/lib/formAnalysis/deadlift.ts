import type { Keypoint, Pose } from "@tensorflow-models/pose-detection";
import type { FormFlag } from "../types";

const MIN_CONFIDENCE = 0.3;

const LEFT_HIP = 11;
const RIGHT_HIP = 12;
const LEFT_KNEE = 13;
const RIGHT_KNEE = 14;
const LEFT_SHOULDER = 5;
const RIGHT_SHOULDER = 6;
const LEFT_ANKLE = 15;
const RIGHT_ANKLE = 16;

type RepPhase = "standing" | "descending" | "bottom" | "ascending";

export interface DeadliftState {
  phase: RepPhase;
  repCount: number;
  currentRepFlags: FormFlag[];
}

export function createDeadliftState(): DeadliftState {
  return { phase: "standing", repCount: 0, currentRepFlags: [] };
}

function getKp(pose: Pose, idx: number): Keypoint | null {
  const kp = pose.keypoints[idx];
  if (!kp || (kp.score ?? 0) < MIN_CONFIDENCE) return null;
  return kp;
}

function midY(a: Keypoint, b: Keypoint): number {
  return (a.y + b.y) / 2;
}

function angleDeg(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
  if (magAB === 0 || magCB === 0) return 180;
  return (Math.acos(Math.max(-1, Math.min(1, dot / (magAB * magCB)))) * 180) / Math.PI;
}

function detectFlags(pose: Pose): FormFlag[] {
  const flags: FormFlag[] = [];

  const lShoulder = getKp(pose, LEFT_SHOULDER);
  const rShoulder = getKp(pose, RIGHT_SHOULDER);
  const lHip = getKp(pose, LEFT_HIP);
  const rHip = getKp(pose, RIGHT_HIP);
  const lKnee = getKp(pose, LEFT_KNEE);
  const rKnee = getKp(pose, RIGHT_KNEE);

  // Rounded lower back: shoulder Y significantly below hip Y during lift
  // (in side view, excessive rounding shows shoulders dropping relative to hips)
  if (lShoulder && rShoulder && lHip && rHip) {
    const shoulderY = midY(lShoulder, rShoulder);
    const hipY = midY(lHip, rHip);
    // Shoulders far below hips (image Y: larger = lower) suggests rounding
    if (shoulderY - hipY > 25) {
      flags.push("rounded_lower_back");
    }
  }

  // Hips rising early: hip angle opening faster than shoulder angle
  // Simplified: if hips are rising but shoulders stay low
  if (lShoulder && rShoulder && lHip && rHip && lKnee && rKnee) {
    const hipAngle = lHip && lKnee && lShoulder
      ? angleDeg(lShoulder, lHip, lKnee)
      : rHip && rKnee && rShoulder
        ? angleDeg(rShoulder, rHip, rKnee)
        : null;
    // Very acute hip angle with knees already extending = hips rising early
    if (hipAngle !== null && hipAngle < 70) {
      flags.push("hips_rising_early");
    }
  }

  // Bar drift: shoulders ahead of ankles (X distance in side view)
  const lAnkle = getKp(pose, LEFT_ANKLE);
  const rAnkle = getKp(pose, RIGHT_ANKLE);
  if (lShoulder && rShoulder && lAnkle && rAnkle) {
    const shoulderX = (lShoulder.x + rShoulder.x) / 2;
    const ankleX = (lAnkle.x + rAnkle.x) / 2;
    if (Math.abs(shoulderX - ankleX) > 35) {
      flags.push("bar_drift");
    }
  }

  return flags;
}

export function processDeadliftFrame(
  pose: Pose,
  state: DeadliftState
): { completedRep: boolean; flag: FormFlag | null; state: DeadliftState } {
  const lHip = getKp(pose, LEFT_HIP);
  const rHip = getKp(pose, RIGHT_HIP);
  const lKnee = getKp(pose, LEFT_KNEE);
  const rKnee = getKp(pose, RIGHT_KNEE);
  const lShoulder = getKp(pose, LEFT_SHOULDER);
  const rShoulder = getKp(pose, RIGHT_SHOULDER);

  if ((!lHip && !rHip) || (!lShoulder && !rShoulder)) {
    return { completedRep: false, flag: null, state };
  }

  // Hip angle: shoulder-hip-knee
  const hipAngle = (() => {
    if (lShoulder && lHip && lKnee) return angleDeg(lShoulder, lHip, lKnee);
    if (rShoulder && rHip && rKnee) return angleDeg(rShoulder, rHip, rKnee);
    return null;
  })();

  const newState = { ...state };

  switch (state.phase) {
    case "standing": {
      // Descent: hip angle closing (bending forward)
      if (hipAngle !== null && hipAngle < 140) {
        newState.phase = "descending";
        newState.currentRepFlags = [];
      }
      break;
    }

    case "descending": {
      const frameFlags = detectFlags(pose);
      for (const f of frameFlags) {
        if (!newState.currentRepFlags.includes(f)) {
          newState.currentRepFlags.push(f);
        }
      }

      // Bottom: hip angle very closed (hands near floor)
      if (hipAngle !== null && hipAngle < 80) {
        newState.phase = "bottom";
      }
      break;
    }

    case "bottom": {
      const frameFlags = detectFlags(pose);
      for (const f of frameFlags) {
        if (!newState.currentRepFlags.includes(f)) {
          newState.currentRepFlags.push(f);
        }
      }

      // Ascending: hip angle opening
      if (hipAngle !== null && hipAngle > 100) {
        newState.phase = "ascending";
      }
      break;
    }

    case "ascending": {
      // Lockout: hip angle near straight
      if (hipAngle !== null && hipAngle > 160) {
        newState.repCount += 1;
        newState.phase = "standing";

        const flag = newState.currentRepFlags[0] ?? null;
        newState.currentRepFlags = [];

        return { completedRep: true, flag, state: newState };
      }
      break;
    }
  }

  return { completedRep: false, flag: null, state: newState };
}
