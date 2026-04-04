import {
  createDeadliftState,
  processDeadliftFrame,
  type DeadliftState,
} from "../lib/formAnalysis/deadlift";
import { buildPose, KP } from "./testHelpers";

/**
 * Build a deadlift pose with a configurable hip angle (shoulder-hip-knee).
 *
 * Standing = hip angle ~170° (nearly straight)
 * Hinge bottom = hip angle ~60° (heavily bent forward)
 */
function deadliftPose(hipAngleDeg: number) {
  // Fix hip at (100, 300)
  const hipX = 100;
  const hipY = 300;

  // Knee is below the hip (larger Y in image coords)
  const kneeX = hipX;
  const kneeY = hipY + 100;

  const angleRad = (hipAngleDeg * Math.PI) / 180;

  // Vector from hip to knee: (0, 100) pointing down
  // Vector from hip to shoulder: we want angle at hip = hipAngleDeg
  // shoulder vector relative to hip:
  //   knee direction = (0, 1) normalised
  //   shoulder direction = (sin(hipAngleDeg/2 ... ))
  // Simpler: place shoulder such that angle(shoulder, hip, knee) = hipAngleDeg
  //
  // knee vec = (kneeX-hipX, kneeY-hipY) = (0, 100)
  // shoulder vec = (sx-hipX, sy-hipY)
  // cos(θ) = (kx*sx_rel + ky*sy_rel) / (|k|*|s|)
  //
  // Choose |s| = 120 (shoulder ~120 px from hip):
  const sLen = 120;
  const cosTheta = Math.cos(angleRad);
  // knee unit vec = (0, 1)
  // cos(θ) = sy_rel / sLen  =>  sy_rel = cosTheta * sLen
  const shoulderY = hipY + cosTheta * sLen;
  // sx_rel = sin(θ) * sLen (offset to one side for < 180°)
  const sinTheta = Math.sin(angleRad);
  const shoulderX = hipX - sinTheta * sLen; // lean forward (decrease X)

  return buildPose({
    [KP.LEFT_SHOULDER]: { x: shoulderX, y: shoulderY },
    [KP.RIGHT_SHOULDER]: { x: shoulderX, y: shoulderY },
    [KP.LEFT_HIP]: { x: hipX, y: hipY },
    [KP.RIGHT_HIP]: { x: hipX, y: hipY },
    [KP.LEFT_KNEE]: { x: kneeX, y: kneeY },
    [KP.RIGHT_KNEE]: { x: kneeX, y: kneeY },
    [KP.LEFT_ANKLE]: { x: kneeX, y: kneeY + 80 },
    [KP.RIGHT_ANKLE]: { x: kneeX, y: kneeY + 80 },
  });
}

describe("deadlift rep detection", () => {
  it("counts a rep through a full hinge cycle", () => {
    let state = createDeadliftState();

    // Standing (hip ~170°)
    let result = processDeadliftFrame(deadliftPose(170), state);
    state = result.state;
    expect(result.completedRep).toBe(false);

    // Descending (hip ~120°, triggers descent transition < 140)
    result = processDeadliftFrame(deadliftPose(120), state);
    state = result.state;
    expect(state.phase).toBe("descending");

    // Bottom (hip ~60°)
    result = processDeadliftFrame(deadliftPose(60), state);
    state = result.state;
    expect(state.phase).toBe("bottom");

    // Ascending (hip ~110°)
    result = processDeadliftFrame(deadliftPose(110), state);
    state = result.state;
    expect(state.phase).toBe("ascending");

    // Lockout (hip ~170°)
    result = processDeadliftFrame(deadliftPose(170), state);
    expect(result.completedRep).toBe(true);
    expect(result.state.repCount).toBe(1);
    expect(result.state.phase).toBe("standing");
  });

  it("counts multiple reps correctly", () => {
    let state = createDeadliftState();

    function doRep(s: DeadliftState): DeadliftState {
      const frames = [
        deadliftPose(120), // hinge start
        deadliftPose(60), // bottom
        deadliftPose(110), // ascending
        deadliftPose(170), // lockout
      ];
      let current = s;
      for (const frame of frames) {
        const res = processDeadliftFrame(frame, current);
        current = res.state;
      }
      return current;
    }

    state = doRep(state);
    state = doRep(state);

    expect(state.repCount).toBe(2);
  });

  it("returns no completed rep when required keypoints are missing", () => {
    const state = createDeadliftState();
    const emptyPose = buildPose({});
    const result = processDeadliftFrame(emptyPose, state);
    expect(result.completedRep).toBe(false);
    expect(result.state.repCount).toBe(0);
  });
});
