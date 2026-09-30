# Gym Form Coach

Real-time AI gym form coaching for iOS/Android — point your phone at yourself, perform a rep, get instant corrective audio feedback. No trainer needed.

## What it does

On-device pose estimation (react-native-vision-camera + TensorFlow.js MoveNet) analyzes joint angles per rep and delivers one spoken cue plus haptic feedback — hands-free, no need to check the screen mid-set.

Supports Squat, Deadlift, Push-up, Overhead Press, Bench Press, with exercise-specific form flags (e.g. knees caving on squats, rounded lower back on deadlifts, bar drift on overhead press).

Built for self-coached gym-goers who train regularly without a personal trainer — existing fitness apps track volume, not movement quality.

## Setup

```bash
npm install
npx expo start          # or: npx expo start --ios
eas build --platform ios --profile preview   # physical device build
```

## Stack

Expo / React Native, react-native-vision-camera, TensorFlow.js (MoveNet), expo-speech.

## Status

Active — see `PRODUCT.md` for full feature specs and acceptance criteria.
