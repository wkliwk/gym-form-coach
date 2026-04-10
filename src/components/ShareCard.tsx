import React, { forwardRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Exercise } from "../lib/types";
import { EXERCISE_LABELS } from "../lib/types";

interface ShareCardProps {
  exercise: Exercise;
  reps: number;
  score: number;
  sets?: number;
  isPersonalBest?: boolean;
  date: string;
}

const ShareCard = forwardRef<View, ShareCardProps>(
  ({ exercise, reps, score, sets, isPersonalBest, date }, ref) => {
    const cleanRatio = Math.round((score / 100) * reps);
    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        {/* Background gradient effect */}
        <View style={styles.bgAccent} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Gym Form Coach</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>

        {/* Exercise */}
        <Text style={styles.exercise}>{EXERCISE_LABELS[exercise]}</Text>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {sets != null && sets > 1 && (
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{sets}</Text>
              <Text style={styles.statLabel}>Sets</Text>
            </View>
          )}
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{reps}</Text>
            <Text style={styles.statLabel}>Total Reps</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: "#6366f1" }]}>
              {score}%
            </Text>
            <Text style={styles.statLabel}>Form Score</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>
              {cleanRatio}/{reps}
            </Text>
            <Text style={styles.statLabel}>Clean Reps</Text>
          </View>
        </View>

        {/* Personal best badge */}
        {isPersonalBest && (
          <View style={styles.pbBadge}>
            <Text style={styles.pbText}>New Personal Best!</Text>
          </View>
        )}

        {/* Watermark */}
        <Text style={styles.watermark}>gymformcoach.app</Text>
      </View>
    );
  }
);

ShareCard.displayName = "ShareCard";

export default ShareCard;

const styles = StyleSheet.create({
  card: {
    width: 360,
    height: 360,
    backgroundColor: "#0a0a0f",
    borderRadius: 24,
    padding: 28,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  bgAccent: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#6366f115",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00E5FF",
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 12,
    color: "#ffffff50",
  },
  exercise: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 8,
  },
  statBlock: {
    minWidth: 80,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 11,
    color: "#ffffff60",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  pbBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFD70020",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#FFD70040",
  },
  pbText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFD700",
  },
  watermark: {
    fontSize: 11,
    color: "#ffffff25",
    textAlign: "right",
    fontWeight: "500",
  },
});
