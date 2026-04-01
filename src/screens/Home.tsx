import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Exercise } from "../lib/types";
import { EXERCISE_LABELS } from "../lib/types";
import type { TrainStackParamList } from "../navigation";

type HomeProps = {
  navigation: NativeStackNavigationProp<TrainStackParamList, "Home">;
};

const EXERCISES: { type: Exercise; emoji: string; description: string }[] = [
  { type: "squat", emoji: "🏋️", description: "Track depth, knee path & lean" },
  { type: "deadlift", emoji: "💪", description: "Track back angle & bar path" },
  { type: "pushup", emoji: "🫸", description: "Track range, hips & elbows" },
];

export default function HomeScreen({ navigation }: HomeProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gym Form Coach</Text>
        <Text style={styles.subtitle}>Choose an exercise to start</Text>
      </View>

      <View style={styles.grid}>
        {EXERCISES.map(({ type, emoji, description }) => (
          <TouchableOpacity
            key={type}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Session", { exerciseType: type })}
            accessibilityRole="button"
            accessibilityLabel={`Start ${EXERCISE_LABELS[type]} session`}
          >
            <Text style={styles.cardEmoji}>{emoji}</Text>
            <Text style={styles.cardTitle}>{EXERCISE_LABELS[type]}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </TouchableOpacity>
        ))}
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
    paddingTop: 40,
    paddingBottom: 24,
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
  },
  card: {
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 12,
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
