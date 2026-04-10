import {
  createBenchPressState,
  processBenchPressFrame,
  getBenchPressCue,
  type BenchPressState,
} from "../lib/formAnalysis/benchPress";
import { buildPose, KP, pointAtAngle } from "./testHelpers";

/**
 * Build a bench press pose with a configurable elbow angle (shoulder-elbow-wrist).
 *
 * The person is lying on a bench, viewed from the side.
 * Elbow is fixed at (200, 300); shoulder is above/behind it; wrist is below/in front.
 *
 * Angle convention: shoulder-elbow-wrist angle.
 * - Full lockout: ~165° (arms nearly straight)
 * - Bottom position: ~70° (bar at chest, elbows at ~90°)
 */
function benchPressLateralPose(
  elbowAngleDeg: number,
  opts: {
    elbowFlare?: boolean;
    wristRollover?: boolean;
    incompleteLockout?: boolean;
  } = {}
) {
  // Fixed reference points
  const elbowX = 200;
  const elbowY = 300;
  const wristLen = 80;

  // Wrist is "forward" in horizontal plane (larger X) in side view
  const wristX = elbowX + wristLen;
  const wristY = elbowY;

  // Shoulder is computed from the elbow angle
  const shoulderPos = pointAtAngle(elbowX, elbowY, wristX, wristY, elbowAngleDeg, 100);
  const shoulderX = shoulderPos.x;
  const shoulderY = shoulderPos.y;

  // For elbow flare detection: elbow X width > shoulder X width * 1.3
  // Flare: place elbows much wider than shoulders
  const leftShoulderX = opts.elbowFlare ? 160 : 170;
  const rightShoulderX = opts.elbowFlare ? 240 : 230;
  const leftElbowX = opts.elbowFlare ? 100 : 175; // very wide when flaring
  const rightElbowX = opts.elbowFlare ? 300 : 225; // very wide when flaring

  // For wrist rollover: wrist.y < elbow.y - 15 (wrist higher than elbow in image space)
  const leftWristY = opts.wristRollover ? elbowY - 30 : elbowY + 10;
  const rightWristY = opts.wristRollover ? elbowY - 30 : elbowY + 10;

  return buildPose({
    [KP.LEFT_SHOULDER]: { x: leftShoulderX, y: shoulderY },
    [KP.RIGHT_SHOULDER]: { x: rightShoulderX, y: shoulderY },
    [KP.LEFT_ELBOW]: { x: leftElbowX, y: elbowY },
    [KP.RIGHT_ELBOW]: { x: rightElbowX, y: elbowY },
    [KP.LEFT_WRIST]: { x: elbowX - wristLen, y: leftWristY },
    [KP.RIGHT_WRIST]: { x: elbowX + wristLen, y: rightWristY },
  });
}

/**
 * Simpler pose builder for rep detection tests — uses a single side (left).
 * Elbow angle is shoulder-elbow-wrist.
 */
function singleSidePose(elbowAngleDeg: number) {
  const elbowX = 200;
  const elbowY = 300;
  const wristLen = 80;
  const wristX = elbowX + wristLen;
  const wristY = elbowY;

  const shoulderPos = pointAtAngle(elbowX, elbowY, wristX, wristY, elbowAngleDeg, 100);

  return buildPose({
    [KP.LEFT_SHOULDER]: { x: shoulderPos.x, y: shoulderPos.y },
    [KP.LEFT_ELBOW]: { x: elbowX, y: elbowY },
    [KP.LEFT_WRIST]: { x: wristX, y: wristY },
  });
}

function runFrames(
  poses: ReturnType<typeof buildPose>[],
  initialState?: BenchPressState
) {
  let state = initialState ?? createBenchPressState();
  const events: { completedRep: boolean; flag: string | null; allFlags: string[] }[] = [];

  for (const pose of poses) {
    const result = processBenchPressFrame(pose, state);
    state = result.state;
    if (result.completedRep) {
      events.push({
        completedRep: true,
        flag: result.flag,
        allFlags: result.allFlags,
      });
    }
  }

  return { state, events };
}

// ── State initialization ──────────────────────────────────────────────────────

describe("createBenchPressState", () => {
  it("initialises with zero reps and start phase", () => {
    const state = createBenchPressState();
    expect(state.repCount).toBe(0);
    expect(state.phase).toBe("start");
    expect(state.currentRepFlags).toEqual([]);
  });
});

// ── Rep detection ─────────────────────────────────────────────────────────────

describe("benchPress rep detection", () => {
  it("counts a full rep cycle: start → descend → bottom → ascend → lockout", () => {
    let state = createBenchPressState();

    // Start: arms locked out (elbow ~165°)
    let result = processBenchPressFrame(singleSidePose(165), state);
    state = result.state;
    expect(result.completedRep).toBe(false);
    expect(state.phase).toBe("start");

    // Begin descent (elbow ~130°, drops below 150 threshold)
    result = processBenchPressFrame(singleSidePose(130), state);
    state = result.state;
    expect(state.phase).toBe("descending");

    // Bottom (elbow ~70°, below 90 threshold)
    result = processBenchPressFrame(singleSidePose(70), state);
    state = result.state;
    expect(state.phase).toBe("bottom");

    // Ascending (elbow ~110°, above 100 threshold)
    result = processBenchPressFrame(singleSidePose(110), state);
    state = result.state;
    expect(state.phase).toBe("ascending");

    // Lockout (elbow ~160°, above 150 threshold — rep complete)
    result = processBenchPressFrame(singleSidePose(160), state);
    expect(result.completedRep).toBe(true);
    expect(result.state.repCount).toBe(1);
    expect(result.state.phase).toBe("start");
  });

  it("counts multiple reps in sequence", () => {
    function doRep(s: BenchPressState): BenchPressState {
      const frames = [
        singleSidePose(130), // descend
        singleSidePose(70),  // bottom
        singleSidePose(110), // ascending
        singleSidePose(160), // lockout
      ];
      let current = s;
      for (const frame of frames) {
        current = processBenchPressFrame(frame, current).state;
      }
      return current;
    }

    let state = createBenchPressState();
    state = doRep(state);
    state = doRep(state);
    state = doRep(state);

    expect(state.repCount).toBe(3);
  });

  it("returns no completed rep when required keypoints are missing", () => {
    const state = createBenchPressState();
    const emptyPose = buildPose({});
    const result = processBenchPressFrame(emptyPose, state);
    expect(result.completedRep).toBe(false);
    expect(result.state.repCount).toBe(0);
  });

  it("does not count a rep if the ascent never reaches lockout threshold", () => {
    // Descend to bottom but only come back partway — no rep counted
    const { state, events } = runFrames([
      singleSidePose(130), // descend
      singleSidePose(70),  // bottom
      singleSidePose(110), // ascending but stops here
      singleSidePose(120), // still not at lockout
    ]);

    expect(events.length).toBe(0);
    expect(state.repCount).toBe(0);
  });

  it("resets flags after rep completion", () => {
    let state = createBenchPressState();
    const frames = [
      singleSidePose(130),
      singleSidePose(70),
      singleSidePose(110),
      singleSidePose(160),
    ];
    for (const frame of frames) {
      const result = processBenchPressFrame(frame, state);
      state = result.state;
    }
    // After rep completes, currentRepFlags should be reset
    expect(state.currentRepFlags).toEqual([]);
  });
});

// ── Flag detection ────────────────────────────────────────────────────────────

describe("benchPress flag detection", () => {
  it("detects wrist_rollover when wrist is significantly above elbow in image space", () => {
    // Wrist rollover pose: wristY < elbowY - 15
    const rolloverPose = buildPose({
      [KP.LEFT_SHOULDER]: { x: 170, y: 200 },
      [KP.RIGHT_SHOULDER]: { x: 230, y: 200 },
      [KP.LEFT_ELBOW]: { x: 175, y: 300 },
      [KP.RIGHT_ELBOW]: { x: 225, y: 300 },
      [KP.LEFT_WRIST]: { x: 120, y: 270 },  // y < elbow_y - 15 → rollover
      [KP.RIGHT_WRIST]: { x: 280, y: 270 }, // y < elbow_y - 15 → rollover
    });

    const { events } = runFrames([
      singleSidePose(130), // enter descending
      rolloverPose,         // flag collected
      singleSidePose(70),  // bottom
      singleSidePose(110), // ascending
      singleSidePose(160), // lockout — rep complete
    ]);

    expect(events.length).toBe(1);
    expect(events[0].allFlags).toContain("wrist_rollover");
  });

  it("detects elbows_flaring when elbow width exceeds shoulder width * 1.3", () => {
    // Elbow flare: elbowWidth (200) >> shoulderWidth (60) * 1.3 (78)
    const flarePose = buildPose({
      [KP.LEFT_SHOULDER]: { x: 170, y: 200 },
      [KP.RIGHT_SHOULDER]: { x: 230, y: 200 }, // shoulder width = 60
      [KP.LEFT_ELBOW]: { x: 100, y: 300 },
      [KP.RIGHT_ELBOW]: { x: 300, y: 300 },   // elbow width = 200 >> 78
      [KP.LEFT_WRIST]: { x: 120, y: 310 },
      [KP.RIGHT_WRIST]: { x: 280, y: 310 },
    });

    const { events } = runFrames([
      singleSidePose(130), // enter descending
      flarePose,            // flag collected
      singleSidePose(70),  // bottom
      singleSidePose(110), // ascending
      singleSidePose(160), // lockout — rep complete
    ]);

    expect(events.length).toBe(1);
    expect(events[0].allFlags).toContain("elbows_flaring");
  });

  it("returns null flag for a clean rep", () => {
    // All poses within normal parameters
    const cleanPose = buildPose({
      [KP.LEFT_SHOULDER]: { x: 170, y: 200 },
      [KP.RIGHT_SHOULDER]: { x: 230, y: 200 },
      [KP.LEFT_ELBOW]: { x: 175, y: 300 },
      [KP.RIGHT_ELBOW]: { x: 225, y: 300 }, // elbowWidth (50) < shoulderWidth (60) * 1.3
      [KP.LEFT_WRIST]: { x: 120, y: 310 },  // wristY > elbowY → no rollover
      [KP.RIGHT_WRIST]: { x: 280, y: 310 },
    });

    const { events } = runFrames([
      singleSidePose(130), // enter descending
      cleanPose,            // no flags
      singleSidePose(70),  // bottom
      cleanPose,            // no flags
      singleSidePose(110), // ascending
      cleanPose,            // no flags
      singleSidePose(160), // lockout — rep complete
    ]);

    expect(events.length).toBe(1);
    expect(events[0].flag).toBeNull();
    expect(events[0].allFlags).toEqual([]);
  });

  it("only records each flag once per rep even if triggered multiple frames", () => {
    const rolloverPose = buildPose({
      [KP.LEFT_SHOULDER]: { x: 170, y: 200 },
      [KP.RIGHT_SHOULDER]: { x: 230, y: 200 },
      [KP.LEFT_ELBOW]: { x: 175, y: 300 },
      [KP.RIGHT_ELBOW]: { x: 225, y: 300 },
      [KP.LEFT_WRIST]: { x: 120, y: 270 },
      [KP.RIGHT_WRIST]: { x: 280, y: 270 },
    });

    const { events } = runFrames([
      singleSidePose(130), // enter descending
      rolloverPose,         // flag collected
      rolloverPose,         // same flag — should not duplicate
      singleSidePose(70),  // bottom
      singleSidePose(110), // ascending
      singleSidePose(160), // lockout
    ]);

    expect(events.length).toBe(1);
    expect(events[0].allFlags.filter((f) => f === "wrist_rollover").length).toBe(1);
  });
});

// ── Audio cues ────────────────────────────────────────────────────────────────

describe("getBenchPressCue", () => {
  it("returns correct cue for wrist_rollover", () => {
    expect(getBenchPressCue("wrist_rollover")).toBe("Keep wrists straight");
  });

  it("returns correct cue for elbows_flaring", () => {
    expect(getBenchPressCue("elbows_flaring")).toBe("Tuck your elbows");
  });

  it("returns correct cue for incomplete_lockout", () => {
    expect(getBenchPressCue("incomplete_lockout")).toBe("Lock it out at the top");
  });

  it("returns Good rep for null flag (clean rep)", () => {
    expect(getBenchPressCue(null)).toBe("Good rep");
  });

  it("returns Good rep for any unrecognised flag", () => {
    // TypeScript won't allow passing an invalid FormFlag directly,
    // but at runtime an unexpected value should still return "Good rep"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getBenchPressCue("bar_drift" as any)).toBe("Good rep");
  });
});
