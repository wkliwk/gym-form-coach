/**
 * Session.tsx
 *
 * Main camera screen: full-screen camera view + pose overlay + dev FPS counter.
 *
 * Layout:
 *   - CameraView (full screen, back camera)
 *   - PoseOverlay (absolute, fills camera view)
 *   - FPS counter (dev only, top-right corner)
 *   - Camera permission denied screen (inline)
 *
 * The camera renders continuously; pose estimation is gated on
 * modelReady + isCameraReady.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { useCamera } from '../hooks/useCamera';
import { usePoseEstimation } from '../hooks/usePoseEstimation';
import PoseOverlay from '../components/PoseOverlay';

export default function Session(): React.ReactElement {
  const { cameraRef, permissionState, requestPermission, openSettings } =
    useCamera();

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });

  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  const { poses, modelReady, fps } = usePoseEstimation({
    cameraRef,
    isCameraReady,
    enabled: permissionState === 'granted',
  });

  // ── Permission: loading ──────────────────────────────────────────────────
  if (permissionState === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00E5FF" />
      </View>
    );
  }

  // ── Permission: denied ───────────────────────────────────────────────────
  if (permissionState === 'denied') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionBody}>
          Gym Form Coach needs camera access to analyze your movements in real
          time. Please enable it in Settings.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.permissionButton,
            pressed && styles.permissionButtonPressed,
          ]}
          onPress={openSettings}
          accessibilityRole="button"
          accessibilityLabel="Open Settings to enable camera"
        >
          <Text style={styles.permissionButtonText}>Enable Camera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Permission: undetermined (still requesting) ──────────────────────────
  if (permissionState === 'undetermined') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.permissionTitle}>Allow Camera Access</Text>
        <Text style={styles.permissionBody}>
          Gym Form Coach uses your camera to provide real-time form feedback.
          Your video never leaves your device.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.permissionButton,
            pressed && styles.permissionButtonPressed,
          ]}
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel="Allow camera access"
        >
          <Text style={styles.permissionButtonText}>Allow Camera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Camera granted ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={handleCameraReady}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setOverlaySize({ width, height });
        }}
      />

      {/* Pose skeleton overlay */}
      {overlaySize.width > 0 && overlaySize.height > 0 && (
        <PoseOverlay
          poses={poses}
          viewWidth={overlaySize.width}
          viewHeight={overlaySize.height}
        />
      )}

      {/* Model loading indicator */}
      {!modelReady && (
        <View style={styles.modelLoadingBadge} pointerEvents="none">
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.modelLoadingText}>Loading model…</Text>
        </View>
      )}

      {/* FPS counter — dev only */}
      {__DEV__ && modelReady && (
        <View style={styles.fpsBadge} pointerEvents="none">
          <Text style={styles.fpsText}>{fps} fps</Text>
        </View>
      )}

      {/* Safety banner — always visible during session */}
      <View style={styles.safetyBanner} pointerEvents="none">
        <Text style={styles.safetyText}>
          Movement guide — stop if you feel pain
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  // Permission screens
  permissionTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionBody: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#00E5FF',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  permissionButtonPressed: {
    opacity: 0.7,
  },
  permissionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  // Overlays
  modelLoadingBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  modelLoadingText: {
    color: '#ffffff',
    fontSize: 13,
  },
  fpsBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 24,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  fpsText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  safetyBanner: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  safetyText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
});
