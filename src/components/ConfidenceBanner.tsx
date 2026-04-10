import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import type { ConfidenceLevel } from "../lib/poseConfidence";

interface ConfidenceBannerProps {
  level: ConfidenceLevel;
}

const MESSAGES: Record<Exclude<ConfidenceLevel, "good">, string> = {
  warn: "Move closer or improve lighting",
  critical: "Can't detect pose — check camera position",
};

const COLORS: Record<Exclude<ConfidenceLevel, "good">, { bg: string; text: string }> = {
  warn: { bg: "rgba(245,158,11,0.9)", text: "#000" },
  critical: { bg: "rgba(239,68,68,0.9)", text: "#fff" },
};

export default function ConfidenceBanner({ level }: ConfidenceBannerProps) {
  if (level === "good") return null;

  const { bg, text } = COLORS[level];
  const message = MESSAGES[level];

  return (
    <View
      style={[styles.container, { backgroundColor: bg }]}
      pointerEvents="none"
      accessible
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.text, { color: text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 180 : 160,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
