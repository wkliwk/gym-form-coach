import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Circle } from "react-native-svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TrainStackParamList } from "../navigation";
import { EXERCISE_LABELS } from "../lib/types";
import { loadPreferences } from "../lib/sessionStorage";

type RestTimerProps = NativeStackScreenProps<TrainStackParamList, "RestTimer">;

const REST_OPTIONS = [60, 90, 120, 180] as const;
const CIRCLE_SIZE = 200;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RestTimerScreen({
  route,
  navigation,
}: RestTimerProps) {
  const { exerciseType, completedSets, workoutStartTime } = route.params;
  const [restDuration, setRestDuration] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasVibrated = useRef(false);
  const prefsLoaded = useRef(false);

  // Load saved default rest time
  useEffect(() => {
    if (prefsLoaded.current) return;
    prefsLoaded.current = true;
    loadPreferences(exerciseType).then((prefs) => {
      setRestDuration(prefs.restTimeSeconds);
      setRemaining(prefs.restTimeSeconds);
    });
  }, [exerciseType]);

  const startTimer = useCallback(
    (duration: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setRemaining(duration);
      hasVibrated.current = false;

      timerRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (!hasVibrated.current) {
              hasVibrated.current = true;
              void Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    []
  );

  useEffect(() => {
    startTimer(restDuration);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [restDuration, startTimer]);

  const handleSelectDuration = (dur: number) => {
    setRestDuration(dur);
  };

  const handleNextSet = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigation.replace("Session", {
      exerciseType,
      setNumber: completedSets.length + 1,
      previousSets: completedSets,
      workoutStartTime,
    });
  };

  const handleEndWorkout = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Combine all sets into aggregate stats
    const totalReps = completedSets.reduce((s, set) => s + set.reps, 0);
    const avgScore =
      completedSets.length > 0
        ? Math.round(
            completedSets.reduce((s, set) => s + set.score, 0) /
              completedSets.length
          )
        : 100;
    const allRepRecords = completedSets.flatMap((set) => set.repRecords);

    // Find most common flag
    const flagCounts: Record<string, number> = {};
    for (const set of completedSets) {
      if (set.topFlag) {
        flagCounts[set.topFlag] = (flagCounts[set.topFlag] ?? 0) + 1;
      }
    }
    let topFlag: string | null = null;
    let maxCount = 0;
    for (const [flag, count] of Object.entries(flagCounts)) {
      if (count > maxCount) {
        maxCount = count;
        topFlag = flag;
      }
    }

    const durationMs = Date.now() - workoutStartTime;

    navigation.replace("Summary", {
      exercise: exerciseType,
      reps: totalReps,
      topFlag: topFlag as typeof completedSets[0]["topFlag"],
      score: avgScore,
      repRecords: allRepRecords,
      sets: completedSets,
      durationMs,
    });
  };

  const progress = restDuration > 0 ? remaining / restDuration : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rest</Text>
        <Text style={styles.subtitle}>
          {EXERCISE_LABELS[exerciseType]} — Set {completedSets.length} done
        </Text>
      </View>

      <View style={styles.timerContainer}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
          {/* Background circle */}
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke="#2a2a3a"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke={remaining === 0 ? "#22c55e" : "#00E5FF"}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.timerTextContainer}>
          <Text style={styles.timerText}>{timeDisplay}</Text>
          {remaining === 0 && (
            <Text style={styles.readyText}>Ready!</Text>
          )}
        </View>
      </View>

      {/* Duration selector */}
      <View style={styles.durationRow}>
        {REST_OPTIONS.map((dur) => (
          <TouchableOpacity
            key={dur}
            style={[
              styles.durationButton,
              restDuration === dur && styles.durationButtonActive,
            ]}
            onPress={() => handleSelectDuration(dur)}
          >
            <Text
              style={[
                styles.durationText,
                restDuration === dur && styles.durationTextActive,
              ]}
            >
              {dur >= 60 ? `${dur / 60}m` : `${dur}s`}
              {dur === 90 ? "" : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.nextSetButton}
          onPress={handleNextSet}
          activeOpacity={0.7}
        >
          <Text style={styles.nextSetText}>
            {remaining === 0 ? "Start Next Set" : "Skip Rest"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEndWorkout}
          activeOpacity={0.7}
        >
          <Text style={styles.endText}>End Workout</Text>
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
    paddingTop: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 15,
    color: "#ffffff60",
    marginTop: 6,
  },
  timerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timerTextContainer: {
    position: "absolute",
    alignItems: "center",
  },
  timerText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#ffffff",
    fontVariant: ["tabular-nums"],
  },
  readyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22c55e",
    marginTop: 4,
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 32,
  },
  durationButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#1a1a24",
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  durationButtonActive: {
    borderColor: "#00E5FF",
    backgroundColor: "#00E5FF15",
  },
  durationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff60",
  },
  durationTextActive: {
    color: "#00E5FF",
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  nextSetButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextSetText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
  endButton: {
    backgroundColor: "#1a1a24",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  endText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff80",
  },
});
