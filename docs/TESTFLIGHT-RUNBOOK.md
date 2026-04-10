# TestFlight Production Build Runbook

Step-by-step guide to build and submit Gym Form Coach to TestFlight.

## Prerequisites

- Apple Developer account (paid, $99/year)
- EAS CLI installed (`npm install -g eas-cli@latest`)
- Logged into EAS: `eas login`
- Logged into Expo: `npx expo login`

## Step 1: Set Apple credentials

You need three values from [App Store Connect](https://appstoreconnect.apple.com):

| Variable | Where to find it |
|---|---|
| `APPLE_ID` | Your Apple Developer email |
| `APPLE_TEAM_ID` | [Membership page](https://developer.apple.com/account#MembershipDetailsCard) → Team ID |
| `ASC_APP_ID` | Create the app in App Store Connect first (see Step 2), then copy the Apple ID from App Information |

Export them before running build/submit:

```bash
export APPLE_ID="your@email.com"
export APPLE_TEAM_ID="XXXXXXXXXX"
export ASC_APP_ID="1234567890"
```

Or edit `eas.json` directly and replace the `$VARIABLE` placeholders with actual values.

## Step 2: Create App Store Connect listing (first time only)

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → My Apps → (+) New App
2. Fill in:
   - **Platform:** iOS
   - **Name:** Gym Form Coach
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** `com.wkliwk.gymformcoach` (register in [Certificates, IDs & Profiles](https://developer.apple.com/account/resources/identifiers/list) first if needed)
   - **SKU:** `gymformcoach`
3. After creating, note the **Apple ID** (numeric) from App Information → copy to `ASC_APP_ID`

## Step 3: Run production build

```bash
cd ~/Dev/gym-form-coach
eas build --platform ios --profile production
```

- First run will prompt for Apple Developer credentials interactively
- EAS manages signing (provisioning profile + distribution certificate) automatically
- Build runs on EAS servers (~10-20 min)
- When done, you'll get a build URL and artifact download link

## Step 4: Submit to TestFlight

```bash
eas submit --platform ios --profile production --latest
```

The `--latest` flag picks the most recent successful production build.

If you prefer to submit a specific build:
```bash
eas submit --platform ios --profile production --id <BUILD_ID>
```

## Step 5: TestFlight setup

1. Go to App Store Connect → TestFlight
2. The build will appear after Apple processes it (~5-30 min)
3. You may need to answer **Export Compliance** questions (we set `ITSAppUsesNonExemptEncryption: false` so answer "No")
4. **Internal Testing:** Your Apple Developer account email is automatically added
5. **External Testing (optional):** Create a test group → add testers by email → submit for Beta App Review

## Step 6: Verify

- [ ] Build appears in App Store Connect
- [ ] TestFlight build available for internal testing
- [ ] Install on a real iPhone 12+ via TestFlight
- [ ] App launches without crash
- [ ] Complete one full session (pick exercise → camera → reps → summary)

## Troubleshooting

| Issue | Fix |
|---|---|
| "No matching provisioning profile" | EAS handles this automatically; if it fails, run `eas credentials` to manage manually |
| Build fails on native modules | Check `expo doctor` for SDK compatibility issues |
| "Missing compliance" in TestFlight | App Information → set encryption to "No" |
| Build queued for a long time | Check [EAS Build status](https://expo.dev/accounts/wkliwk/builds) |

## Subsequent builds

After the first successful build, future builds are simpler:

```bash
# Build (buildNumber auto-increments)
eas build --platform ios --profile production

# Submit
eas submit --platform ios --profile production --latest
```
