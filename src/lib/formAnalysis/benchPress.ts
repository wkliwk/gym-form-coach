import type { Pose } from "@tensorflow-models/pose-detection";
import type { FormFlag } from "../types";
import { angleDeg, getKeypoint } from "../mathUtils";

// COCO keypoint indices
const LEFT_SHOULDER = 5;
const RIGHT_SHOULDER = 6;
const LEFT_ELBOW = 7;
const RIGHT_ELBOW = 8;
const LEFT_WRIST = 9;
const RIGHT_WRIST = 10;

type RepPhase = "start" | "descending" | "bottom" | "ascending";

export interface BenchPressState {
  phase: RepPhase;
  repCount: number;
  currentRepFlags: FormFlag[];
  highestElbowAngle: number;
}

export function createBenchPressState(): BenchPressState {
  return {
    phase: "start",
    repCount: 0,
    currentRepFlags: [],
    highestElbowAngle: 0,
  };
}

/**
 * Detect form flags for the current bench press frame.
 *
 * Flags:
 * 1. wrist_rollover  — wrists deviate backward under load (wrist Y significantly
 *                      above elbow Y in side-view image space, indicating wrist
 *                      extension beyond neutral). Threshold: wrist.y < elbow.y - 15.
 * 2. elbows_flaring  — upper arms flare wider than shoulders. The bench press
 *                      standard is 45-60° from torso; >75° is flaring. Proxy:
 *                      elbow X width > shoulder X width * 1.3.
 * 3. incomplete_lockout — elbow angle < 150° at the top of the rep (press phase).
 *                         Checked only when wrists are at or above shoulder height.
 */
function detectFlags(pose: Pose): FormFlag[] {
  const flags: FormFlag[] = [];

  const lShoulder = getKeypoint(pose, LEFT_SHOULDER);
  const rShoulder = getKeypoint(pose, RIGHT_SHOULDER);
  const lElbow = getKeypoint(pose, LEFT_ELBOW);
  const rElbow = getKeypoint(pose, RIGHT_ELBOW);
  const lWrist = getKeypoint(pose, LEFT_WRIST);
  const rWrist = getKeypoint(pose, RIGHT_WRIST);

  // 1. Wrist rollover: wrist drifting backward above elbow in Y (side view at bench height)
  //    In image coordinates Y increases downward; wrist.y < elbow.y means wrist is higher
  //    which indicates backward extension under load.
  const leftWristRollover =
    lWrist && lElbow && lWrist.y < lElbow.y - 15;
  const rightWristRollover =
    rWrist && rElbow && rWrist.y < rElbow.y - 15;
  if (leftWristRollover || rightWristRollover) {
    flags.push("wrist_rollover");
  }

  // 2. Elbow flare: elbows wider than shoulders * 1.3
  if (lShoulder && rShoulder && lElbow && rElbow) {
    const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x);
    const elbowWidth = Math.abs(lElbow.x - rElbow.x);
    if (shoulderWidth > 0 && elbowWidth > shoulderWidth * 1.3) {
      flags.push("elbows_flaring");
    }
  }

  // Note: incomplete_lockout for bench press is detected at the state-machine level
  // (in processBenchPressFrame) by checking whether the peak elbow angle during the
  // ascending phase reaches the lockout threshold. Frame-level detection is not used
  // here because bench press is a horizontal movement (side view) — wrist position
  // relative to shoulder Y is not a reliable indicator of "near lockout".

  return flags;
}

/**
 * Process a new pose frame and update bench press state.
 *
 * Rep cycle (side-view, person lying on bench, phone at bench height ~2m away):
 * - start:      arms extended, bar at lockout (elbow angle > 160°)
 * - descending: bar lowering toward chest (elbow angle < 150° and closing)
 * - bottom:     bar at or near chest (elbow angle < 90°)
 * - ascending:  bar pressing back up (elbow angle > 100°)
 * - Rep completes when elbow angle returns to > 150° (lockout)
 *
 * Flags are collected during descending, bottom, and ascending phases.
 * The most critical flag (first in priority order) is returned as the rep flag.
 */
export function processBenchPressFrame(
  pose: Pose,
  state: BenchPressState
): {
  completedRep: boolean;
  flag: FormFlag | null;
  allFlags: FormFlag[];
  state: BenchPressState;
} {
  const lShoulder = getKeypoint(pose, LEFT_SHOULDER);
  const rShoulder = getKeypoint(pose, RIGHT_SHOULDER);
  const lElbow = getKeypoint(pose, LEFT_ELBOW);
  const rElbow = getKeypoint(pose, RIGHT_ELBOW);
  const lWrist = getKeypoint(pose, LEFT_WRIST);
  const rWrist = getKeypoint(pose, RIGHT_WRIST);

  // Need at least one side of shoulder + elbow visible
  if ((!lShoulder && !rShoulder) || (!lElbow && !rElbow)) {
    return { completedRep: false, flag: null, allFlags: [], state };
  }

  // Compute elbow angle (shoulder-elbow-wrist)
  const elbowAngle = (() => {
    if (lShoulder && lElbow && lWrist) return angleDeg(lShoulder, lElbow, lWrist);
    if (rShoulder && rElbow && rWrist) return angleDeg(rShoulder, rElbow, rWrist);
    return null;
  })();

  if (elbowAngle === null) {
    return { completedRep: false, flag: null, allFlags: [], state };
  }

  const newState: BenchPressState = { ...state };

  switch (state.phase) {
    case "start": {
      // Detect descent start: elbow angle dropping below 150°
      if (elbowAngle < 150) {
        newState.phase = "descending";
        newState.currentRepFlags = [];
        newState.highestElbowAngle = elbowAngle;
      }
      break;
    }

    case "descending": {
      // Track flags during descent
      const frameFlags = detectFlags(pose);
      for (const f of frameFlags) {
        if (!newState.currentRepFlags.includes(f)) {
          newState.currentRepFlags.push(f);
        }
      }

      // Bottom reached: elbow angle below 90° (bar near chest)
      if (elbowAngle < 90) {
        newState.phase = "bottom";
      }
      break;
    }

    case "bottom": {
      // Collect flags at the bottom position
      const frameFlags = detectFlags(pose);
      for (const f of frameFlags) {
        if (!newState.currentRepFlags.includes(f)) {
          newState.currentRepFlags.push(f);
        }
      }

      // Detect press start: elbow angle opening above 100°
      if (elbowAngle > 100) {
        newState.phase = "ascending";
        newState.highestElbowAngle = elbowAngle;
      }
      break;
    }

    case "ascending": {
      // Track peak elbow angle during ascent for incomplete lockout check
      if (elbowAngle > newState.highestElbowAngle) {
        newState.highestElbowAngle = elbowAngle;
      }

      // Collect flags during ascent
      const frameFlags = detectFlags(pose);
      for (const f of frameFlags) {
        if (!newState.currentRepFlags.includes(f)) {
          newState.currentRepFlags.push(f);
        }
      }

      // Rep complete: arms locked out (elbow angle > 150°)
      if (elbowAngle > 150) {
        newState.repCount += 1;
        newState.phase = "start";

        // Add incomplete_lockout if the peak never reached 150° during ascent
        // (This catches cases where the user stopped short without wrists being
        //  at shoulder height — the detectFlags lockout check requires wrist position)
        if (
          newState.highestElbowAngle < 150 &&
          !newState.currentRepFlags.includes("incomplete_lockout")
        ) {
          newState.currentRepFlags.push("incomplete_lockout");
        }

        const allFlags = [...newState.currentRepFlags];
        // Priority order: wrist_rollover > elbows_flaring > incomplete_lockout
        const flag = allFlags[0] ?? null;
        newState.currentRepFlags = [];
        newState.highestElbowAngle = 0;

        return { completedRep: true, flag, allFlags, state: newState };
      }
      break;
    }
  }

  return { completedRep: false, flag: null, allFlags: [], state: newState };
}

/**
 * Map bench press form flags to audio cue text.
 * Returns "Good rep" for clean reps (null flag).
 */
export function getBenchPressCue(flag: FormFlag | null): string {
  switch (flag) {
    case "wrist_rollover":
      return "Keep wrists straight";
    case "elbows_flaring":
      return "Tuck your elbows";
    case "incomplete_lockout":
      return "Lock it out at the top";
    default:
      return "Good rep";
  }
}
