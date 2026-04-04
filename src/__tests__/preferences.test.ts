import {
  loadAllPreferences,
  loadPreferences,
  savePreferences,
} from "../lib/sessionStorage";
import { DEFAULT_PREFERENCES } from "../lib/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("exercise preferences", () => {
  it("returns defaults when no preferences are saved", async () => {
    const prefs = await loadPreferences("squat");
    expect(prefs).toEqual(DEFAULT_PREFERENCES);
  });

  it("saves and loads preferences for an exercise", async () => {
    await savePreferences("squat", {
      restTimeSeconds: 120,
      targetSets: 5,
      targetReps: 10,
    });

    const prefs = await loadPreferences("squat");
    expect(prefs.restTimeSeconds).toBe(120);
    expect(prefs.targetSets).toBe(5);
    expect(prefs.targetReps).toBe(10);
  });

  it("keeps preferences separate per exercise", async () => {
    await savePreferences("squat", {
      restTimeSeconds: 120,
      targetSets: 5,
      targetReps: 10,
    });
    await savePreferences("deadlift", {
      restTimeSeconds: 180,
      targetSets: 3,
      targetReps: 5,
    });

    const squat = await loadPreferences("squat");
    const deadlift = await loadPreferences("deadlift");
    const pushup = await loadPreferences("pushup");

    expect(squat.restTimeSeconds).toBe(120);
    expect(deadlift.restTimeSeconds).toBe(180);
    expect(pushup).toEqual(DEFAULT_PREFERENCES);
  });

  it("loadAllPreferences returns all saved preferences", async () => {
    await savePreferences("squat", { ...DEFAULT_PREFERENCES, targetReps: 12 });
    const all = await loadAllPreferences();
    expect(all.squat?.targetReps).toBe(12);
    expect(all.deadlift).toBeUndefined();
  });
});
