import type { Exercise, FormFlag, RepRecord, SetRecord } from "./lib/types";

export type TrainStackParamList = {
  Home: undefined;
  ExerciseTips: { exerciseType: Exercise };
  Session: {
    exerciseType: Exercise;
    setNumber?: number;
    previousSets?: SetRecord[];
    workoutStartTime?: number;
  };
  RestTimer: {
    exerciseType: Exercise;
    completedSets: SetRecord[];
    workoutStartTime: number;
  };
  Summary: {
    exercise: Exercise;
    reps: number;
    topFlag: FormFlag | null;
    score: number;
    repRecords: RepRecord[];
    sets?: SetRecord[];
    durationMs?: number;
  };
};

export type TabParamList = {
  Train: undefined;
  History: undefined;
  Settings: undefined;
};
