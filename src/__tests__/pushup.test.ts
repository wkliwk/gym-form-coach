import {
  createPushupState,
  processPushupFrame,
  type PushupState,
} from "../lib/formAnalysis/pushup";
import { buildPose, KP } from "./testHelpers";

/**
 * Build a push-up pose with a configurable elbow angle (shoulder-elbow-wrist).
 *
 * Up position = elbow angle ~170° (arms extended)
 * Bottom = elbow angle ~70° (chest near floor)
 */
function pushupPose(
  elbowAngleDeg: number,
  opts: { hipsSagging?: boolean } = {}
) {
  // Fix elbow at (100, 200)
  const elbowX = 100;
  const elbowY = 200;

  const angleRad = (elbowAngleDeg * Math.PI) / 180;

  // Wrist is below/in-front of elbow in push-up (larger Y)
  const wristLen = 80;
  const wristX = elbowX;
  const wristY = elbowY + wristLen;

  // Shoulder position relative to elbow:
  // cos(θ) = (wrist_vec . shoulder_vec) / (|wrist| * |shoulder|)
  // wrist vec from elbow = (0, wristLen)
  const shoulderLen = 100;
  const cosTheta = Math.cos(angleRad);
  const sinTheta = Math.sin(angleRad);
  // shoulder_y_rel = cosTheta * shoulderLen, offset x for angle
  const shoulderY = elbowY + cosTheta * shoulderLen;
  const shoulderX = elbowX - sinTheta * shoulderLen;

  // Hips and ankles for hips-sagging detection
  const midline = (shoulderY + (wristY + 80)) / 2;
  const hipY = opts.hipsSagging
    ? midline + 30 // sagging below midline
    : midline - 10; // normal
  const hipX = shoulderX;
  const ankleY = wristY + 80;

  return buildPose({
    [KP.LEFT_SHOULDER]: { x: shoulderX, y: shoulderY },
    [KP.RIGHT_SHOULDER]: { x: shoulderX, y: shoulderY },
    [KP.LEFT_ELBOW]: { x: elbowX, y: elbowY },
    [KP.RIGHT_ELBOW]: { x: elbowX, y: elbowY },
    [KP.LEFT_WRIST]: { x: wristX, y: wristY },
    [KP.RIGHT_WRIST]: { x: wristX, y: wristY },
    [KP.LEFT_HIP]: { x: hipX, y: hipY },
    [KP.RIGHT_HIP]: { x: hipX, y: hipY },
    [KP.LEFT_ANKLE]: { x: wristX, y: ankleY },
    [KP.RIGHT_ANKLE]: { x: wristX, y: ankleY },
  });
}

describe("push-up rep detection", () => {
  it("counts a rep through a full up -> bottom -> up cycle", () => {
    let state = createPushupState();

    // Up (elbow ~170°)
    let result = processPushupFrame(pushupPose(170), state);
    state = result.state;
    expect(result.completedRep).toBe(false);

    // Descending (elbow ~130°, triggers descent < 150)
    result = processPushupFrame(pushupPose(130), state);
    state = result.state;
    expect(state.phase).toBe("descending");

    // Bottom (elbow ~70°)
    result = processPushupFrame(pushupPose(70), state);
    state = result.state;
    expect(state.phase).toBe("bottom");

    // Ascending (elbow ~120°)
    result = processPushupFrame(pushupPose(120), state);
    state = result.state;
    expect(state.phase).toBe("ascending");

    // Full extension (elbow ~165°)
    result = processPushupFrame(pushupPose(165), state);
    expect(result.completedRep).toBe(true);
    expect(result.state.repCount).toBe(1);
    expect(result.state.phase).toBe("up");
  });

  it("counts multiple reps correctly", () => {
    let state = createPushupState();

    function doRep(s: PushupState): PushupState {
      const frames = [
        pushupPose(130), // descend
        pushupPose(70), // bottom
        pushupPose(120), // ascending
        pushupPose(165), // extended
      ];
      let current = s;
      for (const frame of frames) {
        const res = processPushupFrame(frame, current);
        current = res.state;
      }
      return current;
    }

    state = doRep(state);
    state = doRep(state);
    state = doRep(state);

    expect(state.repCount).toBe(3);
  });

  it("returns no completed rep when required keypoints are missing", () => {
    const state = createPushupState();
    const emptyPose = buildPose({});
    const result = processPushupFrame(emptyPose, state);
    expect(result.completedRep).toBe(false);
    expect(result.state.repCount).toBe(0);
  });
});
