export type Exercise = "squat" | "deadlift" | "pushup" | "overheadPress";

export type FormFlag =
  | "knees_caving"
  | "depth_too_shallow"
  | "forward_lean"
  | "rounded_lower_back"
  | "hips_rising_early"
  | "bar_drift"
  | "hips_sagging"
  | "elbows_flaring"
  | "incomplete_range"
  | "excessive_back_arch"
  | "uneven_press"
  | "incomplete_lockout";

export interface RepRecord {
  repNumber: number;
  flag: FormFlag | null;
}

export interface SessionRecord {
  id: string;
  date: string;
  exercise: Exercise;
  reps: number;
  topFlag: FormFlag | null;
  score: number;
}

export const FLAG_LABELS: Record<FormFlag, string> = {
  knees_caving: "Knees caving in",
  depth_too_shallow: "Depth too shallow",
  forward_lean: "Excessive forward lean",
  rounded_lower_back: "Rounded lower back",
  hips_rising_early: "Hips rising early",
  bar_drift: "Bar drifting forward",
  hips_sagging: "Hips sagging",
  elbows_flaring: "Elbows flaring out",
  incomplete_range: "Incomplete range of motion",
  excessive_back_arch: "Excessive back arch",
  uneven_press: "Uneven press",
  incomplete_lockout: "Incomplete lockout",
};

export const DRILL_SUGGESTIONS: Record<FormFlag, string> = {
  knees_caving: "Try banded squats to build knee-out awareness",
  depth_too_shallow: "Practice box squats to calibrate your depth",
  forward_lean: "Work on ankle mobility and front squats",
  rounded_lower_back: "Add Romanian deadlifts with lighter weight",
  hips_rising_early: "Focus on leg drive — pause deadlifts help",
  bar_drift: "Practice keeping the bar over mid-foot with tempo pulls",
  hips_sagging: "Strengthen your core with planks and dead bugs",
  elbows_flaring: "Tuck elbows at 45° — try diamond push-ups to build the pattern",
  incomplete_range: "Slow down — use tempo push-ups (3 seconds down, 3 up)",
  excessive_back_arch: "Brace your core harder — practice with wall-supported presses",
  uneven_press: "Focus on pressing evenly — try single-arm dumbbell presses to find imbalances",
  incomplete_lockout: "Press until elbows are fully locked — use lighter weight to build the pattern",
};

export const EXERCISE_LABELS: Record<Exercise, string> = {
  squat: "Squat",
  deadlift: "Deadlift",
  pushup: "Push-up",
  overheadPress: "Overhead Press",
};
