import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Platform, Dimensions } from "react-native";
import * as Speech from "expo-speech";
import type { FormFlag } from "../lib/types";
import { FLAG_LABELS } from "../lib/types";

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

  useEffect(() => {
    if (repNumber === 0) return;

    // Speak audio cue (max 1 per rep)
    if (repNumber !== lastSpokenRep.current) {
      lastSpokenRep.current = repNumber;
      const text = flag ? FLAG_LABELS[flag] : "Good rep";
      Speech.speak(text, {
        language: "en-US",
        rate: 1.1,
        pitch: 1.0,
      });
    }

    // Flash the visual cue
    opacity.setValue(1);
    Animated.timing(opacity, {
      toValue: 0,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, [repNumber, flag, opacity]);

  if (repNumber === 0) return null;

  const label = flag ? FLAG_LABELS[flag] : "Good rep!";
  const color = flag ? "#f59e0b" : "#22c55e";

  return (
    <Animated.View style={[styles.container, { opacity }]}>
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
