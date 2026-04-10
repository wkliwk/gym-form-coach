import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Pressable,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { Exercise, SessionRecord } from "../lib/types";
import { EXERCISE_LABELS, FLAG_LABELS } from "../lib/types";
import {
  loadSessions,
  findPreviousSession,
  deleteSession,
  clearAllSessions,
  getPersonalBests,
  getWorkoutStreak,
  getTotalReps,
  getScoreTrend,
} from "../lib/sessionStorage";
import FormTrendsChart from "../components/FormTrendsChart";

const MAX_DISPLAY = 50;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function DeltaBadge({
  sessions,
  session,
}: {
  sessions: SessionRecord[];
  session: SessionRecord;
}) {
  const prev = findPreviousSession(sessions, session.exercise, session.id);
  if (!prev) return null;
  const delta = session.reps - prev.reps;
  if (delta === 0) return null;
  const positive = delta > 0;
  return (
    <View
      style={[
        styles.deltaBadge,
        { backgroundColor: positive ? "#22c55e20" : "#ef444420" },
      ]}
    >
      <Text
        style={[styles.deltaText, { color: positive ? "#22c55e" : "#ef4444" }]}
      >
        {positive ? "+" : ""}
        {delta} reps
      </Text>
    </View>
  );
}

function ScoreTrendArrow({ trend }: { trend: number }) {
  if (trend === 0) return <Text style={styles.trendNeutral}>—</Text>;
  if (trend > 0) return <Text style={styles.trendUp}>▲</Text>;
  return <Text style={styles.trendDown}>▼</Text>;
}

function StatsHeader({ sessions }: { sessions: SessionRecord[] }) {
  if (sessions.length === 0) return null;

  const totalReps = getTotalReps(sessions);
  const streak = getWorkoutStreak(sessions);

  return (
    <View style={styles.statsHeader}>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{sessions.length}</Text>
        <Text style={styles.statLabel}>Sessions</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{totalReps}</Text>
        <Text style={styles.statLabel}>Total Reps</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{streak.current}</Text>
        <Text style={styles.statLabel}>Day Streak</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{streak.best}</Text>
        <Text style={styles.statLabel}>Best Streak</Text>
      </View>
    </View>
  );
}

function PersonalBests({
  sessions,
  exerciseFilter,
  onFilterChange,
}: {
  sessions: SessionRecord[];
  exerciseFilter: Exercise | null;
  onFilterChange: (exercise: Exercise | null) => void;
}) {
  const bests = getPersonalBests(sessions);
  const exercises = Object.keys(bests) as Exercise[];
  if (exercises.length === 0) return null;

  return (
    <View style={styles.bestsSection}>
      <Text style={styles.bestsTitle}>Personal Bests</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bestsRow}
      >
        {exercises.map((ex) => {
          const best = bests[ex]!;
          const isActive = exerciseFilter === ex;
          return (
            <Pressable
              key={ex}
              style={[styles.bestCard, isActive && styles.bestCardActive]}
              onPress={() => onFilterChange(isActive ? null : ex)}
            >
              <Text style={styles.bestExercise}>
                {EXERCISE_LABELS[ex] ?? ex}
              </Text>
              <Text style={styles.bestScore}>{best.score}%</Text>
              <Text style={styles.bestDate}>{formatShortDate(best.date)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function HistoryScreen() {
  const [allSessions, setAllSessions] = useState<SessionRecord[]>([]);
  const [exerciseFilter, setExerciseFilter] = useState<Exercise | null>(null);

  const refresh = useCallback(() => {
    loadSessions().then((s) => setAllSessions(s.slice(0, MAX_DISPLAY)));
  }, []);

  useFocusEffect(refresh);

  const filteredSessions = exerciseFilter
    ? allSessions.filter((s) => s.exercise === exerciseFilter)
    : allSessions;

  const handleDeleteSession = useCallback(
    (id: string) => {
      Alert.alert("Delete Session", "Remove this session from your history?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteSession(id);
            refresh();
          },
        },
      ]);
    },
    [refresh]
  );

  const handleClearAll = useCallback(() => {
    Alert.alert(
      "Clear All History",
      "This will permanently delete all session records. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await clearAllSessions();
            refresh();
          },
        },
      ]
    );
  }, [refresh]);

  const renderItem = ({ item }: { item: SessionRecord }) => {
    const trend = getScoreTrend(allSessions, item);
    return (
      <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <Text style={styles.exerciseLabel}>
            {EXERCISE_LABELS[item.exercise] ?? item.exercise}
          </Text>
          <View style={styles.sessionHeaderRight}>
            <Text style={styles.dateLabel}>{formatDate(item.date)}</Text>
            <Pressable
              onPress={() => handleDeleteSession(item.id)}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deleteButtonPressed,
              ]}
              accessibilityLabel="Delete session"
              accessibilityRole="button"
            >
              <Text style={styles.deleteButtonText}>✕</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sessionStats}>
          <Text style={styles.repCount}>{item.reps} reps</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreText}>{item.score}%</Text>
            <ScoreTrendArrow trend={trend} />
          </View>
          <DeltaBadge sessions={allSessions} session={item} />
        </View>

        {item.topFlag && (
          <Text style={styles.flagLabel}>
            {FLAG_LABELS[item.topFlag] ?? item.topFlag}
          </Text>
        )}
      </View>
    );
  };

  const ListHeader = () => (
    <>
      <StatsHeader sessions={allSessions} />
      <FormTrendsChart sessions={allSessions} />
      <PersonalBests
        sessions={allSessions}
        exerciseFilter={exerciseFilter}
        onFilterChange={setExerciseFilter}
      />
      {exerciseFilter && (
        <View style={styles.filterBanner}>
          <Text style={styles.filterText}>
            Showing: {EXERCISE_LABELS[exerciseFilter]}
          </Text>
          <Pressable onPress={() => setExerciseFilter(null)}>
            <Text style={styles.filterClear}>Clear</Text>
          </Pressable>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Session History</Text>
          {allSessions.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={styles.clearAllButton}
              accessibilityLabel="Clear all history"
              accessibilityRole="button"
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {allSessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete a workout to see your history here
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef444460",
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ef4444",
  },
  // Stats Header
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#1a1a24",
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 3,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 11,
    color: "#ffffff50",
    marginTop: 4,
  },
  // Personal Bests
  bestsSection: {
    marginBottom: 20,
  },
  bestsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff60",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  bestsRow: {
    gap: 10,
  },
  bestCard: {
    backgroundColor: "#1a1a24",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minWidth: 110,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  bestCardActive: {
    borderColor: "#00E5FF",
  },
  bestExercise: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff80",
    marginBottom: 6,
  },
  bestScore: {
    fontSize: 22,
    fontWeight: "700",
    color: "#6366f1",
  },
  bestDate: {
    fontSize: 11,
    color: "#ffffff40",
    marginTop: 4,
  },
  // Filter banner
  filterBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#00E5FF15",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
  },
  filterText: {
    fontSize: 13,
    color: "#00E5FF",
    fontWeight: "600",
  },
  filterClear: {
    fontSize: 13,
    color: "#ffffff60",
    fontWeight: "500",
  },
  // Session list
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sessionCard: {
    backgroundColor: "#1a1a24",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sessionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exerciseLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    color: "#ffffff50",
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ef444420",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonPressed: {
    backgroundColor: "#ef444450",
  },
  deleteButtonText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "700",
  },
  sessionStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  repCount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffffcc",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scoreText: {
    fontSize: 15,
    color: "#6366f1",
    fontWeight: "600",
  },
  trendUp: {
    fontSize: 12,
    color: "#22c55e",
  },
  trendDown: {
    fontSize: 12,
    color: "#ef4444",
  },
  trendNeutral: {
    fontSize: 12,
    color: "#ffffff40",
  },
  deltaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  deltaText: {
    fontSize: 13,
    fontWeight: "600",
  },
  flagLabel: {
    fontSize: 13,
    color: "#f59e0b",
    marginTop: 8,
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
    lineHeight: 20,
  },
});
