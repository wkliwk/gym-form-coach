import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import type {
  SessionRecord,
  Exercise,
  FormFlag,
} from "../lib/types";
import {
  FLAG_LABELS,
  DRILL_SUGGESTIONS,
  EXERCISE_LABELS,
} from "../lib/types";
import { addSession, loadSessions, findPreviousSession } from "../lib/sessionStorage";

interface SummaryScreenProps {
  exercise: Exercise;
  reps: number;
  topFlag: FormFlag | null;
  score: number;
  onDone: () => void;
}

export default function SummaryScreen({
  exercise,
  reps,
  topFlag,
  score,
  onDone,
}: SummaryScreenProps) {
  const [delta, setDelta] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const session: SessionRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      exercise,
      reps,
      topFlag,
      score,
    };

    addSession(session).then(async () => {
      setSaved(true);
      const sessions = await loadSessions();
      const prev = findPreviousSession(sessions, exercise, session.id);
      if (prev) {
        setDelta(reps - prev.reps);
      }
    });
  }, [exercise, reps, topFlag, score]);

  const flagLabel = topFlag ? FLAG_LABELS[topFlag] : null;
  const drill = topFlag ? DRILL_SUGGESTIONS[topFlag] : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Session Complete</Text>

        <View style={styles.card}>
          <Text style={styles.exerciseName}>
            {EXERCISE_LABELS[exercise]}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{reps}</Text>
              <Text style={styles.statLabel}>Reps</Text>
            </View>

            <View style={styles.stat}>
              <Text style={styles.statValue}>{score}%</Text>
              <Text style={styles.statLabel}>Form Score</Text>
            </View>

            {delta !== null && (
              <View style={styles.stat}>
                <Text
                  style={[
                    styles.statValue,
                    { color: delta >= 0 ? "#22c55e" : "#ef4444" },
                  ]}
                >
                  {delta >= 0 ? "+" : ""}
                  {delta}
                </Text>
                <Text style={styles.statLabel}>vs Last</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.feedbackCard}>
          {flagLabel ? (
            <>
              <Text style={styles.feedbackTitle}>Most Common Flag</Text>
              <Text style={styles.flagText}>{flagLabel}</Text>
              {drill && (
                <>
                  <Text style={styles.drillTitle}>Try This</Text>
                  <Text style={styles.drillText}>{drill}</Text>
                </>
              )}
            </>
          ) : (
            <Text style={styles.greatForm}>
              Great form! No flags this session.
            </Text>
          )}
        </View>

        {saved && (
          <Text style={styles.savedNote}>Session saved to history</Text>
        )}
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={onDone}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 12,
    color: "#ffffff80",
    marginTop: 4,
  },
  feedbackCard: {
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff60",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  flagText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f59e0b",
    marginBottom: 20,
  },
  drillTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff60",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  drillText: {
    fontSize: 16,
    color: "#ffffffcc",
    lineHeight: 22,
  },
  greatForm: {
    fontSize: 18,
    fontWeight: "600",
    color: "#22c55e",
  },
  savedNote: {
    fontSize: 13,
    color: "#ffffff40",
    textAlign: "center",
    marginTop: 8,
  },
  doneButton: {
    backgroundColor: "#6366f1",
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
});
