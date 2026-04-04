import type { Exercise, FormFlag } from "./lib/types";

export type TrainStackParamList = {
  Home: undefined;
  Session: { exerciseType: Exercise };
  Summary: {
    exercise: Exercise;
    reps: number;
    topFlag: FormFlag | null;
    score: number;
  };
};

export type TabParamList = {
  Train: undefined;
  History: undefined;
  Settings: undefined;
};
