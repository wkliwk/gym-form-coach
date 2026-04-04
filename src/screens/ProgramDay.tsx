import React from "react";
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
import { STARTER_PROGRAMS } from "../lib/programs";

type ProgramDayProps = NativeStackScreenProps<TrainStackParamList, "ProgramDay">;

export default function ProgramDayScreen({
  route,
  navigation,
}: ProgramDayProps) {
  const { programId, dayNumber } = route.params;
  const program = STARTER_PROGRAMS.find((p) => p.id === programId);
  const day = program?.days.find((d) => d.dayNumber === dayNumber);

  if (!program || !day) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Program day not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{day.label}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.programName}>{program.name}</Text>
        <Text style={styles.dayProgress}>
          Day {dayNumber} of {program.days.length}
        </Text>

        {day.exercises.map((ex, idx) => (
          <View key={idx} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>
                {EXERCISE_LABELS[ex.exercise]}
              </Text>
              <Text style={styles.exerciseTarget}>
                {ex.sets} x {ex.reps}
              </Text>
            </View>
            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>Form threshold</Text>
              <Text style={styles.thresholdValue}>{ex.formThreshold}%</Text>
            </View>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() =>
                navigation.navigate("Session", { exerciseType: ex.exercise })
              }
            >
              <Text style={styles.startText}>Start</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backText: { fontSize: 15, color: "#00E5FF", fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "700", color: "#ffffff" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  programName: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
    marginBottom: 4,
  },
  dayProgress: {
    fontSize: 13,
    color: "#ffffff40",
    marginBottom: 20,
  },
  exerciseCard: {
    backgroundColor: "#1a1a24",
    borderRadius: 14,
    padding: 20,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },
  exerciseTarget: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff80",
  },
  thresholdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  thresholdLabel: {
    fontSize: 13,
    color: "#ffffff50",
  },
  thresholdValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f59e0b",
  },
  startButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  startText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    marginTop: 40,
  },
});
