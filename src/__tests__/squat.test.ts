import {
  createSquatState,
  processSquatFrame,
  type SquatState,
} from "../lib/formAnalysis/squat";
import { buildPose, KP, pointAtAngle } from "./testHelpers";
import type { Pose } from "@tensorflow-models/pose-detection";

const KNEE_X = 100;
const KNEE_Y = 300;
const ANKLE_X = 100;
const ANKLE_Y = 400;

/**
 * Build a squat pose frame with a specific knee angle (hip-knee-ankle).
 * Uses pointAtAngle to compute the hip position such that the knee angle
 * matches the requested value.
 */
function squatPose(kneeAngleDeg: number): Pose {
  const hip = pointAtAngle(KNEE_X, KNEE_Y, ANKLE_X, ANKLE_Y, kneeAngleDeg, 120);
  return buildPose({
    [KP.LEFT_HIP]: { x: hip.x, y: hip.y },
    [KP.RIGHT_HIP]: { x: hip.x, y: hip.y },
    [KP.LEFT_KNEE]: { x: KNEE_X, y: KNEE_Y },
    [KP.RIGHT_KNEE]: { x: KNEE_X, y: KNEE_Y },
    [KP.LEFT_ANKLE]: { x: ANKLE_X, y: ANKLE_Y },
    [KP.RIGHT_ANKLE]: { x: ANKLE_X, y: ANKLE_Y },
    [KP.LEFT_SHOULDER]: { x: hip.x, y: hip.y - 100 },
    [KP.RIGHT_SHOULDER]: { x: hip.x, y: hip.y - 100 },
  });
}

/**
 * Build a pose with the hip explicitly at a given Y position.
 * Used for testing scenarios where we need to control hip depth precisely.
 * The knee angle is controlled via the hipX offset.
 */
function squatPoseWithHipY(hipY: number, kneeAngleDeg: number): Pose {
  // Derive hipX from the target angle while setting hipY explicitly
  const hip = pointAtAngle(KNEE_X, KNEE_Y, ANKLE_X, ANKLE_Y, kneeAngleDeg, 120);
  return buildPose({
    [KP.LEFT_HIP]: { x: hip.x, y: hipY },
    [KP.RIGHT_HIP]: { x: hip.x, y: hipY },
    [KP.LEFT_KNEE]: { x: KNEE_X, y: KNEE_Y },
    [KP.RIGHT_KNEE]: { x: KNEE_X, y: KNEE_Y },
    [KP.LEFT_ANKLE]: { x: ANKLE_X, y: ANKLE_Y },
    [KP.RIGHT_ANKLE]: { x: ANKLE_X, y: ANKLE_Y },
    [KP.LEFT_SHOULDER]: { x: hip.x, y: hipY - 100 },
    [KP.RIGHT_SHOULDER]: { x: hip.x, y: hipY - 100 },
  });
}

describe("squat rep detection", () => {
  it("counts a rep through a full standing -> descending -> bottom -> ascending -> standing cycle", () => {
    let state = createSquatState();

    // Standing (knee ~170°) — no phase change expected
    let result = processSquatFrame(squatPose(170), state);
    expect(result.completedRep).toBe(false);
    state = result.state;
    expect(state.phase).toBe("standing");

    // Descending (knee ~140° < 150) — triggers descent transition
    result = processSquatFrame(squatPose(140), state);
    expect(result.completedRep).toBe(false);
    state = result.state;
    expect(state.phase).toBe("descending");

    // Bottom: hip below knee (hipY > kneeY) — triggers bottom transition
    result = processSquatFrame(squatPoseWithHipY(KNEE_Y + 20, 100), state);
    expect(result.completedRep).toBe(false);
    state = result.state;
    expect(state.phase).toBe("bottom");

    // Ascending (knee ~110° > 100) — triggers ascending transition
    result = processSquatFrame(squatPose(110), state);
    expect(result.completedRep).toBe(false);
    state = result.state;
    expect(state.phase).toBe("ascending");

    // Back to standing (knee ~165° > 160) — rep complete
    result = processSquatFrame(squatPose(165), state);
    expect(result.completedRep).toBe(true);
    expect(result.state.repCount).toBe(1);
    expect(result.state.phase).toBe("standing");
  });

  it("counts multiple reps correctly", () => {
    let state = createSquatState();

    function doRep(s: SquatState): SquatState {
      const frames = [
        squatPose(140),                           // start descent
        squatPoseWithHipY(KNEE_Y + 20, 100),      // bottom (hip below knee)
        squatPose(110),                            // ascending
        squatPose(165),                            // back to standing
      ];
      let current = s;
      for (const frame of frames) {
        const res = processSquatFrame(frame, current);
        current = res.state;
      }
      return current;
    }

    state = doRep(state);
    state = doRep(state);
    state = doRep(state);

    expect(state.repCount).toBe(3);
  });

  it("flags depth_too_shallow when hips never go below knees", () => {
    // To test depth_too_shallow we need:
    // 1. Enter descending phase
    // 2. Reach bottom via knee angle < 90 (not hip position)
    // 3. Hip stays ABOVE knee Y throughout
    // 4. Complete the rep → depth_too_shallow flag expected

    // We use squatPose(80) which places the hip via pointAtAngle at 80°.
    // At 80°, the formula gives hipY > kneeY naturally (hip slightly below knee).
    // Instead, we craft a pose where ankle is shifted so knee angle < 90 but hip stays above knee.

    // Direct coordinate approach:
    // knee at (100, 300), ankle at (100, 400)
    // hip at (300, 200) — above knee Y, but offset X creates angle < 90 at knee
    // Let's verify: angleDeg(hip=(300,200), knee=(100,300), ankle=(100,400))
    //   kh = (300-100, 200-300) = (200, -100), mag = sqrt(40000+10000)=224
    //   ka = (100-100, 400-300) = (0, 100), mag = 100
    //   dot = 200*0 + (-100)*100 = -10000
    //   cos = -10000 / (224*100) = -0.447 → angle ≈ 116.6° — too wide

    // We need angle < 90. Let's try hip at (500, 290) (just above knee Y=300):
    //   kh = (400, -10), mag = sqrt(160000+100)=400.1
    //   ka = (0, 100), mag = 100
    //   dot = 400*0 + (-10)*100 = -1000
    //   cos = -1000 / (400.1*100) = -0.025 → angle ≈ 91.4° — just above 90°

    // Try hip at (800, 299):
    //   kh = (700, -1), mag ≈ 700
    //   ka = (0, 100)
    //   dot = 0 + (-1)*100 = -100
    //   cos = -100 / (700*100) = -0.00143 → angle ≈ 90.08° — still just above

    // Actually it's very hard to get angle < 90 with hip above knee in this geometry.
    // The isAtDepth check (hip below knee) is the primary way to reach bottom phase.
    // Let's test depth_too_shallow through the other path: isAtDepth triggers bottom
    // but lowestHipY recorded during descending is still above knee.

    // Approach: descend such that lowestHipY stays above knee (hipY < kneeY),
    // then at bottom frame hipY briefly goes below knee (triggers isAtDepth),
    // but state.lowestHipY was never updated past kneeY during descending.

    // Actually lowestHipY tracks max hipY during descending. If hip just barely
    // dips below kneeY only in the bottom frame (which uses isAtDepth to transition),
    // we can check the flag. But the bottom detection and lowestHipY update
    // both happen in the same frame during "descending" phase check.

    // Simplest valid test: manually build state with lowestHipY < kneeY and verify flag.
    // The ascending→standing transition checks isAtDepth(lowestHipY, kneeY).
    // We will drive state to ascending with lowestHipY set via internal state.
    let state = createSquatState();

    // Get to ascending phase with lowestHipY = KNEE_Y - 50 (hip never reached depth)
    // by constructing the right pose sequence.
    // Step 1: descend
    let result = processSquatFrame(squatPose(140), state);
    state = result.state;
    // After this frame, lowestHipY = hipY from squatPose(140)
    // squatPose(140): pointAtAngle with angleDeg=140 →
    //   dirX=0, dirY=1, rad=140°, cosA=cos(140°)=-0.766, sinA=sin(140°)=0.643
    //   ax = -0.766*0 - 0.643*1 = -0.643, ay = 0.643*0 + (-0.766)*1 = -0.766
    //   hip = (100 + (-0.643)*120, 300 + (-0.766)*120) = (23, 208)
    // hipY = 208, kneeY = 300, so hipY < kneeY → lowestHipY = 208

    expect(state.lowestHipY).toBeLessThan(KNEE_Y);

    // Step 2: reach bottom with hip still above knee but isAtDepth via squatPoseWithHipY
    // We'll jump to ascending phase directly by overriding state
    const ascendingState: SquatState = {
      ...state,
      phase: "ascending",
      lowestHipY: KNEE_Y - 50, // Hip never reached depth during this rep
    };

    // Step 3: back to standing (knee angle > 160)
    result = processSquatFrame(squatPose(165), ascendingState);
    expect(result.completedRep).toBe(true);
    // lowestHipY (250) < kneeY (300) → not at depth → flag should be depth_too_shallow
    expect(result.flag).toBe("depth_too_shallow");
  });

  it("returns no completed rep when keypoints are missing", () => {
    const state = createSquatState();
    const emptyPose = buildPose({});
    const result = processSquatFrame(emptyPose, state);
    expect(result.completedRep).toBe(false);
    expect(result.state.repCount).toBe(0);
  });
});
