/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["./jest.setup.js"],
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^expo/src/winter/ImportMetaRegistry$": "<rootDir>/src/__mocks__/ImportMetaRegistryMock.js",
    "^expo/src/winter$": "<rootDir>/src/__mocks__/expoWinterMock.js",
    "^expo/src/winter/index$": "<rootDir>/src/__mocks__/expoWinterMock.js",
  },
};
