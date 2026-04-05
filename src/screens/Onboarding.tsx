import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Camera } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Exercise } from "../lib/types";
import { EXERCISE_LABELS } from "../lib/types";

export const ONBOARDING_KEY = "hasCompletedOnboarding";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type OnboardingSlide = {
  title: string;
  body: string;
  icon: string;
};

const SLIDES: OnboardingSlide[] = [
  {
    title: "Real-time form coaching",
    body: "Gym Form Coach uses your phone camera and on-device AI to analyse your exercise form as you move — no trainer, no cloud, no waiting.",
    icon: "🏋️",
  },
  {
    title: "See it in action",
    body: "The app detects your body position, scores each rep 0-100, and gives you audio cues to fix your form in real time. Track your progress with personal bests and weekly reports.",
    icon: "📊",
  },
  {
    title: "Set up your phone",
    body: "Prop your phone at waist height, 6-8 feet away, so your full body is visible in the frame. A yoga block or water bottle works great.",
    icon: "📱",
  },
  {
    title: "Your privacy is protected",
    body: "All processing happens on your device. No video is ever uploaded, stored externally, or shared with anyone.",
    icon: "🔒",
  },
];

const EXERCISES: { type: Exercise; emoji: string }[] = [
  { type: "squat", emoji: "🏋️" },
  { type: "deadlift", emoji: "💪" },
  { type: "pushup", emoji: "🫸" },
  { type: "overheadPress", emoji: "🙌" },
];

type OnboardingPhase = "slides" | "camera" | "exercise" | "ready";

type Props = {
  onComplete: (firstExercise?: Exercise) => void;
};

export default function OnboardingScreen({ onComplete }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<OnboardingPhase>("slides");
  const [selectedExercise, setSelectedExercise] = useState<Exercise>("squat");

  const finish = useCallback(
    async (exercise?: Exercise) => {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      onComplete(exercise);
    },
    [onComplete]
  );

  function handleNext() {
    if (activeIndex < SLIDES.length - 1) {
      const nextIndex = activeIndex + 1;
      scrollRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      setActiveIndex(nextIndex);
    } else {
      setPhase("camera");
    }
  }

  function handleScroll(event: {
    nativeEvent: { contentOffset: { x: number } };
  }) {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }

  const handleCameraPermission = useCallback(async () => {
    await Camera.requestCameraPermissionsAsync();
    setPhase("exercise");
  }, []);

  const handleSkipCamera = useCallback(() => {
    setPhase("exercise");
  }, []);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  // Camera permission phase
  if (phase === "camera") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => finish()} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
        <View style={styles.centerContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.slideIcon}>📸</Text>
          </View>
          <Text style={styles.slideTitle}>Enable Camera</Text>
          <Text style={styles.slideBody}>
            The app needs camera access to watch your form. Your video is never
            recorded or uploaded.
          </Text>
        </View>
        <View style={styles.bottomBar}>
          <Pressable
            onPress={handleCameraPermission}
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Allow camera access"
          >
            <Text style={styles.nextButtonText}>Allow Camera</Text>
          </Pressable>
          <TouchableOpacity
            onPress={handleSkipCamera}
            style={styles.skipLater}
          >
            <Text style={styles.skipLaterText}>I'll do this later</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Exercise selection phase
  if (phase === "exercise") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => finish()} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.slideTitle}>What do you want to try first?</Text>
          <Text style={[styles.slideBody, { marginBottom: 30 }]}>
            Pick an exercise to start with. You can try all 4 anytime.
          </Text>
          <View style={styles.exerciseGrid}>
            {EXERCISES.map(({ type, emoji }) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.exerciseOption,
                  selectedExercise === type && styles.exerciseOptionActive,
                ]}
                onPress={() => setSelectedExercise(type)}
                accessibilityRole="button"
                accessibilityLabel={EXERCISE_LABELS[type]}
              >
                <Text style={styles.exerciseEmoji}>{emoji}</Text>
                <Text
                  style={[
                    styles.exerciseLabel,
                    selectedExercise === type && styles.exerciseLabelActive,
                  ]}
                >
                  {EXERCISE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.bottomBar}>
          <Pressable
            onPress={() => setPhase("ready")}
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text style={styles.nextButtonText}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Ready phase
  if (phase === "ready") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.slideIcon}>✅</Text>
          </View>
          <Text style={styles.slideTitle}>You're all set!</Text>
          <Text style={styles.slideBody}>
            Prop up your phone, hit start, and get real feedback on every rep.
          </Text>
        </View>
        <View style={styles.bottomBar}>
          <Pressable
            onPress={() => finish(selectedExercise)}
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Start first workout with ${EXERCISE_LABELS[selectedExercise]}`}
          >
            <Text style={styles.nextButtonText}>Start First Workout</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Slides phase
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => finish()}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.skipButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.iconContainer}>
              <Text style={styles.slideIcon}>{slide.icon}</Text>
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextButton,
            pressed && styles.nextButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? "Continue to setup" : "Next slide"}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? "Continue" : "Next"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 16 : 8,
    paddingBottom: 8,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  skipButtonPressed: {
    opacity: 0.5,
  },
  skipText: {
    color: "#ffffff60",
    fontSize: 16,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingBottom: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1a1a24",
    borderWidth: 1,
    borderColor: "#2a2a3a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  slideIcon: {
    fontSize: 44,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 34,
  },
  slideBody: {
    fontSize: 17,
    color: "#ffffff80",
    textAlign: "center",
    lineHeight: 26,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  dot: {
    borderRadius: 4,
    height: 8,
  },
  dotActive: {
    width: 24,
    backgroundColor: "#00E5FF",
  },
  dotInactive: {
    width: 8,
    backgroundColor: "#ffffff30",
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  nextButton: {
    backgroundColor: "#00E5FF",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  nextButtonPressed: {
    opacity: 0.8,
  },
  nextButtonText: {
    color: "#0a0a0f",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  skipLater: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipLaterText: {
    color: "#ffffff40",
    fontSize: 14,
  },
  // Exercise selection
  exerciseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  exerciseOption: {
    width: 140,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#1a1a24",
    borderWidth: 1,
    borderColor: "#2a2a3a",
    alignItems: "center",
  },
  exerciseOptionActive: {
    borderColor: "#00E5FF",
    backgroundColor: "#00E5FF15",
  },
  exerciseEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  exerciseLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff80",
  },
  exerciseLabelActive: {
    color: "#00E5FF",
  },
});
