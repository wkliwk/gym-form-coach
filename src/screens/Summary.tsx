import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionRecord } from "../lib/types";
import {
  FLAG_LABELS,
  DRILL_SUGGESTIONS,
  EXERCISE_LABELS,
} from "../lib/types";
import { addSession, loadSessions, findPreviousSession } from "../lib/sessionStorage";
import { detectFatigue, findBestWorstReps } from "../lib/formInsights";
import type { TrainStackParamList } from "../navigation";

type SummaryProps = NativeStackScreenProps<TrainStackParamList, "Summary">;

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function SummaryScreen({ route, navigation }: SummaryProps) {
  const { exercise, reps, topFlag, score, repRecords, sets, durationMs } = route.params;
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
      sets,
      durationMs,
    };

    addSession(session).then(async () => {
      setSaved(true);
      const sessions = await loadSessions();
      const prev = findPreviousSession(sessions, exercise, session.id);
      if (prev) {
        setDelta(reps - prev.reps);
      }
    });
  }, [exercise, reps, topFlag, score, sets, durationMs]);

  const flagLabel = topFlag ? FLAG_LABELS[topFlag] : null;
  const drill = topFlag ? DRILL_SUGGESTIONS[topFlag] : null;
  const fatigue = detectFatigue(repRecords);
  const { bestRep, worstRep } = findBestWorstReps(repRecords);

  const handleDone = () => {
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>
          {sets && sets.length > 1 ? "Workout Complete" : "Session Complete"}
        </Text>

        {reps === 0 && (
          <View style={styles.zeroRepCard}>
            <Text style={styles.zeroRepTitle}>No Reps Detected</Text>
            <Text style={styles.zeroRepMessage}>
              Check your camera placement and make sure your full body is
              visible. Try placing your phone further away.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.exerciseName}>
            {EXERCISE_LABELS[exercise]}
          </Text>

          <View style={styles.statsRow}>
            {sets && sets.length > 1 && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{sets.length}</Text>
                <Text style={styles.statLabel}>Sets</Text>
              </View>
            )}

            <View style={styles.stat}>
              <Text style={styles.statValue}>{reps}</Text>
              <Text style={styles.statLabel}>Total Reps</Text>
            </View>

            <View style={styles.stat}>
              <Text style={styles.statValue}>{score}%</Text>
              <Text style={styles.statLabel}>
                {sets && sets.length > 1 ? "Avg Score" : "Form Score"}
              </Text>
            </View>

            {durationMs != null && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatDuration(durationMs)}</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>
            )}

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

        {/* Per-set breakdown */}
        {sets && sets.length > 1 && (
          <View style={styles.breakdownCard}>
            <Text style={styles.sectionTitle}>Sets</Text>
            {sets.map((set) => (
              <View key={set.setNumber} style={styles.setRow}>
                <Text style={styles.setNumber}>Set {set.setNumber}</Text>
                <Text style={styles.setReps}>{set.reps} reps</Text>
                <Text style={styles.setScore}>{set.score}%</Text>
                {set.topFlag && (
                  <Text style={styles.setFlag}>
                    {FLAG_LABELS[set.topFlag]}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Rep-by-rep breakdown */}
        {repRecords.length > 0 && (
          <View style={styles.breakdownCard}>
            <Text style={styles.sectionTitle}>Rep Breakdown</Text>
            {repRecords.map((rep) => {
              const isBest = rep.repNumber === bestRep;
              const isWorst = rep.repNumber === worstRep;
              const hasFlag = rep.flag !== null;
              const barColor = hasFlag ? "#f59e0b" : "#22c55e";

              return (
                <View
                  key={rep.repNumber}
                  style={[
                    styles.repRow,
                    isBest && styles.repRowBest,
                    isWorst && styles.repRowWorst,
                  ]}
                >
                  <View style={styles.repNumberContainer}>
                    <Text style={styles.repNumber}>{rep.repNumber}</Text>
                  </View>
                  <View style={styles.repBarContainer}>
                    <View
                      style={[styles.repBar, { backgroundColor: barColor }]}
                    />
                  </View>
                  <View style={styles.repFlagContainer}>
                    {hasFlag ? (
                      <Text style={styles.repFlagText}>
                        {FLAG_LABELS[rep.flag!]}
                      </Text>
                    ) : (
                      <Text style={styles.repGoodText}>Good</Text>
                    )}
                  </View>
                  {isBest && <Text style={styles.repBadge}>Best</Text>}
                  {isWorst && <Text style={styles.repBadgeWorst}>Fix</Text>}
                </View>
              );
            })}
          </View>
        )}

        {/* Fatigue indicator */}
        {fatigue.detected && (
          <View style={styles.fatigueCard}>
            <Text style={styles.fatigueTitle}>Form Fatigue Detected</Text>
            <Text style={styles.fatigueText}>{fatigue.message}</Text>
          </View>
        )}

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
      </ScrollView>

      <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
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
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
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
    flexWrap: "wrap",
    gap: 20,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 12,
    color: "#ffffff80",
    marginTop: 4,
  },
  // Rep breakdown
  breakdownCard: {
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff60",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 14,
  },
  repRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  repRowBest: {
    backgroundColor: "#22c55e10",
  },
  repRowWorst: {
    backgroundColor: "#f59e0b10",
  },
  repNumberContainer: {
    width: 28,
  },
  repNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff80",
  },
  repBarContainer: {
    width: 4,
    height: 20,
    marginRight: 12,
  },
  repBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  repFlagContainer: {
    flex: 1,
  },
  repFlagText: {
    fontSize: 13,
    color: "#f59e0b",
  },
  repGoodText: {
    fontSize: 13,
    color: "#22c55e",
  },
  repBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#22c55e",
    backgroundColor: "#22c55e20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  repBadgeWorst: {
    fontSize: 11,
    fontWeight: "700",
    color: "#f59e0b",
    backgroundColor: "#f59e0b20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  // Fatigue
  fatigueCard: {
    backgroundColor: "#ef444420",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ef444440",
  },
  fatigueTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ef4444",
    marginBottom: 6,
  },
  fatigueText: {
    fontSize: 14,
    color: "#ffffffcc",
    lineHeight: 20,
  },
  // Feedback
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
  // Zero rep warning
  zeroRepCard: {
    backgroundColor: "#f59e0b20",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f59e0b40",
  },
  zeroRepTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#f59e0b",
    marginBottom: 8,
  },
  zeroRepMessage: {
    fontSize: 14,
    color: "#ffffffcc",
    lineHeight: 20,
  },
  // Set rows
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff80",
    width: 48,
  },
  setReps: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffffcc",
  },
  setScore: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
  },
  setFlag: {
    fontSize: 12,
    color: "#f59e0b",
    flex: 1,
    textAlign: "right",
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
