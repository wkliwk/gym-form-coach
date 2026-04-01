import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import type { Exercise } from "../lib/types";
import { EXERCISE_LABELS } from "../lib/types";

interface CameraGuideProps {
  exercise: Exercise;
  onReady: () => void;
}

const GUIDE_TEXT: Record<Exercise, string> = {
  squat:
    "Place your phone 6–8 feet away at hip height, angled to see your side profile. Ensure your full body is visible from head to feet.",
  deadlift:
    "Place your phone 6–8 feet away at hip height, angled to see your side profile. Ensure the bar and your full body are visible.",
  pushup:
    "Place your phone 3–4 feet away at floor level, angled to see your side profile. Ensure your full body is visible.",
};

export default function CameraGuide({ exercise, onReady }: CameraGuideProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Camera Setup</Text>
        <Text style={styles.exercise}>{EXERCISE_LABELS[exercise]}</Text>

        <View style={styles.diagramBox}>
          <Text style={styles.diagramEmoji}>📱</Text>
          <View style={styles.arrow} />
          <Text style={styles.diagramEmoji}>🏋️</Text>
        </View>

        <Text style={styles.instructions}>{GUIDE_TEXT[exercise]}</Text>

        <View style={styles.tips}>
          <Text style={styles.tip}>• Good lighting — avoid backlight</Text>
          <Text style={styles.tip}>• Prop phone against something stable</Text>
          <Text style={styles.tip}>• Wear fitted clothes for better tracking</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={onReady}>
        <Text style={styles.buttonText}>I'm Ready</Text>
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
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff60",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  exercise: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 8,
    marginBottom: 32,
  },
  diagramBox: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingVertical: 32,
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    marginBottom: 24,
  },
  diagramEmoji: {
    fontSize: 48,
  },
  arrow: {
    width: 40,
    height: 2,
    backgroundColor: "#ffffff30",
  },
  instructions: {
    fontSize: 16,
    color: "#ffffffcc",
    lineHeight: 24,
    marginBottom: 24,
  },
  tips: {
    gap: 8,
  },
  tip: {
    fontSize: 14,
    color: "#ffffff80",
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#6366f1",
    marginHorizontal: 24,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
});
