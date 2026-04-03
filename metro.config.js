// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Stub out browser-only deps pulled in by @tensorflow-models/pose-detection.
// We only use MoveNet with CPU backend — BlazePose, PoseNet, and WebGPU are unused.
const STUB_MODULES = [
  "@mediapipe/pose",
  "@tensorflow/tfjs-backend-webgpu",
  "@tensorflow/tfjs-backend-webgl",
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (STUB_MODULES.includes(moduleName)) {
    return { type: "empty" };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
