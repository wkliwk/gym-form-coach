# Gym Form Coach — Product Documentation

## Overview
**What:** iOS mobile app that uses the phone camera and on-device pose estimation to analyze exercise form in real time, delivering corrective coaching cues per rep.  
**Who:** Self-coached gym-goers aged 18–35 who train 3–5x/week without a personal trainer.  
**Problem:** Bad form causes injury and wasted effort. Personal trainers cost $60–150/hr and aren't present for most reps. Existing fitness apps (Fitbod, JEFIT) track volume, not movement quality.  
**Core mechanic:** Phone propped against something → camera detects pose landmarks → rep counted + form scored → one audio cue delivered per rep.

---

## Features

### 1. Real-Time Form Analysis
**Description:** Live camera view with skeleton overlay. On-device pose estimation (TensorFlow.js + MoveNet) analyses joint angles and flags form issues each rep.  
**Supported exercises (MVP):** Squat, Deadlift, Push-up.  
**User flow:**
1. User opens app → selects exercise
2. Camera placement guide shown (where to position phone)
3. User starts set — camera detects pose
4. Skeleton overlay renders on live feed
5. Each rep auto-detected; form scored PASS or FLAG
6. Safety banner persistent: "Movement guide — stop if you feel pain"

**Acceptance criteria:**
- [ ] Camera renders full-screen (back camera, portrait)
- [ ] 33 landmarks detected at ≥15fps on iPhone 12+
- [ ] Skeleton overlay visible during live session
- [ ] Camera permission denied → clear "enable camera" prompt shown
- [ ] Safety banner always visible during active session
- [ ] Camera placement guide shown before first rep of each exercise

---

### 2. Rep Detection + Audio Cue Delivery
**Description:** Auto-detects rep start/end from landmark movement. Delivers one specific audio cue (or confirmation) after each rep via AVSpeechSynthesizer so the user doesn't need to look at the screen.  

**Squat flags:** knees caving, depth too shallow, forward lean  
**Deadlift flags:** rounded lower back, hips rising early, bar drift  
**Push-up flags:** hips sagging, elbows flaring, incomplete range  

**User flow:**
1. User performs rep
2. System detects bottom + top positions → rep counted
3. Most important flag identified (or "Good rep" if none)
4. Audio cue delivered immediately after rep completion
5. Visual cue briefly shown on screen

**Acceptance criteria:**
- [ ] Squat reps counted accurately (hip below knee = bottom)
- [ ] Deadlift reps counted (hip hinge from floor to lockout)
- [ ] Push-up reps counted (chest to floor, full extension)
- [ ] Audio cue delivered within 500ms of rep completion
- [ ] Max 1 cue per rep (most critical flag only)
- [ ] "Good rep" audio on clean reps

---

### 3. Session Summary + Local History
**Description:** After a set ends, shows a summary and persists it to AsyncStorage. Minimum retention mechanic — users track progress without cloud infrastructure.  
**User flow:**
1. User taps "End Session" (or 60s inactivity)
2. Summary screen: exercise, total reps, most common flag, drill suggestion
3. Delta badge: if same exercise done before, shows rep count change vs last session
4. History tab shows last 10 sessions as a list

**Acceptance criteria:**
- [ ] Summary screen appears on session end
- [ ] Shows: exercise name, rep count, top flag (or "Great form!"), one drill suggestion
- [ ] Session stored locally: `{ date, exercise, reps, topFlag, score }`
- [ ] History screen shows last 10 sessions
- [ ] Delta badge shown for repeat exercises
- [ ] No cloud sync, no account required

---

### 4. Camera Placement Guide
**Description:** Pre-session overlay showing exactly where to position the phone for accurate pose detection. Mandatory before each exercise type's first session.  
**Acceptance criteria:**
- [ ] Shown automatically before first rep of each exercise type
- [ ] Shows phone position diagram (side view for squat/deadlift, front view for push-up)
- [ ] User can dismiss and proceed
- [ ] Not shown again for same exercise in same session

---

## Out of Scope (MVP)
- Any exercise beyond squat, deadlift, push-up
- Cloud sync or cross-device history
- Progress charts or trend analytics
- Social features (sharing, leaderboard)
- Trainer marketplace or live coaching
- Health Credit cross-sell or integrations
- Android support (iOS only to control device floor)
- Subscription or paywall (free at launch to gather usage data)
- EAS OTA updates
- Push notifications

## Device Floor
iPhone 12 (A14 Bionic) or newer. Pose estimation at required fps degrades badly on older hardware.
