# Gym Form Coach

Real-time AI gym form coaching for iOS. Point your phone at yourself, perform a rep, get instant corrective audio feedback — no trainer needed.

## Setup

```bash
npm install
npx expo start
```

To open directly on iOS Simulator:

```bash
npx expo start --ios
```

To build for a physical device (requires EAS CLI):

```bash
eas build --platform ios --profile preview
```

## TypeScript Check

```bash
npx tsc --noEmit
```

This must pass with zero errors before committing.

## Device Floor

**iPhone 12 (A14 Bionic) or newer is required.** On-device pose estimation (TensorFlow.js MoveNet) requires the performance headroom of A14 Bionic or better. Older devices produce frame rates that make real-time form analysis unreliable.

## Project Structure

```
src/
  screens/        — full-screen route components (Home, Session, Summary, History)
  components/     — shared UI components (PoseOverlay, CueBanner, SafetyBanner, CameraGuide)
  lib/            — business logic (pose estimation, form analysis, session storage)
  hooks/          — custom React hooks (useCamera, usePoseEstimation, useRepDetector)
```

## Supported Exercises (MVP)

- Squat
- Deadlift
- Push-up

## Tech Stack

- Expo SDK 54 + React Native
- TypeScript (strict mode)
- react-native-vision-camera
- TensorFlow.js + MoveNet (on-device pose estimation)
- expo-speech (audio cues via AVSpeechSynthesizer)
- AsyncStorage (local session history, no cloud sync)
- EAS Build (iOS)
