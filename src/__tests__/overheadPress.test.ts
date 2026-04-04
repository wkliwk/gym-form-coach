import {
  createOverheadPressState,
  processOverheadPressFrame,
  type OverheadPressState,
} from "../lib/formAnalysis/overheadPress";
import { buildPose, KP } from "./testHelpers";

/**
 * Build a pose for overhead press positions.
 * Standing person facing camera:
 * - Shoulders at y=200, hips at y=350, ankles at y=500
 * - Wrists position varies by phase
 */
function bottomPose() {
  // Bar at shoulder height — wrists near shoulders
  return buildPose({
    [KP.LEFT_SHOULDER]: { x: 120, y: 200 },
    [KP.RIGHT_SHOULDER]: { x: 180, y: 200 },
    [KP.LEFT_ELBOW]: { x: 110, y: 220 },
    [KP.RIGHT_ELBOW]: { x: 190, y: 220 },
    [KP.LEFT_WRIST]: { x: 115, y: 195 },
    [KP.RIGHT_WRIST]: { x: 185, y: 195 },
    [KP.LEFT_HIP]: { x: 130, y: 350 },
    [KP.RIGHT_HIP]: { x: 170, y: 350 },
    [KP.LEFT_ANKLE]: { x: 130, y: 500 },
    [KP.RIGHT_ANKLE]: { x: 170, y: 500 },
  });
}

function lockoutPose() {
  // Arms fully extended overhead — wrists well above shoulders, elbows straight
  return buildPose({
    [KP.LEFT_SHOULDER]: { x: 120, y: 200 },
    [KP.RIGHT_SHOULDER]: { x: 180, y: 200 },
    [KP.LEFT_ELBOW]: { x: 120, y: 130 },
    [KP.RIGHT_ELBOW]: { x: 180, y: 130 },
    [KP.LEFT_WRIST]: { x: 120, y: 60 },
    [KP.RIGHT_WRIST]: { x: 180, y: 60 },
    [KP.LEFT_HIP]: { x: 130, y: 350 },
    [KP.RIGHT_HIP]: { x: 170, y: 350 },
    [KP.LEFT_ANKLE]: { x: 130, y: 500 },
    [KP.RIGHT_ANKLE]: { x: 170, y: 500 },
  });
}

function pressingPose() {
  // Mid-press — wrists above shoulders but elbows still bent
  return buildPose({
    [KP.LEFT_SHOULDER]: { x: 120, y: 200 },
    [KP.RIGHT_SHOULDER]: { x: 180, y: 200 },
    [KP.LEFT_ELBOW]: { x: 115, y: 155 },
    [KP.RIGHT_ELBOW]: { x: 185, y: 155 },
    [KP.LEFT_WRIST]: { x: 120, y: 110 },
    [KP.RIGHT_WRIST]: { x: 180, y: 110 },
    [KP.LEFT_HIP]: { x: 130, y: 350 },
    [KP.RIGHT_HIP]: { x: 170, y: 350 },
    [KP.LEFT_ANKLE]: { x: 130, y: 500 },
    [KP.RIGHT_ANKLE]: { x: 170, y: 500 },
  });
}

function runFrames(
  poses: ReturnType<typeof buildPose>[],
  initialState?: OverheadPressState
) {
  let state = initialState ?? createOverheadPressState();
  const events: { completedRep: boolean; flag: string | null }[] = [];

  for (const pose of poses) {
    const result = processOverheadPressFrame(pose, state);
    state = result.state;
    if (result.completedRep) {
      events.push({ completedRep: true, flag: result.flag });
    }
  }

  return { state, events };
}

describe("overheadPress", () => {
  it("starts with zero reps", () => {
    const state = createOverheadPressState();
    expect(state.repCount).toBe(0);
    expect(state.phase).toBe("bottom");
  });

  it("counts a full rep cycle", () => {
    // bottom → press up → lockout → lower (1 frame) → bottom (completes)
    const { state, events } = runFrames([
      bottomPose(),
      pressingPose(),
      lockoutPose(),
      bottomPose(), // transitions top → lowering
      bottomPose(), // transitions lowering → complete
    ]);

    expect(events.length).toBe(1);
    expect(events[0].completedRep).toBe(true);
    expect(state.repCount).toBe(1);
  });

  it("counts multiple reps", () => {
    const cycle = [
      bottomPose(),
      pressingPose(),
      lockoutPose(),
      bottomPose(), // top → lowering
      bottomPose(), // lowering → complete
    ];
    const { state, events } = runFrames([...cycle, ...cycle, ...cycle]);

    expect(events.length).toBe(3);
    expect(state.repCount).toBe(3);
  });

  it("returns null when keypoints are missing", () => {
    const emptyPose = buildPose({});
    const state = createOverheadPressState();
    const result = processOverheadPressFrame(emptyPose, state);
    expect(result.completedRep).toBe(false);
    expect(result.flag).toBeNull();
  });

  it("detects uneven press flag", () => {
    // One wrist much higher than the other during press
    const unevenPose = buildPose({
      [KP.LEFT_SHOULDER]: { x: 120, y: 200 },
      [KP.RIGHT_SHOULDER]: { x: 180, y: 200 },
      [KP.LEFT_ELBOW]: { x: 120, y: 130 },
      [KP.RIGHT_ELBOW]: { x: 180, y: 160 },
      [KP.LEFT_WRIST]: { x: 120, y: 60 },
      [KP.RIGHT_WRIST]: { x: 180, y: 120 }, // much lower than left
      [KP.LEFT_HIP]: { x: 130, y: 350 },
      [KP.RIGHT_HIP]: { x: 170, y: 350 },
      [KP.LEFT_ANKLE]: { x: 130, y: 500 },
      [KP.RIGHT_ANKLE]: { x: 170, y: 500 },
    });

    const { events } = runFrames([
      bottomPose(),
      pressingPose(), // bottom → pressing
      unevenPose,     // pressing phase, collects uneven_press flag
      lockoutPose(),  // pressing → top
      bottomPose(),   // top → lowering
      bottomPose(),   // lowering → complete
    ]);

    expect(events.length).toBe(1);
    expect(events[0].flag).toBe("uneven_press");
  });
});
