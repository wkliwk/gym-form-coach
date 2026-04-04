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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { SessionRecord } from "../lib/types";
import { EXERCISE_LABELS, FLAG_LABELS } from "../lib/types";
import {
  loadSessions,
  findPreviousSession,
  deleteSession,
  clearAllSessions,
} from "../lib/sessionStorage";

const MAX_DISPLAY = 10;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  const refresh = useCallback(() => {
    loadSessions().then((s) => setSessions(s.slice(0, MAX_DISPLAY)));
  }, []);

  useFocusEffect(refresh);

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

  const renderItem = ({ item }: { item: SessionRecord }) => (
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
        <Text style={styles.scoreText}>{item.score}%</Text>
        <DeltaBadge sessions={sessions} session={item} />
      </View>

      {item.topFlag && (
        <Text style={styles.flagLabel}>
          {FLAG_LABELS[item.topFlag] ?? item.topFlag}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Session History</Text>
          {sessions.length > 0 && (
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
        <Text style={styles.subtitle}>Last {MAX_DISPLAY} sessions</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete a workout to see your history here
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
  subtitle: {
    fontSize: 14,
    color: "#ffffff50",
    marginTop: 4,
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
  scoreText: {
    fontSize: 15,
    color: "#6366f1",
    fontWeight: "600",
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
