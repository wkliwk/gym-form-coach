import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Switch,
  ScrollView,
} from "react-native";
import * as MailComposer from "expo-mail-composer";
import type { FeedbackCategory } from "../lib/feedbackUtils";
import {
  CATEGORY_LABELS,
  buildEmailSubject,
  buildEmailBody,
  validateMessage,
} from "../lib/feedbackUtils";

const CATEGORIES: FeedbackCategory[] = ["bug", "feature", "general"];
const FEEDBACK_EMAIL = "feedback@gymformcoach.app";

interface FeedbackScreenProps {
  onClose: () => void;
}

export default function FeedbackScreen({ onClose }: FeedbackScreenProps) {
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [message, setMessage] = useState("");
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const validationError = validateMessage(message);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        "Email Not Available",
        "No email client is configured on this device. Please email your feedback to " +
          FEEDBACK_EMAIL
      );
      return;
    }

    await MailComposer.composeAsync({
      recipients: [FEEDBACK_EMAIL],
      subject: buildEmailSubject(category),
      body: buildEmailBody(message, category, includeDeviceInfo),
    });

    onClose();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Send Feedback</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Category picker */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                category === cat && styles.categoryButtonActive,
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === cat && styles.categoryTextActive,
                ]}
              >
                {CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message */}
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={6}
          placeholder="Describe your feedback..."
          placeholderTextColor="#ffffff30"
          value={message}
          onChangeText={(text) => {
            setMessage(text);
            if (error) setError(null);
          }}
          textAlignVertical="top"
        />
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Device info toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Include device info</Text>
          <Switch
            value={includeDeviceInfo}
            onValueChange={setIncludeDeviceInfo}
            trackColor={{ false: "#2a2a3a", true: "#00E5FF40" }}
            thumbColor={includeDeviceInfo ? "#00E5FF" : "#ffffff50"}
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          activeOpacity={0.7}
        >
          <Text style={styles.submitText}>Open Email</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },
  cancelText: {
    fontSize: 15,
    color: "#00E5FF",
    fontWeight: "600",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff60",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1a1a24",
    borderWidth: 1,
    borderColor: "#2a2a3a",
    alignItems: "center",
  },
  categoryButtonActive: {
    borderColor: "#00E5FF",
    backgroundColor: "#00E5FF15",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff60",
  },
  categoryTextActive: {
    color: "#00E5FF",
  },
  textInput: {
    backgroundColor: "#1a1a24",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#ffffff",
    minHeight: 140,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a24",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 15,
    color: "#ffffffcc",
  },
  submitButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
});
