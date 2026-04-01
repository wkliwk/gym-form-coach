import { useRef, useCallback } from "react";
import type { Pose } from "@tensorflow-models/pose-detection";
import type { Exercise, FormFlag } from "../lib/types";
import {
  createSquatState,
  processSquatFrame,
  type SquatState,
} from "../lib/formAnalysis/squat";

export interface RepEvent {
  repNumber: number;
  flag: FormFlag | null;
}

interface RepDetectorState {
  squat: SquatState;
}

export function useRepDetector(exercise: Exercise) {
  const stateRef = useRef<RepDetectorState>({
    squat: createSquatState(),
  });

  const totalReps = useRef(0);
  const flagCounts = useRef<Partial<Record<FormFlag, number>>>({});

  const processPose = useCallback(
    (pose: Pose): RepEvent | null => {
      if (exercise !== "squat") {
        // Deadlift and push-up modules will be added in issue #5
        return null;
      }

      const result = processSquatFrame(pose, stateRef.current.squat);
      stateRef.current.squat = result.state;

      if (result.completedRep) {
        totalReps.current += 1;
        if (result.flag) {
          flagCounts.current[result.flag] =
            (flagCounts.current[result.flag] ?? 0) + 1;
        }
        return { repNumber: totalReps.current, flag: result.flag };
      }

      return null;
    },
    [exercise]
  );

  const getStats = useCallback(() => {
    return {
      totalReps: totalReps.current,
      flagCounts: { ...flagCounts.current },
      topFlag: getTopFlag(flagCounts.current),
      score: computeScore(totalReps.current, flagCounts.current),
    };
  }, []);

  const reset = useCallback(() => {
    stateRef.current = { squat: createSquatState() };
    totalReps.current = 0;
    flagCounts.current = {};
  }, []);

  return { processPose, getStats, reset };
}

function getTopFlag(
  counts: Partial<Record<FormFlag, number>>
): FormFlag | null {
  let top: FormFlag | null = null;
  let max = 0;
  for (const [flag, count] of Object.entries(counts)) {
    if (count! > max) {
      max = count!;
      top = flag as FormFlag;
    }
  }
  return top;
}

function computeScore(
  totalReps: number,
  counts: Partial<Record<FormFlag, number>>
): number {
  if (totalReps === 0) return 100;
  const flaggedReps = Object.values(counts).reduce(
    (sum, c) => sum + (c ?? 0),
    0
  );
  return Math.round(Math.max(0, ((totalReps - flaggedReps) / totalReps) * 100));
}
