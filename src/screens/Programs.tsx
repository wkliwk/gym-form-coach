import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TrainStackParamList } from "../navigation";
import type { ProgramProgress } from "../lib/types";
import { STARTER_PROGRAMS } from "../lib/programs";
import { loadProgress, startProgram, clearProgress } from "../lib/programProgress";

type ProgramsProps = NativeStackScreenProps<TrainStackParamList, "Programs">;

export default function ProgramsScreen({ navigation }: ProgramsProps) {
  const [progress, setProgress] = useState<ProgramProgress | null>(null);

  const refresh = useCallback(() => {
    loadProgress().then(setProgress);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStart = async (programId: string) => {
    if (progress) {
      Alert.alert(
        "Switch Program?",
        "Starting a new program will abandon your current progress.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Switch",
            style: "destructive",
            onPress: async () => {
              const p = await startProgram(programId);
              setProgress(p);
            },
          },
        ]
      );
    } else {
      const p = await startProgram(programId);
      setProgress(p);
    }
  };

  const handleAbandon = () => {
    Alert.alert("Abandon Program?", "Your progress will be lost.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Abandon",
        style: "destructive",
        onPress: async () => {
          await clearProgress();
          setProgress(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Programs</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {STARTER_PROGRAMS.map((program) => {
          const isActive = progress?.programId === program.id;
          const completedCount = isActive
            ? progress!.completedDays.length
            : 0;

          return (
            <View
              key={program.id}
              style={[styles.programCard, isActive && styles.programCardActive]}
            >
              <Text style={styles.programName}>{program.name}</Text>
              <Text style={styles.programDesc}>{program.description}</Text>
              <Text style={styles.programMeta}>
                {program.days.length} days
              </Text>

              {isActive ? (
                <View style={styles.activeSection}>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressText}>
                      Day {progress!.currentDay} of {program.days.length}
                    </Text>
                    <Text style={styles.progressText}>
                      {completedCount} completed
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(completedCount / program.days.length) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.continueButton}
                      onPress={() =>
                        navigation.navigate("ProgramDay", {
                          programId: program.id,
                          dayNumber: progress!.currentDay,
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Continue ${program.name}, day ${progress!.currentDay}`}
                    >
                      <Text style={styles.continueText}>Continue</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.abandonButton}
                      onPress={handleAbandon}
                    >
                      <Text style={styles.abandonText}>Abandon</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => handleStart(program.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${program.name}`}
                >
                  <Text style={styles.startText}>Start Program</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
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
  programCard: {
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  programCardActive: { borderColor: "#6366f1" },
  programName: { fontSize: 18, fontWeight: "700", color: "#ffffff", marginBottom: 8 },
  programDesc: { fontSize: 14, color: "#ffffff80", lineHeight: 20, marginBottom: 10 },
  programMeta: { fontSize: 12, color: "#ffffff40", marginBottom: 14 },
  activeSection: { marginTop: 4 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: { fontSize: 13, color: "#6366f1", fontWeight: "600" },
  progressBar: {
    height: 6,
    backgroundColor: "#2a2a3a",
    borderRadius: 3,
    marginBottom: 14,
  },
  progressFill: {
    height: 6,
    backgroundColor: "#6366f1",
    borderRadius: 3,
  },
  actionRow: { flexDirection: "row", gap: 10 },
  continueButton: {
    flex: 1,
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  continueText: { fontSize: 15, fontWeight: "600", color: "#ffffff" },
  abandonButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ef444460",
  },
  abandonText: { fontSize: 13, fontWeight: "600", color: "#ef4444" },
  startButton: {
    backgroundColor: "#6366f120",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6366f140",
  },
  startText: { fontSize: 15, fontWeight: "600", color: "#6366f1" },
});
