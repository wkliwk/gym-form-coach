import type { Keypoint, Pose } from "@tensorflow-models/pose-detection";
import type { FormFlag } from "../types";
import { angleDeg, getKeypoint } from "../mathUtils";

// COCO keypoint indices
const LEFT_SHOULDER = 5;
const RIGHT_SHOULDER = 6;
const LEFT_ELBOW = 7;
const RIGHT_ELBOW = 8;
const LEFT_WRIST = 9;
const RIGHT_WRIST = 10;
const LEFT_HIP = 11;
const RIGHT_HIP = 12;
const LEFT_ANKLE = 15;
const RIGHT_ANKLE = 16;

type RepPhase = "bottom" | "pressing" | "top" | "lowering";

export interface OverheadPressState {
  phase: RepPhase;
  repCount: number;
  currentRepFlags: FormFlag[];
}

export function createOverheadPressState(): OverheadPressState {
  return {
    phase: "bottom",
    repCount: 0,
    currentRepFlags: [],
  };
}

function midpointY(a: Keypoint, b: Keypoint): number {
  return (a.y + b.y) / 2;
}

/**
 * Detect form flags for the current frame.
 */
function detectFlags(pose: Pose): FormFlag[] {
  const flags: FormFlag[] = [];

  const lShoulder = getKeypoint(pose, LEFT_SHOULDER);
  const rShoulder = getKeypoint(pose, RIGHT_SHOULDER);
  const lElbow = getKeypoint(pose, LEFT_ELBOW);
  const rElbow = getKeypoint(pose, RIGHT_ELBOW);
  const lWrist = getKeypoint(pose, LEFT_WRIST);
  const rWrist = getKeypoint(pose, RIGHT_WRIST);
  const lHip = getKeypoint(pose, LEFT_HIP);
  const rHip = getKeypoint(pose, RIGHT_HIP);
  const lAnkle = getKeypoint(pose, LEFT_ANKLE);
  const rAnkle = getKeypoint(pose, RIGHT_ANKLE);

  // 1. Excessive back arch: hip-shoulder-ankle angle (side view)
  // In a straight standing position, this angle should be ~180
  // A large arch means the hips push forward, reducing this angle
  if (lShoulder && lHip && lAnkle) {
    const backAngle = angleDeg(lShoulder, lHip, lAnkle);
    if (backAngle < 160) {
      flags.push("excessive_back_arch");
    }
  } else if (rShoulder && rHip && rAnkle) {
    const backAngle = angleDeg(rShoulder, rHip, rAnkle);
    if (backAngle < 160) {
      flags.push("excessive_back_arch");
    }
  }

  // 2. Uneven press: one wrist significantly higher than the other at lockout
  if (lWrist && rWrist) {
    const yDiff = Math.abs(lWrist.y - rWrist.y);
    if (yDiff > 25) {
      flags.push("uneven_press");
    }
  }

  // 3. Incomplete lockout: elbow not fully extended at top
  // Check if wrists are above shoulders (at lockout position)
  if (lShoulder && lWrist && rShoulder && rWrist) {
    const wristAbove =
      lWrist.y < lShoulder.y - 20 || rWrist.y < rShoulder.y - 20;
    if (wristAbove) {
      // At or near lockout — check elbow angle
      if (lShoulder && lElbow && lWrist) {
        const elbowAngle = angleDeg(lShoulder, lElbow, lWrist);
        if (elbowAngle < 160) {
          flags.push("incomplete_lockout");
        }
      } else if (rShoulder && rElbow && rWrist) {
        const elbowAngle = angleDeg(rShoulder, rElbow, rWrist);
        if (elbowAngle < 160) {
          flags.push("incomplete_lockout");
        }
      }
    }
  }

  return flags;
}

/**
 * Process a new pose frame and update overhead press state.
 * Returns the flag for the just-completed rep, or null if no rep completed.
 *
 * Rep phases:
 * - bottom: bar at shoulder height (wrists near shoulders)
 * - pressing: wrists moving above shoulders
 * - top: arms locked out overhead (wrists well above shoulders, elbows extended)
 * - lowering: wrists descending back toward shoulders
 */
export function processOverheadPressFrame(
  pose: Pose,
  state: OverheadPressState
): { completedRep: boolean; flag: FormFlag | null; state: OverheadPressState } {
  const lShoulder = getKeypoint(pose, LEFT_SHOULDER);
  const rShoulder = getKeypoint(pose, RIGHT_SHOULDER);
  const lWrist = getKeypoint(pose, LEFT_WRIST);
  const rWrist = getKeypoint(pose, RIGHT_WRIST);
  const lElbow = getKeypoint(pose, LEFT_ELBOW);
  const rElbow = getKeypoint(pose, RIGHT_ELBOW);

  // Need at least one side of shoulder + wrist visible
  if ((!lShoulder && !rShoulder) || (!lWrist && !rWrist)) {
    return { completedRep: false, flag: null, state };
  }

  const shoulderY =
    lShoulder && rShoulder
      ? midpointY(lShoulder, rShoulder)
      : (lShoulder ?? rShoulder)!.y;
  const wristY =
    lWrist && rWrist ? midpointY(lWrist, rWrist) : (lWrist ?? rWrist)!.y;

  // Elbow angle for lockout detection
  const elbowAngle = (() => {
    if (lShoulder && lElbow && lWrist) return angleDeg(lShoulder, lElbow, lWrist);
    if (rShoulder && rElbow && rWrist) return angleDeg(rShoulder, rElbow, rWrist);
    return null;
  })();

  // In image space, Y increases downward
  // wristY < shoulderY means wrists are above shoulders
  const wristAboveShoulder = wristY < shoulderY - 20;
  const wristAtShoulder = Math.abs(wristY - shoulderY) < 40;
  const armsLockedOut = elbowAngle !== null && elbowAngle > 155;

  const newState = { ...state };

  switch (state.phase) {
    case "bottom": {
      // Detect press start: wrists moving above shoulders
      if (wristAboveShoulder) {
        newState.phase = "pressing";
        newState.currentRepFlags = [];
      }
      break;
    }

    case "pressing": {
      // Collect flags during press
      const frameFlags = detectFlags(pose);
      for (const f of frameFlags) {
        if (!newState.currentRepFlags.includes(f)) {
          newState.currentRepFlags.push(f);
        }
      }

      // Check if reached top (arms locked out, wrists well above shoulders)
      if (wristAboveShoulder && armsLockedOut) {
        newState.phase = "top";
      }
      break;
    }

    case "top": {
      // Collect flags at top
      const frameFlags = detectFlags(pose);
      for (const f of frameFlags) {
        if (!newState.currentRepFlags.includes(f)) {
          newState.currentRepFlags.push(f);
        }
      }

      // Detect lowering: wrists coming back down
      if (!wristAboveShoulder) {
        newState.phase = "lowering";
      }
      break;
    }

    case "lowering": {
      // Rep completes when wrists return to shoulder height
      if (wristAtShoulder) {
        newState.repCount += 1;
        newState.phase = "bottom";

        // Pick the most important flag
        const flag = newState.currentRepFlags[0] ?? null;
        newState.currentRepFlags = [];

        return { completedRep: true, flag, state: newState };
      }
      break;
    }
  }

  return { completedRep: false, flag: null, state: newState };
}
