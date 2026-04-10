import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface StreakWidgetProps {
  current: number;
  best: number;
}

export default function StreakWidget({ current, best }: StreakWidgetProps) {
  return (
    <View style={styles.container}>
      <View style={styles.currentStreak}>
        <Text style={styles.flameEmoji}>{current > 0 ? "🔥" : "💤"}</Text>
        <View style={styles.streakInfo}>
          {current > 0 ? (
            <>
              <Text style={styles.streakCount}>{current}</Text>
              <Text style={styles.streakLabel}>
                day{current !== 1 ? "s" : ""} streak
              </Text>
            </>
          ) : (
            <Text style={styles.motivationText}>
              Start your streak today
            </Text>
          )}
        </View>
      </View>
      {best > 0 && (
        <View style={styles.bestStreak}>
          <Text style={styles.bestLabel}>Best</Text>
          <Text style={styles.bestValue}>{best}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a24",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  currentStreak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flameEmoji: {
    fontSize: 28,
  },
  streakInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  streakCount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FF6B35",
  },
  streakLabel: {
    fontSize: 15,
    color: "#ffffff80",
    fontWeight: "500",
  },
  motivationText: {
    fontSize: 15,
    color: "#ffffff60",
    fontWeight: "500",
    fontStyle: "italic",
  },
  bestStreak: {
    alignItems: "center",
    backgroundColor: "#ffffff08",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bestLabel: {
    fontSize: 11,
    color: "#ffffff40",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bestValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFD700",
  },
});
