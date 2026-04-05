# Gym Form Coach — Privacy Policy

**Last updated:** April 5, 2026

## Overview

Gym Form Coach is a mobile application that uses your device's camera to analyze exercise form in real time. We are committed to protecting your privacy. This policy explains what data the app accesses and how it is handled.

## Data We Do NOT Collect

- We do **not** collect, store, or transmit any personal information
- We do **not** upload your camera feed or video to any server
- We do **not** use analytics or tracking services
- We do **not** require an account, login, or registration
- We do **not** share any data with third parties

## Camera Usage

Gym Form Coach requires camera access to detect body landmarks (pose estimation) for real-time form analysis. Important facts about camera usage:

- **All processing happens on your device.** The camera feed is processed locally using on-device machine learning (TensorFlow.js / MoveNet).
- **No video is recorded or stored.** The camera feed is analyzed frame-by-frame in real time and immediately discarded.
- **No images leave your device.** There is no network transmission of camera data.

## Local Data Storage

The app stores the following data locally on your device using AsyncStorage:

- **Session history:** Exercise type, rep count, form score, and flags for each workout session
- **Exercise preferences:** Your preferred rest time, target sets, and target reps per exercise
- **Program progress:** Which workout program you're following and your current day
- **Onboarding state:** Whether you've completed the initial setup

This data:
- Is stored only on your device
- Is never transmitted to any server
- Can be exported by you at any time (Settings > Export Data)
- Can be deleted by you at any time (History > Clear All)

## Network Access

Gym Form Coach makes **no network requests**. The app works entirely offline. The only network activity is standard Expo/React Native framework behavior (e.g., development mode hot reloading, which is disabled in production builds).

## Children's Privacy

Gym Form Coach does not knowingly collect information from children under 13. The app does not collect any personal information from any user.

## Changes to This Policy

If we update this privacy policy, we will update the "Last updated" date above. Continued use of the app after changes constitutes acceptance of the updated policy.

## Contact

For privacy questions or concerns, email: feedback@gymformcoach.app
