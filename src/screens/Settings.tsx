import React from "react";
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
import Constants from "expo-constants";
import * as Device from "expo-device";

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
  const handleCopyFeedback = async () => {
    const template = buildFeedbackTemplate();
    await Clipboard.setStringAsync(template);
    Alert.alert("Copied", "Bug report template copied to clipboard.");
  };

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
        <Text style={styles.sectionTitle}>Feedback</Text>

        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={handleCopyFeedback}
          activeOpacity={0.7}
        >
          <Text style={styles.feedbackButtonText}>Copy Bug Report Template</Text>
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
