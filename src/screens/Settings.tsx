import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { cacheDirectory, writeAsStringAsync } from "expo-file-system/build/legacy";
import Constants from "expo-constants";
import * as Device from "expo-device";
import FeedbackScreen from "./Feedback";
import { loadSessions, loadAllPreferences, savePreferences } from "../lib/sessionStorage";
import {
  loadReminderSettings,
  saveReminderSettings,
  type ReminderSettings,
} from "../lib/notifications";
import type { Exercise, ExercisePreferences } from "../lib/types";
import { EXERCISE_LABELS, DEFAULT_PREFERENCES } from "../lib/types";
import {
  sessionsToCSV,
  sessionsToJSON,
  getExportFilename,
  type ExportFormat,
} from "../lib/dataExport";

const APP_NAME = Constants.expoConfig?.name ?? "Gym Form Coach";
const APP_VERSION = Constants.expoConfig?.version ?? "unknown";
const BUILD_NUMBER =
  Platform.OS === "ios"
    ? Constants.expoConfig?.ios?.buildNumber ?? "—"
    : String(Constants.expoConfig?.android?.versionCode ?? "—");

function getDeviceInfo(): string {
  const model = Device.modelName ?? "Unknown device";
  const os = `${Device.osName ?? Platform.OS} ${Device.osVersion ?? ""}`.trim();
  return `${model} (${os})`;
}

function buildFeedbackTemplate(): string {
  return [
    `App: ${APP_NAME} v${APP_VERSION} (build ${BUILD_NUMBER})`,
    `Device: ${getDeviceInfo()}`,
    "",
    "Bug description:",
    "",
    "Steps to reproduce:",
    "1. ",
    "",
    "Expected behavior:",
    "",
    "What actually happened:",
    "",
  ].join("\n");
}

const REST_OPTIONS = [60, 90, 120, 180] as const;
const SET_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10];
const REP_OPTIONS = [3, 5, 6, 8, 10, 12, 15, 20];
const EXERCISES: Exercise[] = ["squat", "deadlift", "pushup", "overheadPress"];

export default function SettingsScreen() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [allPrefs, setAllPrefs] = useState<Partial<Record<Exercise, ExercisePreferences>>>({});
  const [expandedExercise, setExpandedExercise] = useState<Exercise | null>(null);
  const [reminder, setReminder] = useState<ReminderSettings>({
    enabled: false,
    hour: 18,
    minute: 0,
  });

  useEffect(() => {
    loadAllPreferences().then(setAllPrefs);
    loadReminderSettings().then(setReminder);
  }, []);

  const updatePref = useCallback(
    async (exercise: Exercise, update: Partial<ExercisePreferences>) => {
      const current = allPrefs[exercise] ?? { ...DEFAULT_PREFERENCES };
      const updated = { ...current, ...update };
      await savePreferences(exercise, updated);
      setAllPrefs((prev) => ({ ...prev, [exercise]: updated }));
    },
    [allPrefs]
  );

  const handleExport = async (format: ExportFormat) => {
    const sessions = await loadSessions();
    const content =
      format === "csv" ? sessionsToCSV(sessions) : sessionsToJSON(sessions);
    const filename = getExportFilename(format);
    const fileUri = (cacheDirectory ?? "/tmp/") + filename;
    await writeAsStringAsync(fileUri, content);

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("Sharing not available", "Cannot share files on this device.");
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: format === "csv" ? "text/csv" : "application/json",
      dialogTitle: "Export Training Data",
    });
  };

  const handleCopyFeedback = async () => {
    const template = buildFeedbackTemplate();
    await Clipboard.setStringAsync(template);
    Alert.alert("Copied", "Bug report template copied to clipboard.");
  };

  if (showFeedback) {
    return <FeedbackScreen onClose={() => setShowFeedback(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Exercise Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exercise Preferences</Text>
        {EXERCISES.map((ex) => {
          const prefs = allPrefs[ex] ?? DEFAULT_PREFERENCES;
          const isExpanded = expandedExercise === ex;
          return (
            <View key={ex}>
              <TouchableOpacity
                style={styles.prefHeader}
                onPress={() => setExpandedExercise(isExpanded ? null : ex)}
              >
                <Text style={styles.prefExercise}>{EXERCISE_LABELS[ex]}</Text>
                <Text style={styles.prefSummary}>
                  {prefs.targetSets}x{prefs.targetReps} • {prefs.restTimeSeconds}s rest
                </Text>
              </TouchableOpacity>
              {isExpanded && (
                <View style={styles.prefDetails}>
                  <Text style={styles.prefLabel}>Rest Time</Text>
                  <View style={styles.optionRow}>
                    {REST_OPTIONS.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.optionPill, prefs.restTimeSeconds === t && styles.optionPillActive]}
                        onPress={() => updatePref(ex, { restTimeSeconds: t })}
                      >
                        <Text style={[styles.optionText, prefs.restTimeSeconds === t && styles.optionTextActive]}>
                          {t}s
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.prefLabel}>Target Sets</Text>
                  <View style={styles.optionRow}>
                    {SET_OPTIONS.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.optionPill, prefs.targetSets === s && styles.optionPillActive]}
                        onPress={() => updatePref(ex, { targetSets: s })}
                      >
                        <Text style={[styles.optionText, prefs.targetSets === s && styles.optionTextActive]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.prefLabel}>Target Reps</Text>
                  <View style={styles.optionRow}>
                    {REP_OPTIONS.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.optionPill, prefs.targetReps === r && styles.optionPillActive]}
                        onPress={() => updatePref(ex, { targetReps: r })}
                      >
                        <Text style={[styles.optionText, prefs.targetReps === r && styles.optionTextActive]}>
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Daily Reminder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Reminder</Text>

        <TouchableOpacity
          style={styles.row}
          onPress={async () => {
            const updated = { ...reminder, enabled: !reminder.enabled };
            setReminder(updated);
            await saveReminderSettings(updated);
          }}
        >
          <Text style={styles.label}>Reminder</Text>
          <Text style={[styles.value, { color: reminder.enabled ? "#00E5FF" : "#ffffff50" }]}>
            {reminder.enabled ? "On" : "Off"}
          </Text>
        </TouchableOpacity>

        {reminder.enabled && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 12, marginBottom: 8 }]}>
              Reminder Time
            </Text>
            <View style={styles.optionRow}>
              {[6, 7, 8, 9, 12, 17, 18, 19, 20, 21].map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.optionPill,
                    reminder.hour === h && styles.optionPillActive,
                  ]}
                  onPress={async () => {
                    const updated = { ...reminder, hour: h, minute: 0 };
                    setReminder(updated);
                    await saveReminderSettings(updated);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      reminder.hour === h && styles.optionTextActive,
                    ]}
                  >
                    {h <= 12 ? `${h}am` : `${h - 12}pm`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.row}>
          <Text style={styles.label}>App</Text>
          <Text style={styles.value}>{APP_NAME}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>{APP_VERSION}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Build</Text>
          <Text style={styles.value}>{BUILD_NUMBER}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Device</Text>
          <Text style={styles.value}>{getDeviceInfo()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>

        <View style={styles.exportRow}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExport("csv")}
            activeOpacity={0.7}
          >
            <Text style={styles.exportButtonText}>Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExport("json")}
            activeOpacity={0.7}
          >
            <Text style={styles.exportButtonText}>Export JSON</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.feedbackHint}>
          Export your full training history for backup or analysis
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feedback</Text>

        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() => setShowFeedback(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.feedbackButtonText}>Send Feedback</Text>
          <Text style={styles.feedbackHint}>
            Report bugs, request features, or share thoughts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.feedbackButton, { marginTop: 8 }]}
          onPress={handleCopyFeedback}
          activeOpacity={0.7}
        >
          <Text style={[styles.feedbackButtonText, { color: "#ffffff80" }]}>
            Copy Bug Report Template
          </Text>
          <Text style={styles.feedbackHint}>
            Paste into email or message to report issues
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff60",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a24",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  label: {
    fontSize: 15,
    color: "#ffffff80",
  },
  value: {
    fontSize: 15,
    color: "#ffffff",
    fontWeight: "500",
  },
  // Exercise Preferences
  prefHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a24",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  prefExercise: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  prefSummary: {
    fontSize: 13,
    color: "#ffffff50",
  },
  prefDetails: {
    backgroundColor: "#1a1a24",
    borderRadius: 10,
    padding: 16,
    marginBottom: 6,
    marginTop: -2,
  },
  prefLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff50",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#0a0a0f",
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  optionPillActive: {
    borderColor: "#00E5FF",
    backgroundColor: "#00E5FF15",
  },
  optionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff50",
  },
  optionTextActive: {
    color: "#00E5FF",
  },
  exportRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  exportButton: {
    flex: 1,
    backgroundColor: "#1a1a24",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6366f1",
  },
  feedbackButton: {
    backgroundColor: "#1a1a24",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00E5FF",
    marginBottom: 4,
  },
  feedbackHint: {
    fontSize: 13,
    color: "#ffffff50",
  },
});
