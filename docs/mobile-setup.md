# Bus Passenger Assistant - Mobile Setup & Deployment Guide

This guide describes how to run, connect, and build the **Bus Passenger Assistant** Android mobile application.

---

## 1. Prerequisites

- **Node.js**: v18+ or v20 LTS (portable Node v20 is bundled in `C:\Users\Admin\.node\node-v20.18.0-win-x64`)
- **Python**: 3.10+ (Python 3.12 verified)
- **Expo CLI**: Included via `npx expo`
- **Android Device / Emulator**: Android 8.0+ (API 26+) or Expo Go app on a physical device.

---

## 2. Starting the Backend Server

The backend runs on Python FastAPI.

```bash
# In project root
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

The server binds to `0.0.0.0:8000` to allow connections from local machine, Android emulators, and local WiFi network devices.
Verify health:
```bash
curl http://localhost:8000/health
```

---

## 3. Starting the Mobile Application

```bash
cd mobile

# Start Expo development server
npx expo start
```

### Options to test:
1. **Android Emulator**:
   - Press `a` in the terminal to launch the app on the running Android Virtual Device (AVD).
2. **Physical Android Phone**:
   - Install **Expo Go** from Google Play Store.
   - Scan the QR code displayed in the terminal with your camera or Expo Go.
   - Ensure the phone and PC are on the same WiFi network.
3. **Web Browser Preview**:
   - Press `w` in the terminal to open the web preview.

---

## 4. Connecting Mobile to Backend

Inside the app:
1. Navigate to the **Settings** tab.
2. Select or enter the Backend URL:
   - **Android Emulator**: Tap **`Android Emulator (10.0.2.2)`** (`http://10.0.2.2:8000`).
   - **Physical Device**: Enter your PC's local IP address e.g. `http://192.168.1.100:8000`.
   - **Web Browser**: Tap **`Localhost (127.0.0.1)`** (`http://127.0.0.1:8000`).
3. Tap **Test Connection** to confirm connectivity.
4. Tap **Save URL**.

---

## 5. Building an Installable APK (Android Package)

To build a standalone `.apk` for direct installation on Android devices:

### Option A: Using EAS Build (Cloud Build - Recommended)
```bash
cd mobile
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build APK for direct sideloading
eas build -p android --profile preview
```
This generates a downloadable `.apk` link that can be installed on any Android device without Google Play.

### Option B: Local Android Build
If you have Android Studio and Android SDK installed on Windows:
```bash
cd mobile
npx expo prebuild
npx expo run:android --variant release
```
The output APK is generated at:
`mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## 6. Building an AAB (Android App Bundle for Play Store)

To generate an `.aab` for Google Play Console distribution:
```bash
cd mobile
eas build -p android --profile production
```
Or locally:
```bash
cd mobile/android
./gradlew bundleRelease
```
Output AAB:
`mobile/android/app/build/outputs/bundle/release/app-release.aab`

---

## 7. Running Automated Tests

### Backend Tests (Pytest)
```bash
python -m pytest backend/tests/test_api.py -v
```

### Mobile Tests (Unit & Persistence)
```bash
cd mobile
npx ts-node tests/app.test.ts
```
