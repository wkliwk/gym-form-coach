import { useRef, useCallback } from "react";
import type { Pose } from "@tensorflow-models/pose-detection";
import type { Exercise, FormFlag, RepRecord } from "../lib/types";
import {
  createSquatState,
  processSquatFrame,
  type SquatState,
} from "../lib/formAnalysis/squat";
import {
  createDeadliftState,
  processDeadliftFrame,
  type DeadliftState,
} from "../lib/formAnalysis/deadlift";
import {
  createPushupState,
  processPushupFrame,
  type PushupState,
} from "../lib/formAnalysis/pushup";
import {
  createOverheadPressState,
  processOverheadPressFrame,
  type OverheadPressState,
} from "../lib/formAnalysis/overheadPress";

export interface RepEvent {
  repNumber: number;
  flag: FormFlag | null;
}

interface RepDetectorState {
  squat: SquatState;
  deadlift: DeadliftState;
  pushup: PushupState;
  overheadPress: OverheadPressState;
}

export function useRepDetector(exercise: Exercise) {
  const stateRef = useRef<RepDetectorState>({
    squat: createSquatState(),
    deadlift: createDeadliftState(),
    pushup: createPushupState(),
    overheadPress: createOverheadPressState(),
  });

  const totalReps = useRef(0);
  const flagCounts = useRef<Partial<Record<FormFlag, number>>>({});
  const repRecords = useRef<RepRecord[]>([]);

  const processPose = useCallback(
    (pose: Pose): RepEvent | null => {
      let result: { completedRep: boolean; flag: FormFlag | null };

      switch (exercise) {
        case "squat": {
          const r = processSquatFrame(pose, stateRef.current.squat);
          stateRef.current.squat = r.state;
          result = r;
          break;
        }
        case "deadlift": {
          const r = processDeadliftFrame(pose, stateRef.current.deadlift);
          stateRef.current.deadlift = r.state;
          result = r;
          break;
        }
        case "pushup": {
          const r = processPushupFrame(pose, stateRef.current.pushup);
          stateRef.current.pushup = r.state;
          result = r;
          break;
        }
        case "overheadPress": {
          const r = processOverheadPressFrame(pose, stateRef.current.overheadPress);
          stateRef.current.overheadPress = r.state;
          result = r;
          break;
        }
      }

      if (result.completedRep) {
        totalReps.current += 1;
        if (result.flag) {
          flagCounts.current[result.flag] =
            (flagCounts.current[result.flag] ?? 0) + 1;
        }
        repRecords.current.push({
          repNumber: totalReps.current,
          flag: result.flag,
        });
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
      repRecords: [...repRecords.current],
    };
  }, []);

  const reset = useCallback(() => {
    stateRef.current = {
      squat: createSquatState(),
      deadlift: createDeadliftState(),
      pushup: createPushupState(),
      overheadPress: createOverheadPressState(),
    };
    totalReps.current = 0;
    flagCounts.current = {};
    repRecords.current = [];
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
