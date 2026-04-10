import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadReminderSettings,
  saveReminderSettings,
} from "../lib/notifications";

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notification-id"),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DAILY: "daily" },
  AndroidNotificationPriority: { DEFAULT: "default" },
}));

describe("notifications", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("loadReminderSettings returns defaults when empty", async () => {
    const settings = await loadReminderSettings();
    expect(settings).toEqual({
      enabled: false,
      hour: 18,
      minute: 0,
    });
  });

  it("saveReminderSettings + loadReminderSettings round-trip", async () => {
    const settings = { enabled: true, hour: 7, minute: 30 };
    await saveReminderSettings(settings);
    const loaded = await loadReminderSettings();
    expect(loaded).toEqual(settings);
  });

  it("saving with enabled=true schedules notification", async () => {
    const Notifications = require("expo-notifications");
    await saveReminderSettings({ enabled: true, hour: 19, minute: 0 });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "daily-training-reminder",
        trigger: expect.objectContaining({
          hour: 19,
          minute: 0,
        }),
      })
    );
  });

  it("saving with enabled=false cancels notification", async () => {
    const Notifications = require("expo-notifications");
    await saveReminderSettings({ enabled: false, hour: 18, minute: 0 });
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      "daily-training-reminder"
    );
  });

  it("handles corrupted storage gracefully", async () => {
    await AsyncStorage.setItem(
      "@gym_form_coach/reminder",
      "not-valid-json{{{{"
    );
    const settings = await loadReminderSettings();
    expect(settings).toEqual({ enabled: false, hour: 18, minute: 0 });
  });
});
