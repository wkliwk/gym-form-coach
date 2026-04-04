import type { Keypoint, Pose } from "@tensorflow-models/pose-detection";

/**
 * COCO keypoint indices used by MoveNet.
 * https://github.com/tensorflow/tfjs-models/tree/master/pose-detection#coco-keypoints
 */
export const KP = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
} as const;

/**
 * Build a minimal Pose with 17 zero-confidence keypoints, then override
 * specific ones via the provided map.
 */
export function buildPose(
  overrides: Partial<Record<number, { x: number; y: number; score?: number }>>
): Pose {
  const keypoints: Keypoint[] = Array.from({ length: 17 }, (_, i) => ({
    x: 0,
    y: 0,
    score: 0,
    name: `kp_${i}`,
  }));

  for (const [idx, val] of Object.entries(overrides)) {
    if (!val) continue;
    const i = Number(idx);
    keypoints[i] = {
      x: val.x,
      y: val.y,
      score: val.score ?? 0.9,
      name: keypoints[i]?.name ?? `kp_${i}`,
    };
  }

  return { keypoints, score: 1 };
}

/**
 * Compute the position of point A given:
 * - vertex B at (bx, by)
 * - point C at (cx, cy)
 * - desired angle θ (degrees) at B in triangle A-B-C
 * - distance from B to A (armLength)
 *
 * Returns the (x, y) of A.
 *
 * Uses: cos(θ) = (BA · BC) / (|BA| * |BC|)
 * We pick A to be positioned at angle θ from the BC direction.
 */
export function pointAtAngle(
  bx: number,
  by: number,
  cx: number,
  cy: number,
  angleDeg: number,
  armLength: number
): { x: number; y: number } {
  // Direction from B to C
  const dx = cx - bx;
  const dy = cy - by;
  const len = Math.sqrt(dx * dx + dy * dy);
  const dirX = dx / len;
  const dirY = dy / len;

  // Rotate BC direction by θ to get BA direction
  const rad = (angleDeg * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  // Rotate (dirX, dirY) by angleDeg
  const ax = cosA * dirX - sinA * dirY;
  const ay = sinA * dirX + cosA * dirY;

  return {
    x: bx + ax * armLength,
    y: by + ay * armLength,
  };
}
