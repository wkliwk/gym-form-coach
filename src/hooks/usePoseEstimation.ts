/**
 * usePoseEstimation.ts
 *
 * Manages TF.js initialization and drives the pose estimation loop.
 *
 * Loop strategy: interval-based snapshot capture with skip-if-busy.
 * expo-camera CameraView.takePictureAsync is async — we capture at 100ms
 * intervals but skip if the previous frame is still processing.
 * This achieves ~5-8fps depending on device.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CameraView } from 'expo-camera';
import type { Pose } from '@tensorflow-models/pose-detection';
import {
  initPoseDetector,
  estimatePosesFromBase64,
  disposePoseDetector,
} from '../lib/poseEstimation';

const CAPTURE_INTERVAL_MS = 100; // 10fps target, actual ~5-8fps after inference
const SNAPSHOT_QUALITY = 0.3;

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

  const isProcessing = useRef(false);
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

  // Pose estimation loop — skip-if-busy for max throughput
  useEffect(() => {
    if (!modelReady || !isCameraReady || !enabled) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (isProcessing.current) return; // skip — still processing previous frame

      const camera = cameraRef.current;
      if (camera === null) return;

      isProcessing.current = true;

      void (async () => {
        try {
          const picture = await camera.takePictureAsync({
            quality: SNAPSHOT_QUALITY,
            base64: true,
            skipProcessing: true,
            shutterSound: false,
          } as Parameters<CameraView['takePictureAsync']>[0]);

          if (picture?.base64) {
            const detected = await estimatePosesFromBase64(picture.base64);
            setPoses(detected);
            recordFrame();
          }
        } catch (err) {
          if (__DEV__) {
            console.warn('[usePoseEstimation] capture error:', err);
          }
        } finally {
          isProcessing.current = false;
        }
      })();
    }, CAPTURE_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [modelReady, isCameraReady, enabled, cameraRef, recordFrame]);

  return { poses, modelReady, fps };
}
