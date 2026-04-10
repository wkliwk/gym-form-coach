import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import type { Exercise, SessionRecord } from "../lib/types";
import { EXERCISE_LABELS } from "../lib/types";
import { computeScoreTrend } from "../lib/trendData";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 40; // 20px padding each side

const WEEK_OPTIONS = [4, 8, 12] as const;
const EXERCISES: (Exercise | null)[] = [null, "squat", "deadlift", "pushup", "overheadPress", "benchPress"];

interface FormTrendsChartProps {
  sessions: SessionRecord[];
}

export default function FormTrendsChart({ sessions }: FormTrendsChartProps) {
  const [weeksBack, setWeeksBack] = useState<4 | 8 | 12>(4);
  const [exercise, setExercise] = useState<Exercise | null>(null);

  const trendData = useMemo(
    () => computeScoreTrend(sessions, exercise, weeksBack),
    [sessions, exercise, weeksBack]
  );

  if (trendData.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Form Trends</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Complete 3+ sessions to see your trends
          </Text>
        </View>
      </View>
    );
  }

  const labels = trendData.map((p) => {
    const d = new Date(p.date + "T00:00:00");
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  const data = trendData.map((p) => p.score);

  // Show max ~8 labels to avoid crowding
  const labelStep = Math.max(1, Math.ceil(labels.length / 8));
  const displayLabels = labels.map((l, i) => (i % labelStep === 0 ? l : ""));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Form Trends</Text>

      {/* Exercise filter */}
      <View style={styles.filterRow}>
        {EXERCISES.map((ex) => (
          <TouchableOpacity
            key={ex ?? "all"}
            style={[styles.filterPill, exercise === ex && styles.filterPillActive]}
            onPress={() => setExercise(ex)}
          >
            <Text
              style={[
                styles.filterText,
                exercise === ex && styles.filterTextActive,
              ]}
            >
              {ex ? EXERCISE_LABELS[ex] : "All"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <LineChart
        data={{
          labels: displayLabels,
          datasets: [{ data, strokeWidth: 2 }],
        }}
        width={CHART_WIDTH}
        height={180}
        yAxisSuffix="%"
        yAxisInterval={1}
        fromZero={false}
        chartConfig={{
          backgroundColor: "#1a1a24",
          backgroundGradientFrom: "#1a1a24",
          backgroundGradientTo: "#1a1a24",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          labelColor: () => "rgba(255, 255, 255, 0.4)",
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#6366f1",
          },
          propsForBackgroundLines: {
            stroke: "#ffffff10",
          },
        }}
        bezier
        style={styles.chart}
      />

      {/* Week range selector */}
      <View style={styles.weekRow}>
        {WEEK_OPTIONS.map((w) => (
          <TouchableOpacity
            key={w}
            style={[styles.weekPill, weeksBack === w && styles.weekPillActive]}
            onPress={() => setWeeksBack(w)}
          >
            <Text
              style={[
                styles.weekText,
                weeksBack === w && styles.weekTextActive,
              ]}
            >
              {w}w
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff60",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#0a0a0f",
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  filterPillActive: {
    borderColor: "#6366f1",
    backgroundColor: "#6366f115",
  },
  filterText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ffffff50",
  },
  filterTextActive: {
    color: "#6366f1",
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  weekPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#0a0a0f",
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  weekPillActive: {
    borderColor: "#00E5FF",
    backgroundColor: "#00E5FF15",
  },
  weekText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff50",
  },
  weekTextActive: {
    color: "#00E5FF",
  },
  emptyState: {
    paddingVertical: 30,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#ffffff40",
    textAlign: "center",
  },
});
