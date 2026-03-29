# KisanQuest 🌾

KisanQuest is an interactive, educational mobile farming adventure designed to empower farmers with essential financial and agricultural literacy. Players learn through immersive scenarios, managing a virtual farm, dealing with weather events, understanding market dynamics, and discovering crucial government schemes, all while exploring concepts like crop insurance, loans, and budget planning.

The app supports multi-language localization (English, Hindi, and Marathi) and features an integrated text-to-speech (TTS) engine to make the content accessible to a wider audience, including those with lower literacy levels.

## 🛠️ Tech Stack & Dependencies

KisanQuest is built on a modern React Native stack using Expo:

- **Framework:** React Native (`0.83.2`)
- **Toolchain:** Expo (`~55.0.8`)
- **Navigation:** React Navigation (`^7.1.34` native & native-stack)
- **Localization:** `i18next` (`^25.10.5`) & `react-i18next` (`^16.6.2`)
- **Storage:** React Native AsyncStorage (`2.2.0`), Expo SQLite (`~55.0.11`)
- **Audio & Accessibility:** Expo Speech (`~55.0.9`), Expo AV (`^16.0.8`)
- **UI Components:** Expo Linear Gradient (`~55.0.9`), Lottie React Native (`~7.3.4`), React Native Chart Kit (`^6.12.0`)
- **Development & Build:** EAS Build via `expo-dev-client` (`~55.0.19`)

## 🚀 Download & Install

You can easily install the KisanQuest prototype directly on your Android device without needing to set up a development environment.

### Steps to Install:
1. Open one of the following links on your Android mobile device:
   - **[Official GitHub Release (v1.0.0)](https://github.com/rakshith1928/kisanQuest/releases/tag/v1.0.0)** *(Recommended)*
   - **[Expo Direct Download](https://expo.dev/accounts/rachana_2005/projects/kisanquest/builds/1817b746-a39b-4181-8af7-58dd21e63c0a)**
2. Click the **"Install"** or **"Download"** button on the Expo page to download the `.apk` file.
3. Once downloaded, tap the file to install it. *(Note: You may need to enable "Install from Unknown Sources" in your device settings).*
4. Launch the app and start your farming adventure!

## 🔑 Testing Credentials & Flow

KisanQuest is designed as an accessible, localized mobile experience and **does not require a traditional username/password login**. 

Instead, it uses local storage (`AsyncStorage`) to persist the player's farm progression. 

### To test the onboarding and app flow:
1. Launch the app. You will be greeted by the language selection screen.
2. Select your preferred language (English, Hindi, or Marathi).
3. When prompted, enter any arbitrary name (e.g., "Ramu") to begin your farming adventure.
4. **No passwords or external accounts are required.**

If you need to reset the app data and start testing from scratch, you can clear the app's storage via the device's App Info settings or simply uninstall and reinstall the Expo Go development instance.
