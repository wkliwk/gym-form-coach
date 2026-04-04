# Gym Form Coach — Product Documentation

## Overview
**What:** Mobile app (iOS + Android) that uses the phone camera and on-device pose estimation to analyze exercise form in real time, delivering corrective coaching cues per rep.
**Who:** Self-coached gym-goers aged 18-35 who train 3-5x/week without a personal trainer.
**Problem:** Bad form causes injury and wasted effort. Personal trainers cost $60-150/hr and aren't present for most reps. Existing fitness apps (Fitbod, JEFIT) track volume, not movement quality.
**Core mechanic:** Phone propped against something -> camera detects pose landmarks -> rep counted + form scored -> one audio cue + haptic feedback delivered per rep.

---

## Features

### 1. Real-Time Form Analysis
**Description:** Live camera view with skeleton overlay. On-device pose estimation (react-native-vision-camera + TensorFlow.js MoveNet) analyses joint angles and flags form issues each rep.
**Supported exercises:** Squat, Deadlift, Push-up, Overhead Press.
**User flow:**
1. User opens app -> completes onboarding (first launch only) -> selects exercise
2. Camera placement guide shown (where to position phone)
3. User starts set -- camera detects pose
4. Skeleton overlay renders on live feed
5. Each rep auto-detected; form scored PASS or FLAG
6. Safety banner persistent: "Movement guide -- stop if you feel pain"

**Acceptance criteria:**
- [x] Camera renders full-screen (back camera, portrait)
- [x] 33 landmarks detected at 15+ fps on iPhone 12+ (via vision-camera frame processors)
- [x] Skeleton overlay visible during live session
- [x] Camera permission denied -> clear "enable camera" prompt shown
- [x] Safety banner always visible during active session
- [x] Camera placement guide shown before first rep of each exercise

---

### 2. Rep Detection + Audio/Haptic Cue Delivery
**Description:** Auto-detects rep start/end from landmark movement. Delivers one specific audio cue (or confirmation) after each rep via expo-speech so the user doesn't need to look at the screen. Haptic feedback on each rep completion for tactile responsiveness.

**Squat flags:** knees caving, depth too shallow, forward lean
**Deadlift flags:** rounded lower back, hips rising early, bar drift
**Push-up flags:** hips sagging, elbows flaring, incomplete range
**Overhead Press flags:** bar path drift, excessive back arch, incomplete lockout

**Acceptance criteria:**
- [x] Squat reps counted accurately (hip below knee = bottom)
- [x] Deadlift reps counted (hip hinge from floor to lockout)
- [x] Push-up reps counted (chest to floor, full extension)
- [x] Overhead press reps counted (bar from shoulders to lockout)
- [x] Audio cue delivered within 500ms of rep completion
- [x] Max 1 cue per rep (most critical flag only)
- [x] "Good rep" audio on clean reps
- [x] Haptic feedback on every rep completion

---

### 3. Multi-Set Workout Flow with Rest Timer
**Description:** After completing a set, users can take a timed rest (configurable: 60/90/120/180 seconds) and continue to the next set of the same exercise. Keeps users in a structured workout without manual set tracking.

**User flow:**
1. User completes a set -> taps "End Set"
2. Rest timer screen with countdown (configurable duration)
3. Timer ends -> user starts next set
4. After final set -> proceeds to Summary

**Acceptance criteria:**
- [x] Rest timer appears between sets with configurable duration (60/90/120/180s)
- [x] Visual countdown with clear "Start Next Set" button
- [x] User can skip rest early
- [x] Set count tracked and shown on Summary

---

### 4. Rep-by-Rep Form Breakdown on Summary
**Description:** Post-session summary shows each rep individually with its form flags, enabling users to see exactly where form broke down (typically later reps due to fatigue).

**Acceptance criteria:**
- [x] Summary screen shows per-rep breakdown (rep number + flags)
- [x] Fatigue detection: highlights if form degraded in later reps
- [x] Overall session stats: total reps, clean reps, flagged reps

---

### 5. Session History with Progress Tracking
**Description:** Local history of all workout sessions with personal bests, workout streaks, and score trends. Users can track improvement over time.

**Acceptance criteria:**
- [x] History screen shows all past sessions (exercise, date, reps, flags)
- [x] Personal bests tracked and highlighted (most reps, best form)
- [x] Workout streak counter (consecutive days with a session)
- [x] Score trends visible across sessions
- [x] Delete individual sessions or clear all history
- [x] No cloud sync, no account required
- [x] Data persisted via AsyncStorage

---

### 6. Camera Placement Guide
**Description:** Pre-session overlay showing exactly where to position the phone for accurate pose detection.
**Acceptance criteria:**
- [x] Shown automatically before first rep of each exercise type
- [x] Shows phone position diagram (side view for squat/deadlift, front view for push-up/overhead press)
- [x] User can dismiss and proceed
- [x] Not shown again for same exercise in same session

---

### 7. Onboarding, Branding, and Settings
**Description:** First-launch onboarding flow, branded splash screen, app icon, and settings screen.

**Acceptance criteria:**
- [x] Onboarding shown on first launch only
- [x] Branded splash screen on app start
- [x] Custom app icon (iOS + Android adaptive icon)
- [x] Settings/About screen with app version and build info

---

## Out of Scope (Current)
- Cloud sync or cross-device history
- Social features (sharing, leaderboard)
- Trainer marketplace or live coaching
- Health Credit cross-sell or integrations
- Subscription or paywall (free at launch to gather usage data)
- EAS OTA updates
- Push notifications
- Per-rep numeric scoring (planned for Phase 6, #51)
- In-app feedback form (planned for Phase 6, #50)
- Exercise form tips reference (planned for Phase 6, #52)

## Platform Support
- **iOS:** Full support, EAS builds configured. TestFlight upload blocked on Apple credentials (#22).
- **Android:** Full support, APK builds via EAS. Available for internal testing.

## Device Floor
iPhone 12 (A14 Bionic) or newer. Android equivalent TBD. Pose estimation at required fps degrades badly on older hardware.

## Test Coverage
53 tests via Jest + React Native Testing Library. CI runs `tsc --noEmit` + `jest` on every push.
