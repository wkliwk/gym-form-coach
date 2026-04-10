import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";


const REMINDER_KEY = "@gym_form_coach/reminder";
const NOTIFICATION_ID = "daily-training-reminder";

export interface ReminderSettings {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
}

const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 18,
  minute: 0,
};

const MOTIVATIONAL_MESSAGES = [
  "Time to train! Your form coach is ready.",
  "Don't break your streak — let's get a session in today.",
  "Your muscles are waiting. Fire up the form coach!",
  "Consistency beats intensity. Quick session today?",
  "Good form = fewer injuries. Let's practice.",
];

export async function loadReminderSettings(): Promise<ReminderSettings> {
  const raw = await AsyncStorage.getItem(REMINDER_KEY);
  if (!raw) return { ...DEFAULT_REMINDER };
  try {
    return JSON.parse(raw) as ReminderSettings;
  } catch {
    return { ...DEFAULT_REMINDER };
  }
}

export async function saveReminderSettings(
  settings: ReminderSettings
): Promise<void> {
  await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(settings));
  if (settings.enabled) {
    await scheduleDailyReminder(settings);
  } else {
    await cancelReminder();
  }
}

async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleDailyReminder(
  settings: ReminderSettings
): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  // Cancel existing before scheduling new
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(
    () => {}
  );

  // Pick a random message
  const body =
    MOTIVATIONAL_MESSAGES[
      Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
    ];

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: "Gym Form Coach",
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.hour,
      minute: settings.minute,
    },
  });
}

export async function cancelReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(
    () => {}
  );
}

/** Call once at app startup to configure notification behavior. */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
