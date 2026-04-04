import type { Program } from "./types";

export const STARTER_PROGRAMS: Program[] = [
  {
    id: "squat-foundations",
    name: "Squat Foundations",
    description:
      "4-week program to build rock-solid squat form. Progressive form thresholds ensure you master the basics before advancing.",
    days: Array.from({ length: 12 }, (_, i) => ({
      dayNumber: i + 1,
      label: `Day ${i + 1}: Squats`,
      exercises: [
        {
          exercise: "squat" as const,
          sets: 3,
          reps: 8,
          formThreshold: 70 + Math.floor(i / 3) * 5, // 70 → 75 → 80 → 85
        },
      ],
    })),
  },
  {
    id: "full-body-basics",
    name: "Full Body Basics",
    description:
      "4-week full body program rotating all 4 exercises. Build well-rounded form across squat, deadlift, push-up, and overhead press.",
    days: [
      {
        dayNumber: 1,
        label: "Day 1: Squat + Push-up",
        exercises: [
          { exercise: "squat", sets: 3, reps: 8, formThreshold: 75 },
          { exercise: "pushup", sets: 3, reps: 10, formThreshold: 75 },
        ],
      },
      {
        dayNumber: 2,
        label: "Day 2: Deadlift + Overhead Press",
        exercises: [
          { exercise: "deadlift", sets: 3, reps: 6, formThreshold: 75 },
          { exercise: "overheadPress", sets: 3, reps: 8, formThreshold: 75 },
        ],
      },
      {
        dayNumber: 3,
        label: "Day 3: Squat + Push-up",
        exercises: [
          { exercise: "squat", sets: 3, reps: 8, formThreshold: 78 },
          { exercise: "pushup", sets: 3, reps: 10, formThreshold: 78 },
        ],
      },
      {
        dayNumber: 4,
        label: "Day 4: Deadlift + Overhead Press",
        exercises: [
          { exercise: "deadlift", sets: 3, reps: 6, formThreshold: 78 },
          { exercise: "overheadPress", sets: 3, reps: 8, formThreshold: 78 },
        ],
      },
      {
        dayNumber: 5,
        label: "Day 5: Squat + Push-up",
        exercises: [
          { exercise: "squat", sets: 4, reps: 8, formThreshold: 80 },
          { exercise: "pushup", sets: 4, reps: 10, formThreshold: 80 },
        ],
      },
      {
        dayNumber: 6,
        label: "Day 6: Deadlift + Overhead Press",
        exercises: [
          { exercise: "deadlift", sets: 4, reps: 6, formThreshold: 80 },
          { exercise: "overheadPress", sets: 4, reps: 8, formThreshold: 80 },
        ],
      },
      {
        dayNumber: 7,
        label: "Day 7: Full Body",
        exercises: [
          { exercise: "squat", sets: 3, reps: 8, formThreshold: 82 },
          { exercise: "deadlift", sets: 3, reps: 6, formThreshold: 82 },
          { exercise: "pushup", sets: 3, reps: 10, formThreshold: 82 },
          { exercise: "overheadPress", sets: 3, reps: 8, formThreshold: 82 },
        ],
      },
      {
        dayNumber: 8,
        label: "Day 8: Squat + Push-up",
        exercises: [
          { exercise: "squat", sets: 4, reps: 8, formThreshold: 83 },
          { exercise: "pushup", sets: 4, reps: 10, formThreshold: 83 },
        ],
      },
      {
        dayNumber: 9,
        label: "Day 9: Deadlift + Overhead Press",
        exercises: [
          { exercise: "deadlift", sets: 4, reps: 6, formThreshold: 83 },
          { exercise: "overheadPress", sets: 4, reps: 8, formThreshold: 83 },
        ],
      },
      {
        dayNumber: 10,
        label: "Day 10: Full Body Test",
        exercises: [
          { exercise: "squat", sets: 3, reps: 8, formThreshold: 85 },
          { exercise: "deadlift", sets: 3, reps: 6, formThreshold: 85 },
          { exercise: "pushup", sets: 3, reps: 10, formThreshold: 85 },
          { exercise: "overheadPress", sets: 3, reps: 8, formThreshold: 85 },
        ],
      },
    ],
  },
  {
    id: "pushup-challenge",
    name: "Push-up Challenge",
    description:
      "2-week push-up volume challenge with form gates. Prove your form can handle higher reps before progressing.",
    days: Array.from({ length: 8 }, (_, i) => ({
      dayNumber: i + 1,
      label: `Day ${i + 1}: Push-ups`,
      exercises: [
        {
          exercise: "pushup" as const,
          sets: 3 + Math.floor(i / 4),
          reps: 8 + Math.floor(i / 2) * 2,
          formThreshold: 75 + Math.floor(i / 2) * 2,
        },
      ],
    })),
  },
];
