import { checkProgression } from "../lib/programProgress";
import type { ProgramExercise } from "../lib/types";

describe("checkProgression", () => {
  const exercises: ProgramExercise[] = [
    { exercise: "squat", sets: 3, reps: 8, formThreshold: 80 },
    { exercise: "pushup", sets: 3, reps: 10, formThreshold: 75 },
  ];

  it("passes when all exercises meet threshold", () => {
    const result = checkProgression(exercises, {
      squat: 85,
      pushup: 80,
    });
    expect(result.passed).toBe(true);
    expect(result.exerciseResults.every((r) => r.passed)).toBe(true);
  });

  it("fails when one exercise is below threshold", () => {
    const result = checkProgression(exercises, {
      squat: 85,
      pushup: 70,
    });
    expect(result.passed).toBe(false);
    expect(result.exerciseResults[0].passed).toBe(true);
    expect(result.exerciseResults[1].passed).toBe(false);
  });

  it("fails when score is exactly at threshold", () => {
    const result = checkProgression(exercises, {
      squat: 80,
      pushup: 75,
    });
    expect(result.passed).toBe(true);
  });

  it("fails when exercise score is missing", () => {
    const result = checkProgression(exercises, {
      squat: 85,
    });
    expect(result.passed).toBe(false);
    expect(result.exerciseResults[1].avgScore).toBe(0);
  });

  it("handles single exercise", () => {
    const single: ProgramExercise[] = [
      { exercise: "squat", sets: 3, reps: 8, formThreshold: 70 },
    ];
    const result = checkProgression(single, { squat: 72 });
    expect(result.passed).toBe(true);
  });
});
