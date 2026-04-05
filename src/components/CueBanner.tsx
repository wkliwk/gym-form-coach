import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions, Vibration } from "react-native";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import type { FormFlag } from "../lib/types";
import { FLAG_LABELS } from "../lib/types";
import { useReducedMotion } from "../hooks/useReducedMotion";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
// Position below exercise header (safe area + header + rep counter + gap)
// Scales proportionally: ~18% from top on standard iPhones, clamps for small screens
const CUE_TOP = Math.max(140, Math.round(SCREEN_HEIGHT * 0.18));

interface CueBannerProps {
  flag: FormFlag | null;
  repNumber: number;
}

export default function CueBanner({ flag, repNumber }: CueBannerProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const lastSpokenRep = useRef(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (repNumber === 0) return;

    // Haptic + audio cue (max 1 per rep)
    if (repNumber !== lastSpokenRep.current) {
      lastSpokenRep.current = repNumber;

      // Haptic — near-instant feedback, works even with headphones
      try {
        if (flag) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } catch {
        // Fallback for devices without haptic support
        Vibration.vibrate(flag ? [0, 50, 30, 50] : [0, 40]);
      }

      // Audio cue
      const text = flag ? FLAG_LABELS[flag] : "Good rep";
      Speech.speak(text, {
        language: "en-US",
        rate: 1.1,
        pitch: 1.0,
      });
    }

    // Flash the visual cue (skip animation if reduced motion)
    if (reducedMotion) {
      opacity.setValue(1);
      // Hold visible for 2s then hide instantly
      const timer = setTimeout(() => opacity.setValue(0), 2000);
      return () => clearTimeout(timer);
    } else {
      opacity.setValue(1);
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }).start();
    }
  }, [repNumber, flag, opacity, reducedMotion]);

  if (repNumber === 0) return null;

  const label = flag ? FLAG_LABELS[flag] : "Good rep!";
  const color = flag ? "#f59e0b" : "#22c55e";

  return (
    <Animated.View
      style={[styles.container, { opacity }]}
      accessible
      accessibilityLabel={`Rep ${repNumber}: ${label}`}
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.badge, { backgroundColor: color + "20" }]}>
        <Text style={[styles.repText, { color }]}>Rep {repNumber}</Text>
        <Text style={[styles.cueText, { color }]}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: CUE_TOP,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  repText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  cueText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
});
