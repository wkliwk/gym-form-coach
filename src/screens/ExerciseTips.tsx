import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TrainStackParamList } from "../navigation";
import { EXERCISE_LABELS } from "../lib/types";
import { EXERCISE_TIPS } from "../lib/exerciseTips";

type ExerciseTipsProps = NativeStackScreenProps<
  TrainStackParamList,
  "ExerciseTips"
>;

export default function ExerciseTipsScreen({
  route,
  navigation,
}: ExerciseTipsProps) {
  const { exerciseType } = route.params;
  const tips = EXERCISE_TIPS[exerciseType];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {EXERCISE_LABELS[exerciseType]} Tips
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Ideal Form */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ideal Form</Text>
          <Text style={styles.bodyText}>{tips.idealForm}</Text>
        </View>

        {/* Common Mistakes */}
        <Text style={styles.heading}>Common Mistakes</Text>
        {tips.mistakes.map((mistake) => (
          <View key={mistake.flag} style={styles.mistakeCard}>
            <Text style={styles.mistakeLabel}>{mistake.label}</Text>

            <Text style={styles.subLabel}>What it looks like</Text>
            <Text style={styles.bodyText}>{mistake.whatItLooksLike}</Text>

            <Text style={styles.subLabel}>Why it matters</Text>
            <Text style={styles.bodyText}>{mistake.whyItMatters}</Text>

            <Text style={styles.subLabel}>How to fix it</Text>
            <Text style={styles.fixText}>{mistake.howToFix}</Text>
          </View>
        ))}

        {/* Camera Setup */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Camera Setup</Text>
          <Text style={styles.bodyText}>{tips.cameraSetup}</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backText: {
    fontSize: 15,
    color: "#00E5FF",
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#1a1a24",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#00E5FF",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  heading: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff60",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  mistakeCard: {
    backgroundColor: "#1a1a24",
    borderRadius: 14,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  mistakeLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#f59e0b",
    marginBottom: 14,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff50",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 15,
    color: "#ffffffcc",
    lineHeight: 22,
  },
  fixText: {
    fontSize: 15,
    color: "#22c55e",
    lineHeight: 22,
  },
});
