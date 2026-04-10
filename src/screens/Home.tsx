import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Pressable,
  ScrollView,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Exercise } from "../lib/types";
import { EXERCISE_LABELS } from "../lib/types";
import type { TrainStackParamList } from "../navigation";
import { trackExerciseSelected } from "../lib/analytics";

type HomeProps = {
  navigation: NativeStackNavigationProp<TrainStackParamList, "Home">;
};

const EXERCISES: { type: Exercise; emoji: string; description: string }[] = [
  { type: "squat", emoji: "🏋️", description: "Track depth, knee path & lean" },
  { type: "deadlift", emoji: "💪", description: "Track back angle & bar path" },
  { type: "pushup", emoji: "🫸", description: "Track range, hips & elbows" },
  { type: "overheadPress", emoji: "🙌", description: "Track lockout, arch & symmetry" },
  { type: "benchPress", emoji: "🔩", description: "Track wrists, elbows & lockout" },
];

export default function HomeScreen({ navigation }: HomeProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Gym Form Coach</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => navigation.navigate("Programs")}
            >
              <Text style={styles.reportButtonText}>Programs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => navigation.navigate("WeeklyReport")}
            >
              <Text style={styles.reportButtonText}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.subtitle}>Choose an exercise to start</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {EXERCISES.map(({ type, emoji, description }) => (
          <TouchableOpacity
            key={type}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => {
              trackExerciseSelected(type);
              navigation.navigate("Session", { exerciseType: type });
            }}
            accessibilityRole="button"
            accessibilityLabel={`Start ${EXERCISE_LABELS[type]} session`}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>{emoji}</Text>
              <Pressable
                style={styles.tipsButton}
                onPress={() =>
                  navigation.navigate("ExerciseTips", { exerciseType: type })
                }
                accessibilityLabel={`Form tips for ${EXERCISE_LABELS[type]}`}
              >
                <Text style={styles.tipsButtonText}>Tips</Text>
              </Pressable>
            </View>
            <Text style={styles.cardTitle}>{EXERCISE_LABELS[type]}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </TouchableOpacity>
        ))}
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
    paddingTop: 40,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  reportButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#6366f120",
    borderWidth: 1,
    borderColor: "#6366f140",
  },
  reportButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6366f1",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 16,
    color: "#ffffff60",
    marginTop: 6,
  },
  grid: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardEmoji: {
    fontSize: 36,
  },
  tipsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#ffffff10",
    borderWidth: 1,
    borderColor: "#ffffff20",
  },
  tipsButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#00E5FF",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#ffffff70",
    lineHeight: 20,
  },
});
