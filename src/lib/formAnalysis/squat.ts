import type { Keypoint, Pose } from "@tensorflow-models/pose-detection";
import type { FormFlag } from "../types";
import { angleDeg, getKeypoint } from "../mathUtils";

// COCO keypoint indices
const LEFT_HIP = 11;
const RIGHT_HIP = 12;
const LEFT_KNEE = 13;
const RIGHT_KNEE = 14;
const LEFT_ANKLE = 15;
const RIGHT_ANKLE = 16;
const LEFT_SHOULDER = 5;
const RIGHT_SHOULDER = 6;

type RepPhase = "standing" | "descending" | "bottom" | "ascending";

export interface SquatState {
  phase: RepPhase;
  repCount: number;
  currentRepFlags: FormFlag[];
  lowestHipY: number;
}

export function createSquatState(): SquatState {
  return {
    phase: "standing",
    repCount: 0,
    currentRepFlags: [],
    lowestHipY: 0,
  };
}

function midpointY(a: Keypoint, b: Keypoint): number {
  return (a.y + b.y) / 2;
}

function midpointX(a: Keypoint, b: Keypoint): number {
  return (a.x + b.x) / 2;
}

/**
 * Check if hips are below knees (squat depth).
 * In image space, Y increases downward — so hip below knee means hipY > kneeY.
 */
function isAtDepth(hipY: number, kneeY: number): boolean {
  return hipY > kneeY;
}

/**
 * Detect form flags for the current frame.
 */
function detectFlags(pose: Pose): FormFlag[] {
  const flags: FormFlag[] = [];

  const lHip = getKeypoint(pose, LEFT_HIP);
  const rHip = getKeypoint(pose, RIGHT_HIP);
  const lKnee = getKeypoint(pose, LEFT_KNEE);
  const rKnee = getKeypoint(pose, RIGHT_KNEE);
  const lAnkle = getKeypoint(pose, LEFT_ANKLE);
  const rAnkle = getKeypoint(pose, RIGHT_ANKLE);
  const lShoulder = getKeypoint(pose, LEFT_SHOULDER);
  const rShoulder = getKeypoint(pose, RIGHT_SHOULDER);

  // 1. Knees caving: knee X moving inside ankle X
  if (lKnee && lAnkle && rKnee && rAnkle) {
    const lKneeCaving = lKnee.x > lAnkle.x + 5; // left knee drifts right of ankle
    const rKneeCaving = rKnee.x < rAnkle.x - 5; // right knee drifts left of ankle
    if (lKneeCaving || rKneeCaving) {
      flags.push("knees_caving");
    }
  }

  // 2. Forward lean: shoulders significantly ahead of hips
  if (lShoulder && rShoulder && lHip && rHip) {
    const shoulderX = midpointX(lShoulder, rShoulder);
    const hipX = midpointX(lHip, rHip);
    // In side view, forward lean = shoulder X far from hip X
    // This heuristic works for side-angle camera placement
    const lean = Math.abs(shoulderX - hipX);
    if (lean > 30) {
      flags.push("forward_lean");
    }
  }

  return flags;
}

/**
 * Process a new pose frame and update squat state.
 * Returns the flag for the just-completed rep, or null if no rep completed.
 */
export function processSquatFrame(
  pose: Pose,
  state: SquatState
): { completedRep: boolean; flag: FormFlag | null; allFlags: FormFlag[]; state: SquatState } {
  const lHip = getKeypoint(pose, LEFT_HIP);
  const rHip = getKeypoint(pose, RIGHT_HIP);
  const lKnee = getKeypoint(pose, LEFT_KNEE);
  const rKnee = getKeypoint(pose, RIGHT_KNEE);

  // Need at least one side of hip + knee visible
  if ((!lHip && !rHip) || (!lKnee && !rKnee)) {
    return { completedRep: false, flag: null, allFlags: [], state };
  }

  const hipY = lHip && rHip ? midpointY(lHip, rHip) : (lHip ?? rHip)!.y;
  const kneeY =
    lKnee && rKnee ? midpointY(lKnee, rKnee) : (lKnee ?? rKnee)!.y;

  const kneeAngle = (() => {
    // Compute knee angle (hip-knee-ankle) on whichever side is visible
    const lAnkle = getKeypoint(pose, LEFT_ANKLE);
    const rAnkle = getKeypoint(pose, RIGHT_ANKLE);
    if (lHip && lKnee && lAnkle) return angleDeg(lHip, lKnee, lAnkle);
    if (rHip && rKnee && rAnkle) return angleDeg(rHip, rKnee, rAnkle);
    return null;
  })();

  const newState = { ...state };

  switch (state.phase) {
    case "standing": {
      // Detect descent: knee angle closing or hips dropping toward knees
      if (kneeAngle !== null && kneeAngle < 150) {
        newState.phase = "descending";
        newState.currentRepFlags = [];
        newState.lowestHipY = hipY;
      }
      break;
    }

    case "descending": {
      // Track lowest point
      if (hipY > newState.lowestHipY) {
        newState.lowestHipY = hipY;
      }

      // Collect flags during descent
      const frameFlags = detectFlags(pose);
      for (const f of frameFlags) {
        if (!newState.currentRepFlags.includes(f)) {
          newState.currentRepFlags.push(f);
        }
      }

      // Check if reached bottom (hips at or below knees)
      if (isAtDepth(hipY, kneeY) || (kneeAngle !== null && kneeAngle < 90)) {
        newState.phase = "bottom";
      }
      break;
    }

    case "bottom": {
      // Collect flags at bottom too
      const frameFlags = detectFlags(pose);
      for (const f of frameFlags) {
        if (!newState.currentRepFlags.includes(f)) {
          newState.currentRepFlags.push(f);
        }
      }

      // Detect ascent: hips rising
      if (kneeAngle !== null && kneeAngle > 100) {
        newState.phase = "ascending";
      }
      break;
    }

    case "ascending": {
      // Rep completes when back to standing (knee angle > 160)
      if (kneeAngle !== null && kneeAngle > 160) {
        newState.repCount += 1;
        newState.phase = "standing";

        // Check depth flag — if hips never went below knees
        if (!isAtDepth(newState.lowestHipY, kneeY)) {
          if (!newState.currentRepFlags.includes("depth_too_shallow")) {
            newState.currentRepFlags.push("depth_too_shallow");
          }
        }

        // Pick the most important flag (first detected = most persistent)
        const allFlags = [...newState.currentRepFlags];
        const flag = allFlags[0] ?? null;
        newState.currentRepFlags = [];
        newState.lowestHipY = 0;

        return { completedRep: true, flag, allFlags, state: newState };
      }
      break;
    }
  }

  return { completedRep: false, flag: null, allFlags: [], state: newState };
}
