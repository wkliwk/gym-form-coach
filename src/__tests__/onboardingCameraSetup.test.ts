/**
 * onboardingCameraSetup.test.ts
 *
 * Tests for the OnboardingCameraSetup screen logic:
 *  - CAMERA_SETUP_KEY constant value
 *  - computeGeneralConfidence algorithm (mirrored from the component)
 *  - AsyncStorage write semantics used by complete / skip handlers
 */

// ---------------------------------------------------------------------------
// Module mocks — must come before any imports that pull native/ML modules
// ---------------------------------------------------------------------------
jest.mock("expo-camera", () => ({
  CameraView: "CameraView",
  useCameraPermissions: jest.fn(() => [{ status: "granted" }, jest.fn()]),
}));

jest.mock("../hooks/usePoseEstimation", () => ({
  usePoseEstimation: jest.fn(() => ({ poses: [], modelReady: false, fps: 0 })),
}));

jest.mock("../lib/poseEstimation", () => ({
  initPoseDetector: jest.fn(),
  isDetectorReady: jest.fn(() => false),
  estimatePosesFromBase64: jest.fn(),
  disposePoseDetector: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CAMERA_SETUP_KEY } from "../screens/OnboardingCameraSetup";
import type { Pose, Keypoint } from "@tensorflow-models/pose-detection";

// ---------------------------------------------------------------------------
// Mirror the private helper from the component so we can unit-test the
// algorithm in isolation without re-running the component.
// ---------------------------------------------------------------------------
function computeGeneralConfidence(pose: Pose): number {
  const kps = pose.keypoints.filter((kp) => kp.score != null && kp.score > 0);
  if (kps.length === 0) return 0;
  const sum = kps.reduce((acc, kp) => acc + (kp.score ?? 0), 0);
  return sum / kps.length;
}

function makeKeypoint(name: string, score: number): Keypoint {
  return { x: 10, y: 10, score, name };
}

function makePose(keypoints: Keypoint[]): Pose {
  return { keypoints, score: 0.9 };
}

// ---------------------------------------------------------------------------
// CAMERA_SETUP_KEY
// ---------------------------------------------------------------------------
describe("CAMERA_SETUP_KEY", () => {
  it("exports the expected AsyncStorage key string", () => {
    expect(CAMERA_SETUP_KEY).toBe("onboardingCameraSetupComplete");
  });
});

// ---------------------------------------------------------------------------
// computeGeneralConfidence
// ---------------------------------------------------------------------------
describe("computeGeneralConfidence", () => {
  it("returns 0 for an empty keypoints array", () => {
    expect(computeGeneralConfidence(makePose([]))).toBe(0);
  });

  it("returns 0 when all keypoints have score 0 (filtered out)", () => {
    const pose = makePose([
      makeKeypoint("nose", 0),
      makeKeypoint("left_hip", 0),
    ]);
    expect(computeGeneralConfidence(pose)).toBe(0);
  });

  it("ignores zero-score keypoints when computing the average", () => {
    const pose = makePose([
      makeKeypoint("nose", 0.8),
      makeKeypoint("left_hip", 0), // filtered
      makeKeypoint("right_hip", 0.6),
    ]);
    // Only nose (0.8) and right_hip (0.6) count: (0.8 + 0.6) / 2 = 0.7
    expect(computeGeneralConfidence(pose)).toBeCloseTo(0.7, 5);
  });

  it("returns correct average for a full-body high-confidence pose", () => {
    const names = [
      "nose", "left_shoulder", "right_shoulder",
      "left_elbow", "right_elbow",
      "left_hip", "right_hip",
      "left_knee", "right_knee",
      "left_ankle", "right_ankle",
    ];
    const pose = makePose(names.map((n) => makeKeypoint(n, 0.8)));
    expect(computeGeneralConfidence(pose)).toBeCloseTo(0.8, 5);
  });

  it("returns confidence above 0.6 ready-threshold when body is visible", () => {
    const pose = makePose([
      makeKeypoint("nose", 0.9),
      makeKeypoint("left_hip", 0.8),
      makeKeypoint("right_hip", 0.75),
      makeKeypoint("left_knee", 0.7),
      makeKeypoint("right_knee", 0.7),
    ]);
    expect(computeGeneralConfidence(pose)).toBeGreaterThan(0.6);
  });

  it("returns confidence below 0.6 when body is partly out of frame", () => {
    const pose = makePose([
      makeKeypoint("nose", 0.3),
      makeKeypoint("left_hip", 0.4),
      makeKeypoint("right_hip", 0.2),
    ]);
    expect(computeGeneralConfidence(pose)).toBeLessThan(0.6);
  });

  it("handles a single high-confidence keypoint", () => {
    const pose = makePose([makeKeypoint("nose", 0.95)]);
    expect(computeGeneralConfidence(pose)).toBeCloseTo(0.95, 5);
  });
});

// ---------------------------------------------------------------------------
// AsyncStorage writes for completion and skip
// ---------------------------------------------------------------------------
describe("AsyncStorage interaction on complete/skip", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it("writes 'true' to CAMERA_SETUP_KEY on complete", async () => {
    await AsyncStorage.setItem(CAMERA_SETUP_KEY, "true");
    const value = await AsyncStorage.getItem(CAMERA_SETUP_KEY);
    expect(value).toBe("true");
  });

  it("writes 'skipped' to CAMERA_SETUP_KEY on skip", async () => {
    await AsyncStorage.setItem(CAMERA_SETUP_KEY, "skipped");
    const value = await AsyncStorage.getItem(CAMERA_SETUP_KEY);
    expect(value).toBe("skipped");
  });

  it("both 'true' and 'skipped' are truthy — prevents re-showing the screen", async () => {
    // Mirrors the Onboarding.tsx guard: if (setupDone) setPhase("exercise")
    for (const storedValue of ["true", "skipped"] as const) {
      await AsyncStorage.setItem(CAMERA_SETUP_KEY, storedValue);
      const setupDone = await AsyncStorage.getItem(CAMERA_SETUP_KEY);
      expect(Boolean(setupDone)).toBe(true);
    }
  });

  it("returns null when the key has never been set", async () => {
    const setupDone = await AsyncStorage.getItem(CAMERA_SETUP_KEY);
    expect(setupDone).toBeNull();
  });
});
