import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { cacheDirectory, writeAsStringAsync } from "expo-file-system/build/legacy";
import Constants from "expo-constants";
import * as Device from "expo-device";
import FeedbackScreen from "./Feedback";
import { loadSessions } from "../lib/sessionStorage";
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

export default function SettingsScreen() {
  const [showFeedback, setShowFeedback] = useState(false);

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
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
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
