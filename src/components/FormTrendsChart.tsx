import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import type { Exercise, SessionRecord } from "../lib/types";
import { EXERCISE_LABELS } from "../lib/types";
import { computeScoreTrend } from "../lib/trendData";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 180;
// react-native-chart-kit internal left padding — used to position tooltip
const CHART_PADDING_LEFT = 55;

const WEEK_OPTIONS = [4, 8, 12] as const;
const EXERCISES: (Exercise | null)[] = [
  null,
  "squat",
  "deadlift",
  "pushup",
  "overheadPress",
  "benchPress",
];

interface TooltipState {
  x: number;
  y: number;
  index: number;
}

interface FormTrendsChartProps {
  sessions: SessionRecord[];
}

/** Compute linear regression y = mx + b over the data points. */
function linearTrend(values: number[]): number[] {
  const n = values.length;
  if (n < 2) return values.slice();
  const xs = values.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * values[i], 0);
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const b = (sumY - m * sumX) / n;
  return xs.map((x) => Math.min(100, Math.max(0, Math.round(m * x + b))));
}

export default function FormTrendsChart({ sessions }: FormTrendsChartProps) {
  const [weeksBack, setWeeksBack] = useState<4 | 8 | 12>(4);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const trendData = useMemo(
    () => computeScoreTrend(sessions, exercise, weeksBack),
    [sessions, exercise, weeksBack]
  );

  // Dismiss tooltip when filter changes
  const handleExerciseChange = (ex: Exercise | null) => {
    setExercise(ex);
    setTooltip(null);
  };

  const handleWeeksChange = (w: 4 | 8 | 12) => {
    setWeeksBack(w);
    setTooltip(null);
  };

  // Empty state: require at least 3 raw sessions (not aggregated days)
  const relevantSessions = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeksBack * 7);
    cutoff.setHours(0, 0, 0, 0);
    return sessions.filter((s) => {
      if (exercise && s.exercise !== exercise) return false;
      return new Date(s.date) >= cutoff;
    });
  }, [sessions, exercise, weeksBack]);

  if (relevantSessions.length < 3) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Form Trends</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Complete 3 sessions to see your form trend
          </Text>
        </View>
      </View>
    );
  }

  const labels = trendData.map((p) => {
    const d = new Date(p.date + "T00:00:00");
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  const scoreData = trendData.map((p) => p.score);
  const trendLine = linearTrend(scoreData);

  // Show max ~8 labels to avoid crowding
  const labelStep = Math.max(1, Math.ceil(labels.length / 8));
  const displayLabels = labels.map((l, i) => (i % labelStep === 0 ? l : ""));

  const activePoint = tooltip !== null ? trendData[tooltip.index] : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Form Trends</Text>

      {/* Exercise filter */}
      <View style={styles.filterRow}>
        {EXERCISES.map((ex) => (
          <TouchableOpacity
            key={ex ?? "all"}
            style={[
              styles.filterPill,
              exercise === ex && styles.filterPillActive,
            ]}
            onPress={() => handleExerciseChange(ex)}
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

      {/* Chart + tooltip wrapper */}
      <View style={styles.chartWrapper}>
        <LineChart
          data={{
            labels: displayLabels,
            datasets: [
              {
                data: scoreData,
                strokeWidth: 2,
                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              },
              {
                data: trendLine,
                strokeWidth: 1.5,
                strokeDashArray: [6, 4],
                color: (opacity = 1) => `rgba(0, 229, 255, ${opacity * 0.7})`,
                withDots: false,
              } as any,
            ],
          }}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          yAxisSuffix="%"
          yAxisInterval={1}
          fromZero={false}
          onDataPointClick={({ index, x, y }) => {
            setTooltip((prev) =>
              prev?.index === index ? null : { x, y, index }
            );
          }}
          chartConfig={{
            backgroundColor: "#1a1a24",
            backgroundGradientFrom: "#1a1a24",
            backgroundGradientTo: "#1a1a24",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
            labelColor: () => "rgba(255, 255, 255, 0.4)",
            propsForDots: {
              r: "5",
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

        {/* Tooltip overlay */}
        {tooltip !== null && activePoint && (
          <View
            style={[
              styles.tooltip,
              {
                left: Math.min(
                  tooltip.x - CHART_PADDING_LEFT - 4,
                  CHART_WIDTH - 130
                ),
                top: Math.max(tooltip.y - 72, 0),
              },
            ]}
          >
            <Text style={styles.tooltipDate}>
              {new Date(activePoint.date + "T00:00:00").toLocaleDateString(
                undefined,
                { month: "short", day: "numeric" }
              )}
            </Text>
            <Text style={styles.tooltipScore}>{activePoint.score}%</Text>
            <Text style={styles.tooltipSessions}>
              {activePoint.sessionCount}{" "}
              {activePoint.sessionCount === 1 ? "session" : "sessions"}
            </Text>
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#6366f1" }]} />
          <Text style={styles.legendText}>Score</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendDash} />
          <Text style={styles.legendText}>Trend</Text>
        </View>
      </View>

      {/* Week range selector */}
      <View style={styles.weekRow}>
        {WEEK_OPTIONS.map((w) => (
          <TouchableOpacity
            key={w}
            style={[
              styles.weekPill,
              weeksBack === w && styles.weekPillActive,
            ]}
            onPress={() => handleWeeksChange(w)}
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
  chartWrapper: {
    position: "relative",
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "#0a0a0f",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#6366f140",
    minWidth: 100,
    zIndex: 10,
  },
  tooltipDate: {
    fontSize: 11,
    color: "#ffffff50",
    marginBottom: 2,
  },
  tooltipScore: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6366f1",
  },
  tooltipSessions: {
    fontSize: 11,
    color: "#ffffff40",
    marginTop: 2,
  },
  legendRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 6,
    marginBottom: 2,
    paddingLeft: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDash: {
    width: 16,
    height: 2,
    backgroundColor: "#00E5FF",
    borderRadius: 1,
  },
  legendText: {
    fontSize: 11,
    color: "#ffffff40",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
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
