import type { Pose } from "@tensorflow-models/pose-detection";
import type { FormFlag } from "../types";
import { angleDeg, getKeypoint } from "../mathUtils";

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

type RepPhase = "up" | "descending" | "bottom" | "ascending";

export interface PushupState {
  phase: RepPhase;
  repCount: number;
  currentRepFlags: FormFlag[];
  lowestShoulderY: number;
}

export function createPushupState(): PushupState {
  return { phase: "up", repCount: 0, currentRepFlags: [], lowestShoulderY: 0 };
}

function detectFlags(pose: Pose): FormFlag[] {
  const flags: FormFlag[] = [];

  const lShoulder = getKeypoint(pose, LEFT_SHOULDER);
  const rShoulder = getKeypoint(pose, RIGHT_SHOULDER);
  const lHip = getKeypoint(pose, LEFT_HIP);
  const rHip = getKeypoint(pose, RIGHT_HIP);
  const lAnkle = getKeypoint(pose, LEFT_ANKLE);
  const rAnkle = getKeypoint(pose, RIGHT_ANKLE);
  const lElbow = getKeypoint(pose, LEFT_ELBOW);
  const rElbow = getKeypoint(pose, RIGHT_ELBOW);

  // Hips sagging: hip Y significantly below shoulder-ankle line
  if (lShoulder && rShoulder && lHip && rHip && lAnkle && rAnkle) {
    const shoulderY = (lShoulder.y + rShoulder.y) / 2;
    const ankleY = (lAnkle.y + rAnkle.y) / 2;
    const hipY = (lHip.y + rHip.y) / 2;
    // Expected: hip Y roughly between shoulder and ankle
    // Sagging: hip Y drops well below the midline
    const midline = (shoulderY + ankleY) / 2;
    if (hipY > midline + 15) {
      flags.push("hips_sagging");
    }
  }

  // Elbows flaring: elbow X far outside shoulder X
  if (lShoulder && lElbow && rShoulder && rElbow) {
    // From front/side view, flaring = elbows significantly wider than shoulders
    const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x);
    const elbowWidth = Math.abs(lElbow.x - rElbow.x);
    if (elbowWidth > shoulderWidth * 1.4) {
      flags.push("elbows_flaring");
    }
  }

  return flags;
}

export function processPushupFrame(
  pose: Pose,
  state: PushupState
): { completedRep: boolean; flag: FormFlag | null; state: PushupState } {
  const lShoulder = getKeypoint(pose, LEFT_SHOULDER);
  const rShoulder = getKeypoint(pose, RIGHT_SHOULDER);
  const lElbow = getKeypoint(pose, LEFT_ELBOW);
  const rElbow = getKeypoint(pose, RIGHT_ELBOW);
  const lWrist = getKeypoint(pose, LEFT_WRIST);
  const rWrist = getKeypoint(pose, RIGHT_WRIST);

  if ((!lShoulder && !rShoulder) || (!lElbow && !rElbow)) {
    return { completedRep: false, flag: null, state };
  }

  // Elbow angle: shoulder-elbow-wrist
  const elbowAngle = (() => {
    if (lShoulder && lElbow && lWrist) return angleDeg(lShoulder, lElbow, lWrist);
    if (rShoulder && rElbow && rWrist) return angleDeg(rShoulder, rElbow, rWrist);
    return null;
  })();

  const shoulderY = lShoulder && rShoulder
    ? (lShoulder.y + rShoulder.y) / 2
    : (lShoulder ?? rShoulder)!.y;

  const newState = { ...state };

  switch (state.phase) {
    case "up": {
      // Descent: elbow angle closing
      if (elbowAngle !== null && elbowAngle < 150) {
        newState.phase = "descending";
        newState.currentRepFlags = [];
        newState.lowestShoulderY = shoulderY;
      }
      break;
    }

    case "descending": {
      if (shoulderY > newState.lowestShoulderY) {
        newState.lowestShoulderY = shoulderY;
      }

      const frameFlags = detectFlags(pose);
      for (const f of frameFlags) {
        if (!newState.currentRepFlags.includes(f)) {
          newState.currentRepFlags.push(f);
        }
      }

      // Bottom: elbow angle very closed
      if (elbowAngle !== null && elbowAngle < 90) {
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

      // Ascending: elbow opening
      if (elbowAngle !== null && elbowAngle > 110) {
        newState.phase = "ascending";
      }
      break;
    }

    case "ascending": {
      // Full extension: elbow angle > 160
      if (elbowAngle !== null && elbowAngle > 160) {
        newState.repCount += 1;
        newState.phase = "up";

        // Check incomplete range — if elbow never went below 90
        if (newState.lowestShoulderY < shoulderY - 5) {
          // Shoulder barely dropped — incomplete range
          if (!newState.currentRepFlags.includes("incomplete_range")) {
            newState.currentRepFlags.push("incomplete_range");
          }
        }

        const flag = newState.currentRepFlags[0] ?? null;
        newState.currentRepFlags = [];
        newState.lowestShoulderY = 0;

        return { completedRep: true, flag, state: newState };
      }
      break;
    }
  }

  return { completedRep: false, flag: null, state: newState };
}
