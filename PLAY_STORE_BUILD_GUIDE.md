# Google Play Store Release & Build Guide
## **SpendWise — Daily Money Coach**
*Application ID: `com.spendwise.dailycoach` | Target SDK: 35 (Android 15 Ready)*

---

## ⚡ 1. Fast Track: Generate Standalone APK & Play Store AAB

SpendWise uses **Expo Application Services (EAS)** for 1-click cloud builds, ensuring native C++/Hermes and Android 15 compatibility with zero local environment errors.

### 📱 A. Generate Direct Install APK (For your phone)
Run this command inside the project directory (`spendwise-mobile`):
```bash
npx eas-cli build -p android --profile preview
```
- EAS will build a standalone `.apk` in 3–5 minutes.
- It will print a **direct download URL** and a **QR code** on your terminal.
- Scan the QR code or click the link to install the `.apk` directly onto any Android phone.

---

### 🏛️ B. Generate Play Store Version (.aab App Bundle)
Google Play requires an **Android App Bundle (.aab)** for all new releases:
```bash
npx eas-cli build -p android --profile production
```
- Outputs: `spendwise-daily-coach.aab`
- Fully signed with Google Play App Signing credentials.
- Ready to drag-and-drop into [Google Play Console](https://play.google.com/console).

---

## 🛠️ 2. Local Native Android Build (Offline / Command Line)

The full native Android Gradle project is located at:
`spendwise-mobile/android/`

### Prerequisites:
- Android SDK 35 (`platforms/android-35` and `build-tools/35.0.0`) installed at `%LOCALAPPDATA%\Android\Sdk`.
- Java JDK 17 or higher.

### Build Commands:
```powershell
# Navigate to the native android directory
cd C:\Users\SAMSUNG\.gemini\antigravity\scratch\spendwise-mobile\android

# Build Debug APK
.\gradlew.bat assembleDebug

# Build Release APK
.\gradlew.bat assembleRelease

# Build Google Play Store App Bundle (.aab)
.\gradlew.bat bundleRelease
```

### Output File Locations:
| Artifact | Path | Purpose |
| :--- | :--- | :--- |
| **Release APK** | `android/app/build/outputs/apk/release/app-release.apk` | Direct sideloading onto phones |
| **Debug APK** | `android/app/build/outputs/apk/debug/app-debug.apk` | Testing and development |
| **Play Store Bundle** | `android/app/build/outputs/bundle/release/app-release.aab` | Uploading to Google Play Console |

---

## 📲 3. Instant Mobile Testing with Zero Build Wait

To run SpendWise live on your phone right now without waiting for any APK build:
```bash
npx expo start --tunnel
```
1. Install **Expo Go** from Google Play Store on your phone.
2. Scan the QR code shown in your terminal with your phone camera.
3. The app opens immediately with full native animations, on-device phone storage, and live bank feed parsing!

---

## 📋 4. App Manifest & Privacy Specs
- **Package ID**: `com.spendwise.dailycoach`
- **Target Android SDK**: 35 (Android 15)
- **Min Android SDK**: 24 (Android 7.0+)
- **Login Requirement**: **NONE (100% Offline & On-Device)**
- **Permissions**: `RECEIVE_SMS`, `READ_SMS`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`
- **Native Receiver**: `com.spendwise.dailycoach.SmsBroadcastReceiver`
