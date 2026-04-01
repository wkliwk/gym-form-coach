/**
 * usePoseEstimation.ts
 *
 * Manages TF.js initialization and drives the pose estimation loop.
 *
 * Loop strategy: interval-based snapshot capture (not requestAnimationFrame)
 * because expo-camera CameraView.takePictureAsync is async and can't be
 * driven at display refresh rate. Target: ~5 fps (200ms interval), which is
 * enough for real-time form feedback without thermal issues.
 *
 * The hook is safe to call whether or not the camera is ready — it gates on
 * isCameraReady and modelReady before starting the loop.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CameraView } from 'expo-camera';
import type { Pose } from '@tensorflow-models/pose-detection';
import {
  initPoseDetector,
  estimatePosesFromBase64,
  disposePoseDetector,
} from '../lib/poseEstimation';

const CAPTURE_INTERVAL_MS = 200; // ~5 fps
const SNAPSHOT_QUALITY = 0.4; // 0–1; lower = smaller JPEG = faster decode

export interface UsePoseEstimationOptions {
  cameraRef: React.RefObject<CameraView | null>;
  isCameraReady: boolean;
  enabled?: boolean;
}

export interface UsePoseEstimationReturn {
  poses: Pose[];
  modelReady: boolean;
  fps: number;
}

export function usePoseEstimation({
  cameraRef,
  isCameraReady,
  enabled = true,
}: UsePoseEstimationOptions): UsePoseEstimationReturn {
  const [poses, setPoses] = useState<Pose[]>([]);
  const [modelReady, setModelReady] = useState(false);
  const [fps, setFps] = useState(0);

  const isRunning = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // FPS tracking
  const frameTimestamps = useRef<number[]>([]);

  // Init TF.js + MoveNet on mount
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await initPoseDetector();
        if (!cancelled) setModelReady(true);
      } catch (err) {
        if (__DEV__) console.error('[usePoseEstimation] init failed:', err);
      }
    })();

    return () => {
      cancelled = true;
      disposePoseDetector();
    };
  }, []);

  // Compute rolling FPS over the last 10 frames
  const recordFrame = useCallback(() => {
    const now = Date.now();
    frameTimestamps.current.push(now);
    // Keep only last 10 timestamps
    if (frameTimestamps.current.length > 10) {
      frameTimestamps.current.shift();
    }
    const count = frameTimestamps.current.length;
    if (count >= 2) {
      const windowMs =
        frameTimestamps.current[count - 1] - frameTimestamps.current[0];
      const rollingFps = Math.round(((count - 1) / windowMs) * 1000);
      setFps(rollingFps);
    }
  }, []);

  // Pose estimation loop
  useEffect(() => {
    if (!modelReady || !isCameraReady || !enabled) {
      // Clear any existing loop
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        isRunning.current = false;
      }
      return;
    }

    isRunning.current = true;

    intervalRef.current = setInterval(() => {
      const camera = cameraRef.current;
      if (camera === null || !isRunning.current) return;

      void (async () => {
        try {
          const picture = await camera.takePictureAsync({
            quality: SNAPSHOT_QUALITY,
            base64: true,
            skipProcessing: true, // faster; orientation may be rotated
            shutterSound: false,
          } as Parameters<CameraView['takePictureAsync']>[0]);

          if (picture?.base64) {
            const detected = await estimatePosesFromBase64(picture.base64);
            setPoses(detected);
            recordFrame();
          }
        } catch (err) {
          // Swallow capture errors — camera may not be ready yet
          if (__DEV__) {
            console.warn('[usePoseEstimation] capture error:', err);
          }
        }
      })();
    }, CAPTURE_INTERVAL_MS);

    return () => {
      isRunning.current = false;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [modelReady, isCameraReady, enabled, cameraRef, recordFrame]);

  return { poses, modelReady, fps };
}
