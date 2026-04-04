import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

export type FeedbackCategory = "bug" | "feature" | "general";

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: "Bug Report",
  feature: "Feature Request",
  general: "General Feedback",
};

const APP_VERSION = Constants.expoConfig?.version ?? "unknown";
const BUILD_NUMBER =
  Platform.OS === "ios"
    ? Constants.expoConfig?.ios?.buildNumber ?? "—"
    : String(Constants.expoConfig?.android?.versionCode ?? "—");

export function getDeviceInfoString(): string {
  const model = Device.modelName ?? "Unknown device";
  const os = `${Device.osName ?? Platform.OS} ${Device.osVersion ?? ""}`.trim();
  return `${model} (${os})`;
}

export function buildEmailSubject(category: FeedbackCategory): string {
  return `[Gym Form Coach v${APP_VERSION}] ${CATEGORY_LABELS[category]}`;
}

export function buildEmailBody(
  message: string,
  category: FeedbackCategory,
  includeDeviceInfo: boolean
): string {
  const lines: string[] = [message, ""];

  if (includeDeviceInfo) {
    lines.push("---");
    lines.push(`App: Gym Form Coach v${APP_VERSION} (build ${BUILD_NUMBER})`);
    lines.push(`Device: ${getDeviceInfoString()}`);
    lines.push(`Category: ${CATEGORY_LABELS[category]}`);
  }

  return lines.join("\n");
}

export function validateMessage(message: string): string | null {
  const trimmed = message.trim();
  if (trimmed.length === 0) return "Message is required";
  if (trimmed.length < 10) return "Please write at least 10 characters";
  return null;
}
