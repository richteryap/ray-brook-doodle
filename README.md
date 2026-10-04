# Ray Brook 🎬📱

A personal media streaming tracker and logging ecosystem. Ray Brook lets you capture anime and show watch events directly from your browser and sync them in real time across your mobile dashboard and web app.

---

## 📦 Releases & Downloads

Grab the latest compiled builds directly from the **[Releases](../../releases)** tab:

- **Android App:** Download `raybrook.apk` under the latest `app-v*` release. The Android APK is strictly compiled for **64-bit ARM architecture (`arm64-v8a`)**
- **Web Dashboard:** Access the live application at [raybrook.vercel.app](https://raybrook.vercel.app) or view release logs under the latest `web-v*` release.
- **Chrome Extension:** Download `ray-brook-extension.zip` under the latest `ext-v*` release.

---

## 🏗 Repository Structure

```text
ray-brook/
├── .github/workflows/       # CI/CD pipelines (EAS build & GitHub Release packaging)
├── browser-extension/       # Manifest V3 Chrome extension for browser-based logging
├── main-app/                # React Native (Expo) cross-platform mobile application
├── web-dashboard/           # Vite + React web application for watchlist browsing
├── bookmarklet.txt          # Quick single-click browser bookmarklet logger
└── README.md                # Project documentation and setup guide
```

---

## 🚀 Components

### 1. Mobile Dashboard (`/main-app`)

- Built with **React Native**, **Expo Router**, and **NativeWind (Tailwind CSS)**.
- Real-time synchronization and storage powered by **Supabase**.
- Tracks active watching status, episode counts, and chronological viewing history.
- Features title search filtering and bulk-drop management for active series.

### 2. Web Dashboard (`/web-dashboard`)

- Built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**.
- Public watchlist viewing and bookmarking by 8-digit profile UID (`/u/:uid`).
- Real-time tracking and series status indicators with custom sorting and seasonal badges.
- User management center

### 3. Browser Extension (`/browser-extension`)

- **Manifest V3** Chrome extension.
- Automatically extracts show titles and episode numbers from supported streaming pages.
- Integrates with AniList GraphQL to resolve metadata and total episode counts.
- Stores user API keys securely in `chrome.storage.local`.

---

## 🛠 Local Development Setup

### Mobile App

```bash
cd main-app
npm install
npx expo start
```

### Mobile App

```bash
cd web-dashboard
npm install
npm run dev
```

### Chrome Extension

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the `browser-extension` folder.
4. Click the extension icon, enter your secret Supabase profile API key, and hit **Save Key**.

---

## 🔄 Automated CI/CD Workflows

Builds and distribution packages are managed automatically via GitHub Actions:

- **Pushing tag `app-v*`** triggers an Expo EAS cloud build, downloads the compiled APK, and creates a GitHub Release.
- **Pushing tag `ext-v*`** bundles the extension into a `.zip` file and attaches it to a GitHub Release.
- **Pushing tag `web-v*`** publishes a GitHub Release tagged with change notes and direct access to the live Vercel web deployment.

## ©️ License

Copyright © 2026 Richter Anthony Yap. All Rights Reserved.
