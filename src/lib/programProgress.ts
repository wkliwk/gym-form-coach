import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ProgramProgress, ProgramExercise } from "./types";
import { STARTER_PROGRAMS } from "./programs";

const PROGRESS_KEY = "@gym_form_coach/program_progress";

export async function loadProgress(): Promise<ProgramProgress | null> {
  const raw = await AsyncStorage.getItem(PROGRESS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProgramProgress;
  } catch {
    return null;
  }
}

export async function saveProgress(
  progress: ProgramProgress
): Promise<void> {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export async function clearProgress(): Promise<void> {
  await AsyncStorage.removeItem(PROGRESS_KEY);
}

export async function startProgram(programId: string): Promise<ProgramProgress> {
  const progress: ProgramProgress = {
    programId,
    currentDay: 1,
    completedDays: [],
    startedAt: new Date().toISOString(),
  };
  await saveProgress(progress);
  return progress;
}

export interface ProgressionResult {
  passed: boolean;
  exerciseResults: {
    exercise: ProgramExercise;
    avgScore: number;
    threshold: number;
    passed: boolean;
  }[];
}

/**
 * Check if a program day's form thresholds were met.
 * Takes the average session score per exercise and compares to the threshold.
 */
export function checkProgression(
  dayExercises: ProgramExercise[],
  exerciseScores: Record<string, number>
): ProgressionResult {
  const exerciseResults = dayExercises.map((ex) => {
    const avgScore = exerciseScores[ex.exercise] ?? 0;
    return {
      exercise: ex,
      avgScore,
      threshold: ex.formThreshold,
      passed: avgScore >= ex.formThreshold,
    };
  });

  return {
    passed: exerciseResults.every((r) => r.passed),
    exerciseResults,
  };
}

/**
 * Advance to the next day if progression check passed.
 */
export async function completeDay(
  dayNumber: number,
  passed: boolean
): Promise<ProgramProgress | null> {
  const progress = await loadProgress();
  if (!progress) return null;

  const program = STARTER_PROGRAMS.find((p) => p.id === progress.programId);
  if (!program) return null;

  if (passed && !progress.completedDays.includes(dayNumber)) {
    progress.completedDays.push(dayNumber);
    // Advance to next day
    if (dayNumber >= progress.currentDay) {
      const nextDay = dayNumber + 1;
      if (nextDay <= program.days.length) {
        progress.currentDay = nextDay;
      }
    }
  }

  await saveProgress(progress);
  return progress;
}
