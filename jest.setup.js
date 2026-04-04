// Mock expo-speech to avoid native module errors in Jest
jest.mock("expo-speech", () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
}));

// Mock expo-haptics to avoid native module errors in Jest
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

// Mock expo-sharing
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  cacheDirectory: "/tmp/",
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-mail-composer
jest.mock("expo-mail-composer", () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  composeAsync: jest.fn(() => Promise.resolve({ status: "sent" })),
}));

// Mock @react-native-async-storage/async-storage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
