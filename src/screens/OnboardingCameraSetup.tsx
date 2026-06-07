/**
 * OnboardingCameraSetup.tsx
 *
 * Interactive camera positioning step added after camera permission.
 * Shows a live camera preview with a body guide outline.
 * Detects when the user's full body is visible (confidence > 0.6 for 2s).
 * Falls back to allowing "Continue" after 30 seconds.
 *
 * Shown only once — completion state stored in AsyncStorage.
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { CameraView } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { usePoseEstimation } from "../hooks/usePoseEstimation";
import type { Pose } from "@tensorflow-models/pose-detection";

export const CAMERA_SETUP_KEY = "onboardingCameraSetupComplete";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Confidence threshold to be considered "ready"
const READY_THRESHOLD = 0.6;
// Seconds at threshold before "Continue" auto-enables
const READY_HOLD_SECONDS = 2;
// Seconds before the 30s fallback kicks in
const FALLBACK_SECONDS = 30;

/** Compute average confidence across all detected keypoints. */
function computeGeneralConfidence(pose: Pose): number {
  const kps = pose.keypoints.filter((kp) => kp.score != null && kp.score > 0);
  if (kps.length === 0) return 0;
  const sum = kps.reduce((acc, kp) => acc + (kp.score ?? 0), 0);
  return sum / kps.length;
}

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingCameraSetup({ onComplete, onSkip }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds shown to user
  const readyHoldRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticFiredRef = useRef(false);

  const { poses, modelReady } = usePoseEstimation({
    cameraRef,
    isCameraReady,
  });

  // 30-second fallback timer
  useEffect(() => {
    fallbackRef.current = setTimeout(() => {
      setCanContinue(true);
    }, FALLBACK_SECONDS * 1000);
    return () => {
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
    };
  }, []);

  // Elapsed seconds counter (for UX feedback)
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Evaluate pose confidence
  useEffect(() => {
    if (!modelReady || poses.length === 0) {
      // Model not ready or no pose — reset hold timer
      if (readyHoldRef.current) {
        clearTimeout(readyHoldRef.current);
        readyHoldRef.current = null;
      }
      setIsReady(false);
      return;
    }

    const confidence = computeGeneralConfidence(poses[0]);
    const poseReady = confidence >= READY_THRESHOLD;

    if (poseReady && !isReady) {
      setIsReady(true);
      if (!hapticFiredRef.current) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        hapticFiredRef.current = true;
      }
      // Start hold timer
      readyHoldRef.current = setTimeout(() => {
        setCanContinue(true);
      }, READY_HOLD_SECONDS * 1000);
    } else if (!poseReady && isReady) {
      // Lost confidence — cancel hold timer, reset haptic flag
      setIsReady(false);
      hapticFiredRef.current = false;
      if (readyHoldRef.current) {
        clearTimeout(readyHoldRef.current);
        readyHoldRef.current = null;
      }
    }
  }, [poses, modelReady, isReady]);

  const handleComplete = useCallback(async () => {
    await AsyncStorage.setItem(CAMERA_SETUP_KEY, "true");
    onComplete();
  }, [onComplete]);

  const handleSkip = useCallback(async () => {
    await AsyncStorage.setItem(CAMERA_SETUP_KEY, "skipped");
    onSkip();
  }, [onSkip]);

  const statusColor = isReady ? "#22c55e" : elapsed >= FALLBACK_SECONDS ? "#6366f1" : "#f59e0b";
  const statusText = isReady
    ? "Perfect! Tap Continue"
    : modelReady
    ? "Keep adjusting — can't see full body yet"
    : "Loading pose detection…";

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera preview */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onCameraReady={() => setIsCameraReady(true)}
      />

      {/* Body guide outline */}
      <View style={styles.guideOverlay} pointerEvents="none">
        <View style={styles.guideOutline}>
          {/* Head */}
          <View style={styles.guideHead} />
          {/* Body */}
          <View style={styles.guideBody} />
          {/* Legs */}
          <View style={styles.guideLegs}>
            <View style={styles.guideLeg} />
            <View style={styles.guideLeg} />
          </View>
        </View>
      </View>

      {/* Dim overlay on non-guide areas */}
      <View style={styles.dimOverlay} pointerEvents="none" />

      {/* Status indicator */}
      <View
        style={[styles.statusBadge, { borderColor: statusColor }]}
        pointerEvents="none"
      >
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      {/* Instructions */}
      <View style={styles.instructions} pointerEvents="none">
        <Text style={styles.instructionTitle}>Get Your Camera Ready</Text>
        <Text style={styles.instructionBody}>
          Prop your phone against something stable. Step back until your full
          body fits inside the guide.
        </Text>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          onPress={handleComplete}
          disabled={!canContinue}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          accessibilityState={{ disabled: !canContinue }}
        >
          <Text
            style={[
              styles.continueText,
              !canContinue && styles.continueTextDisabled,
            ]}
          >
            Continue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip camera setup"
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const GUIDE_WIDTH = 120;
const GUIDE_HEIGHT = SCREEN_HEIGHT * 0.55;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  guideOutline: {
    width: GUIDE_WIDTH,
    height: GUIDE_HEIGHT,
    alignItems: "center",
    gap: 0,
    marginTop: -60, // shift slightly upward to center body in frame
  },
  guideHead: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: "transparent",
  },
  guideBody: {
    width: 80,
    height: GUIDE_HEIGHT * 0.38,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: 4,
  },
  guideLegs: {
    flexDirection: "row",
    gap: 10,
    width: 80,
  },
  guideLeg: {
    flex: 1,
    height: GUIDE_HEIGHT * 0.4,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  statusBadge: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
    maxWidth: 240,
  },
  instructions: {
    position: "absolute",
    bottom: 160,
    left: 24,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 14,
    padding: 16,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 6,
    textAlign: "center",
  },
  instructionBody: {
    fontSize: 13,
    color: "#ffffffcc",
    lineHeight: 18,
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
    gap: 12,
  },
  continueButton: {
    backgroundColor: "#00E5FF",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  continueButtonDisabled: {
    backgroundColor: "rgba(0,229,255,0.3)",
  },
  continueText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0a0a0f",
  },
  continueTextDisabled: {
    color: "rgba(10,10,15,0.5)",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
});
