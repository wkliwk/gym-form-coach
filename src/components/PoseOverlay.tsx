/**
 * PoseOverlay.tsx
 *
 * Renders a skeleton overlay on top of the camera feed using react-native-svg.
 * Takes MoveNet keypoints (normalized 0–1 coordinates) and maps them to the
 * display dimensions of the camera view.
 *
 * MoveNet keypoint coordinates are in pixel space relative to the input tensor
 * dimensions. We normalize to [0,1] before scaling to display size, which
 * makes this component resolution-independent.
 */

import React, { memo } from 'react';
import Svg, { Circle, Line } from 'react-native-svg';
import type { Pose, Keypoint } from '@tensorflow-models/pose-detection';
import { SKELETON_EDGES } from '../lib/poseEstimation';

interface PoseOverlayProps {
  poses: Pose[];
  /** Width of the camera view in display pixels */
  viewWidth: number;
  /** Height of the camera view in display pixels */
  viewHeight: number;
  /**
   * Width of the tensor/image used for inference.
   * MoveNet input is 192x192 for Lightning.
   * Set to match the actual tensor width so coordinates scale correctly.
   */
  inferenceWidth?: number;
  inferenceHeight?: number;
  /** Minimum keypoint confidence score to render */
  minScore?: number;
}

const JOINT_RADIUS = 6;
const BONE_STROKE_WIDTH = 2;
const JOINT_FILL = '#00E5FF'; // cyan
const BONE_STROKE = '#00E5FF';
const LOW_CONF_FILL = 'rgba(255,255,255,0.3)';

function PoseOverlay({
  poses,
  viewWidth,
  viewHeight,
  inferenceWidth = 192,
  inferenceHeight = 192,
  minScore = 0.3,
}: PoseOverlayProps): React.ReactElement | null {
  if (poses.length === 0 || viewWidth === 0 || viewHeight === 0) return null;

  const scaleX = viewWidth / inferenceWidth;
  const scaleY = viewHeight / inferenceHeight;

  const elements: React.ReactElement[] = [];

  poses.forEach((pose, poseIdx) => {
    const kps = pose.keypoints;

    // Draw skeleton bones (lines between keypoint pairs)
    SKELETON_EDGES.forEach(([aIdx, bIdx], edgeIdx) => {
      const kpA: Keypoint | undefined = kps[aIdx];
      const kpB: Keypoint | undefined = kps[bIdx];

      if (
        kpA === undefined ||
        kpB === undefined ||
        (kpA.score ?? 0) < minScore ||
        (kpB.score ?? 0) < minScore
      ) {
        return;
      }

      elements.push(
        <Line
          key={`bone-${poseIdx}-${edgeIdx}`}
          x1={kpA.x * scaleX}
          y1={kpA.y * scaleY}
          x2={kpB.x * scaleX}
          y2={kpB.y * scaleY}
          stroke={BONE_STROKE}
          strokeWidth={BONE_STROKE_WIDTH}
          strokeOpacity={0.85}
        />,
      );
    });

    // Draw joints (circles at keypoint positions)
    kps.forEach((kp, kpIdx) => {
      const score = kp.score ?? 0;
      const isVisible = score >= minScore;

      elements.push(
        <Circle
          key={`joint-${poseIdx}-${kpIdx}`}
          cx={kp.x * scaleX}
          cy={kp.y * scaleY}
          r={JOINT_RADIUS}
          fill={isVisible ? JOINT_FILL : LOW_CONF_FILL}
          fillOpacity={isVisible ? 0.9 : 0.4}
        />,
      );
    });
  });

  return (
    <Svg
      width={viewWidth}
      height={viewHeight}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {elements}
    </Svg>
  );
}

export default memo(PoseOverlay);
