/**
 * useCamera.ts
 *
 * Manages camera permissions and provides a ref to CameraView.
 * Exposes a request function so components can prompt at the right time.
 */

import { useRef, useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  type PermissionStatus,
} from 'expo-camera';

export type CameraPermissionState =
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'loading';

export interface UseCameraReturn {
  cameraRef: React.RefObject<CameraView | null>;
  permissionState: CameraPermissionState;
  requestPermission: () => Promise<void>;
  openSettings: () => void;
}

function mapStatus(status: PermissionStatus | null): CameraPermissionState {
  if (status === null) return 'loading';
  switch (status) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'denied';
    default:
      return 'undetermined';
  }
}

export function useCamera(): UseCameraReturn {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermissionAsync] = useCameraPermissions();

  // Auto-request on first mount if undetermined
  useEffect(() => {
    if (permission !== null && permission.status === 'undetermined') {
      void requestPermissionAsync();
    }
  }, [permission, requestPermissionAsync]);

  const requestPermission = useCallback(async () => {
    await requestPermissionAsync();
  }, [requestPermissionAsync]);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const permissionState = mapStatus(permission?.status ?? null);

  return {
    cameraRef,
    permissionState,
    requestPermission,
    openSettings,
  };
}
