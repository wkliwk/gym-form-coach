/**
 * Session.tsx
 *
 * Main camera screen with integrated form analysis + audio cues.
 * Receives exerciseType from navigation params.
 *
 * Flow:
 *   1. CameraGuide overlay (user dismisses with "I'm Ready")
 *   2. Camera + pose overlay + rep detection + audio cues
 *   3. End Session → Summary with accumulated stats
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from "react-native";
import { Camera } from "react-native-vision-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCamera } from "../hooks/useCamera";
import { usePoseEstimation } from "../hooks/usePoseEstimation";
import { useRepDetector } from "../hooks/useRepDetector";
import PoseOverlay from "../components/PoseOverlay";
import CueBanner from "../components/CueBanner";
import SafetyBanner from "../components/SafetyBanner";
import CameraGuide from "../components/CameraGuide";
import { EXERCISE_LABELS } from "../lib/types";
import type { FormFlag } from "../lib/types";
import type { TrainStackParamList } from "../navigation";
import {
  trackSessionStart,
  trackSessionEnd,
} from "../lib/analytics";

type SessionProps = NativeStackScreenProps<TrainStackParamList, "Session">;

export default function Session({ route, navigation }: SessionProps): React.ReactElement {
  const { exerciseType } = route.params;

  // Camera guide shown before first rep
  const [showGuide, setShowGuide] = useState(true);

  const cameraRef = useRef<InstanceType<typeof Camera> | null>(null);
  const { device, permissionState, requestPermission, openSettings } =
    useCamera();

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });

  // Rep detection + form analysis
  const { processPose, getStats, reset } = useRepDetector(exerciseType);
  const [repCount, setRepCount] = useState(0);
  const [lastCueFlag, setLastCueFlag] = useState<FormFlag | null>(null);
  const [lastCueRep, setLastCueRep] = useState(0);

  // Reset detector when exercise changes
  useEffect(() => {
    reset();
    setRepCount(0);
    setLastCueFlag(null);
    setLastCueRep(0);
  }, [exerciseType, reset]);

  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  // Only enable pose estimation after guide is dismissed
  const { poses, modelReady, fps } = usePoseEstimation({
    cameraRef,
    isCameraReady,
    enabled: permissionState === "granted" && !showGuide,
  });

  // Process each pose frame through the form analyser
  const prevPosesRef = useRef(poses);
  useEffect(() => {
    if (poses === prevPosesRef.current || poses.length === 0 || showGuide) return;
    prevPosesRef.current = poses;

    const pose = poses[0];
    const event = processPose(pose);
    if (event) {
      setRepCount(event.repNumber);
      setLastCueFlag(event.flag);
      setLastCueRep(event.repNumber);
    }
  }, [poses, processPose, showGuide]);

  const handleEndSession = useCallback(() => {
    const stats = getStats();
    trackSessionEnd(exerciseType, stats.totalReps, stats.score);
    navigation.navigate("Summary", {
      exercise: exerciseType,
      reps: stats.totalReps,
      topFlag: stats.topFlag,
      score: stats.score,
    });
  }, [navigation, exerciseType, getStats]);

  const handleGuideReady = useCallback(() => {
    setShowGuide(false);
    trackSessionStart(exerciseType);
  }, [exerciseType]);

  // ── Permission: loading ──────────────────────────────────────────────────
  if (permissionState === "loading") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00E5FF" />
      </View>
    );
  }

  // ── Permission: denied ───────────────────────────────────────────────────
  if (permissionState === "denied") {
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
  if (permissionState === "undetermined") {
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

  // ── Camera Guide (shown before session starts) ───────────────────────────
  if (showGuide) {
    return <CameraGuide exercise={exerciseType} onReady={handleGuideReady} />;
  }

  // ── Camera granted + guide dismissed ─────────────────────────────────────
  if (!device) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00E5FF" />
        <Text style={styles.modelLoadingText}>Finding camera…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!showGuide}
        photo={true}
        onInitialized={handleCameraReady}
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

      {/* Exercise name + rep counter header */}
      <View style={styles.exerciseHeader} pointerEvents="none">
        <Text style={styles.exerciseName}>{EXERCISE_LABELS[exerciseType]}</Text>
        <Text style={styles.repCounter}>{repCount} reps</Text>
      </View>

      {/* Audio + visual cue banner */}
      <CueBanner flag={lastCueFlag} repNumber={lastCueRep} />

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
      <SafetyBanner />

      {/* End Session button */}
      <View style={styles.endSessionContainer}>
        <TouchableOpacity
          style={styles.endSessionButton}
          onPress={handleEndSession}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="End session"
        >
          <Text style={styles.endSessionText}>End Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  // Exercise header
  exerciseHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 24,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  exerciseName: {
    color: "#00E5FF",
    fontSize: 16,
    fontWeight: "700",
  },
  repCounter: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  // Permission screens
  permissionTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  permissionBody: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: "#00E5FF",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  permissionButtonPressed: {
    opacity: 0.7,
  },
  permissionButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  // Overlays
  modelLoadingBadge: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : 84,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  modelLoadingText: {
    color: "#ffffff",
    fontSize: 13,
  },
  fpsBadge: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 24,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  fpsText: {
    color: "#00E5FF",
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  // End Session
  endSessionContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 80 : 60,
    left: 20,
    right: 20,
  },
  endSessionButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  endSessionText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
