/**
 * poseEstimation.ts
 *
 * TF.js + MoveNet wrapper for React Native.
 *
 * Approach: expo-camera CameraView with periodic takePictureAsync snapshots.
 * Frames are decoded via decodeJpeg (tfjs-react-native) and fed to MoveNet
 * SINGLEPOSE_LIGHTNING (~5 fps achievable on device; limited by snapshot
 * capture pipeline rather than model inference).
 *
 * Why not cameraWithTensors?
 *   @tensorflow/tfjs-react-native@1.0.0 wraps the old expo-camera v13 Camera
 *   class. expo-camera v55 removed that class (now CameraView only), so the
 *   HOC no longer compiles. A future upgrade to react-native-vision-camera +
 *   frame processors would unlock real 15-30 fps; this snapshot approach
 *   unblocks issue #3 form analysis immediately.
 */

import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';

export type { Keypoint, Pose } from '@tensorflow-models/pose-detection';

// MoveNet outputs 17 COCO keypoints
export const KEYPOINT_NAMES = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
] as const;

export type KeypointName = (typeof KEYPOINT_NAMES)[number];

// Skeleton edges: pairs of keypoint indices to draw lines between
export const SKELETON_EDGES: [number, number][] = [
  [0, 1], // nose -> left_eye
  [0, 2], // nose -> right_eye
  [1, 3], // left_eye -> left_ear
  [2, 4], // right_eye -> right_ear
  [5, 6], // left_shoulder -> right_shoulder
  [5, 7], // left_shoulder -> left_elbow
  [7, 9], // left_elbow -> left_wrist
  [6, 8], // right_shoulder -> right_elbow
  [8, 10], // right_elbow -> right_wrist
  [5, 11], // left_shoulder -> left_hip
  [6, 12], // right_shoulder -> right_hip
  [11, 12], // left_hip -> right_hip
  [11, 13], // left_hip -> left_knee
  [13, 15], // left_knee -> left_ankle
  [12, 14], // right_hip -> right_knee
  [14, 16], // right_knee -> right_ankle
];

let detector: poseDetection.PoseDetector | null = null;
let isInitializing = false;

/**
 * Initialize TF.js and load MoveNet SINGLEPOSE_LIGHTNING.
 * Safe to call multiple times — returns early if already ready.
 */
export async function initPoseDetector(): Promise<void> {
  if (detector !== null || isInitializing) return;

  isInitializing = true;
  try {
    await tf.ready();

    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
        minPoseScore: 0.25,
      },
    );
  } finally {
    isInitializing = false;
  }
}

/**
 * Run pose estimation on a base64-encoded JPEG string.
 * Returns an array of Pose objects (typically 1 for SinglePose models).
 *
 * @param base64Jpeg - raw base64 string (no data URI prefix)
 * @returns poses array, empty if detector not ready or inference fails
 */
export async function estimatePosesFromBase64(
  base64Jpeg: string,
): Promise<poseDetection.Pose[]> {
  if (detector === null) return [];

  let imageTensor: tf.Tensor3D | null = null;
  try {
    // Convert base64 JPEG → Uint8Array → tf.Tensor3D
    const binaryStr = atob(base64Jpeg);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    imageTensor = decodeJpeg(bytes);
    const poses = await detector.estimatePoses(imageTensor);
    return poses;
  } catch (error) {
    if (__DEV__) {
      console.warn('[poseEstimation] estimatePoses error:', error);
    }
    return [];
  } finally {
    imageTensor?.dispose();
  }
}

/**
 * Dispose the detector and free memory. Call on component unmount.
 */
export function disposePoseDetector(): void {
  detector?.dispose();
  detector = null;
}
