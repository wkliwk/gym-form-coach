import type { Exercise, FormFlag, RepRecord } from "./lib/types";

export type TrainStackParamList = {
  Home: undefined;
  Session: { exerciseType: Exercise };
  Summary: {
    exercise: Exercise;
    reps: number;
    topFlag: FormFlag | null;
    score: number;
    repRecords: RepRecord[];
  };
};

export type TabParamList = {
  Train: undefined;
  History: undefined;
  Settings: undefined;
};
