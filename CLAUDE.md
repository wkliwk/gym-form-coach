# Gym Form Coach — CLAUDE.md

## Product Goal
Real-time AI gym form coach. Phone camera + on-device pose estimation → corrective cues per rep. No trainer needed.

**Anti-goals:** No cloud video processing. No social features. No workout planning. No Android at MVP. No paywall at launch.

## Tech Stack
- **Framework:** Expo (React Native), TypeScript
- **Camera:** react-native-vision-camera (better ML performance than expo-camera)
- **Pose estimation:** TensorFlow.js + @tensorflow-models/pose-detection (MoveNet) or MediaPipe via WASM
- **Audio:** expo-speech (AVSpeechSynthesizer on iOS)
- **Local storage:** AsyncStorage (session history, no cloud sync)
- **Build:** EAS Build (iOS Simulator + device)
- **CI:** GitHub Actions — `npx tsc --noEmit` on every push

## Device Floor
iPhone 12 (A14 Bionic) or newer. Do not support older devices — pose estimation degrades badly.

## Key Architecture
```
src/
  screens/
    Home.tsx          — exercise picker
    Session.tsx       — live camera + pose overlay + cue delivery
    Summary.tsx       — post-set summary
    History.tsx       — local session history list
  components/
    PoseOverlay.tsx   — skeleton renderer on top of camera
    CueBanner.tsx     — audio + visual cue delivery
    SafetyBanner.tsx  — persistent "movement guide" disclaimer
    CameraGuide.tsx   — phone placement overlay before session
  lib/
    poseEstimation.ts — TF.js model wrapper
    formAnalysis/
      squat.ts        — squat rep detection + flag logic
      deadlift.ts     — deadlift rep detection + flag logic
      pushup.ts       — push-up rep detection + flag logic
    sessionStorage.ts — AsyncStorage read/write
  hooks/
    useCamera.ts
    usePoseEstimation.ts
    useRepDetector.ts
```

## MVP Exercise Set
1. Squat — hip descent below knee = bottom, flags: knees caving, depth too shallow, forward lean
2. Deadlift — hip hinge bar-from-floor, flags: rounded lower back, hips rising early, bar drift
3. Push-up — chest to floor full extension, flags: hips sagging, elbows flaring, incomplete range

## Safety Rules
- Always show `SafetyBanner` during active session ("Movement guide — stop if you feel pain")
- Never show a block modal for safety — persistent small banner only
- Max 1 audio cue per rep (most important flag only)
- Camera placement guide mandatory before each first session on a new exercise

## Commands
```bash
npm install          # install deps
npx expo start       # start dev server
npx expo start --ios # open iOS simulator
eas build --platform ios --profile preview  # build for device
npx tsc --noEmit    # TypeScript check (must pass before commit)
```

## Repo
- GitHub: https://github.com/wkliwk/gym-form-coach
- Board: Project 10 (https://github.com/users/wkliwk/projects/10)

## Decisions Log
Append decisions to `~/Dev/decisions.jsonl`:
```bash
echo '{"date":"YYYY-MM-DD","project":"gym-form-coach","summary":"..."}' >> ~/Dev/decisions.jsonl
```
