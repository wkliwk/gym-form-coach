import type { Keypoint, Pose } from "@tensorflow-models/pose-detection";

/**
 * Compute angle at vertex B in triangle A-B-C (in degrees).
 */
export function angleDeg(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
  if (magAB === 0 || magCB === 0) return 180;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

/**
 * Return a keypoint from a pose if it meets the minimum confidence threshold.
 */
export function getKeypoint(
  pose: Pose,
  index: number,
  minConfidence = 0.3
): Keypoint | null {
  const kp = pose.keypoints[index];
  if (!kp || (kp.score ?? 0) < minConfidence) return null;
  return kp;
}
