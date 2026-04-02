/**
 * useCamera.ts
 *
 * Manages camera permissions using react-native-vision-camera.
 * Provides device selection and permission state for Session screen.
 */

import { useEffect, useCallback, useState } from "react";
import { Linking } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  type CameraDevice,
} from "react-native-vision-camera";

export type CameraPermissionState =
  | "undetermined"
  | "granted"
  | "denied"
  | "loading";

export interface UseCameraReturn {
  device: CameraDevice | undefined;
  permissionState: CameraPermissionState;
  requestPermission: () => Promise<void>;
  openSettings: () => void;
}

export function useCamera(): UseCameraReturn {
  const { hasPermission, requestPermission: requestCameraPermission } =
    useCameraPermission();
  const device = useCameraDevice("back");
  const [hasRequested, setHasRequested] = useState(false);

  // Auto-request on mount
  useEffect(() => {
    if (!hasPermission && !hasRequested) {
      setHasRequested(true);
      void requestCameraPermission();
    }
  }, [hasPermission, hasRequested, requestCameraPermission]);

  const requestPermission = useCallback(async () => {
    await requestCameraPermission();
  }, [requestCameraPermission]);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  let permissionState: CameraPermissionState;
  if (!hasRequested && !hasPermission) {
    permissionState = "undetermined";
  } else if (hasPermission) {
    permissionState = "granted";
  } else if (hasRequested && !hasPermission) {
    permissionState = "denied";
  } else {
    permissionState = "loading";
  }

  return {
    device,
    permissionState,
    requestPermission,
    openSettings,
  };
}
