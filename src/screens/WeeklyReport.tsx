import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TrainStackParamList } from "../navigation";
import { EXERCISE_LABELS } from "../lib/types";
import { loadSessions } from "../lib/sessionStorage";
import {
  computeWeeklyReport,
  type WeeklyReportData,
} from "../lib/weeklyReportHelpers";

type WeeklyReportProps = NativeStackScreenProps<
  TrainStackParamList,
  "WeeklyReport"
>;

export default function WeeklyReportScreen({
  navigation,
}: WeeklyReportProps) {
  const [report, setReport] = useState<WeeklyReportData | null>(null);

  useEffect(() => {
    loadSessions().then((sessions) => {
      setReport(computeWeeklyReport(sessions, sessions));
    });
  }, []);

  if (!report) return null;

  if (report.sessionCount === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Weekly Report</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Sessions This Week</Text>
          <Text style={styles.emptySubtitle}>
            Complete a workout to see your weekly progress here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const scoreDiff =
    report.prevWeekAvgScore != null
      ? report.avgScore - report.prevWeekAvgScore
      : null;
  const maxDailyScore = Math.max(...report.dailyScores.map((d) => d.avgScore), 1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Weekly Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{report.sessionCount}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{report.avgScore}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          {scoreDiff !== null && (
            <View style={styles.statBox}>
              <Text
                style={[
                  styles.statValue,
                  { color: scoreDiff >= 0 ? "#22c55e" : "#ef4444" },
                ]}
              >
                {scoreDiff >= 0 ? "+" : ""}
                {scoreDiff}
              </Text>
              <Text style={styles.statLabel}>vs Last Week</Text>
            </View>
          )}
        </View>

        {/* Exercises trained */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <Text style={styles.exerciseList}>
            {report.exercises.map((e) => EXERCISE_LABELS[e]).join(", ")}
          </Text>
        </View>

        {/* Score trend */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Daily Scores</Text>
          <View style={styles.chartRow}>
            {report.dailyScores.map((d) => (
              <View key={d.day} style={styles.chartCol}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: d.avgScore > 0
                          ? Math.max(4, (d.avgScore / maxDailyScore) * 80)
                          : 2,
                        backgroundColor:
                          d.avgScore >= 80
                            ? "#22c55e"
                            : d.avgScore >= 60
                              ? "#f59e0b"
                              : d.avgScore > 0
                                ? "#ef4444"
                                : "#2a2a3a",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{d.day}</Text>
                {d.avgScore > 0 && (
                  <Text style={styles.chartValue}>{d.avgScore}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Top flag to fix */}
        {report.topFlag && (
          <View style={styles.flagCard}>
            <Text style={styles.sectionTitle}>Focus Area</Text>
            <Text style={styles.flagName}>{report.topFlag.label}</Text>
            <Text style={styles.flagDrill}>{report.topFlag.drill}</Text>
          </View>
        )}

        {/* New personal bests */}
        {report.newPersonalBests.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>New Personal Bests</Text>
            {report.newPersonalBests.map((pb) => (
              <View key={pb.exercise} style={styles.pbRow}>
                <Text style={styles.pbExercise}>
                  {EXERCISE_LABELS[pb.exercise]}
                </Text>
                <Text style={styles.pbScore}>{pb.score}%</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backText: {
    fontSize: 15,
    color: "#00E5FF",
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#ffffff50",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#1a1a24",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 11,
    color: "#ffffff50",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#1a1a24",
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff50",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  exerciseList: {
    fontSize: 16,
    color: "#ffffffcc",
  },
  // Chart
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
  },
  barContainer: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
    alignItems: "center",
  },
  bar: {
    width: 20,
    borderRadius: 4,
    minHeight: 2,
  },
  chartLabel: {
    fontSize: 10,
    color: "#ffffff40",
    marginTop: 6,
  },
  chartValue: {
    fontSize: 10,
    color: "#ffffff60",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  // Flag
  flagCard: {
    backgroundColor: "#1a1a24",
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  flagName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#f59e0b",
    marginBottom: 8,
  },
  flagDrill: {
    fontSize: 14,
    color: "#ffffffcc",
    lineHeight: 20,
  },
  // Personal bests
  pbRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  pbExercise: {
    fontSize: 15,
    color: "#ffffffcc",
  },
  pbScore: {
    fontSize: 15,
    fontWeight: "700",
    color: "#22c55e",
  },
});
