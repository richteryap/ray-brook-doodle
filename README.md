# Ray Brook 🎬📱

A personal media streaming tracker and logging ecosystem. Ray Brook lets you capture anime and show watch events directly from your browser and sync them in real time across your mobile dashboard and web app.

---

## 📦 Releases & Downloads

Grab the latest compiled builds directly from the **[Releases](../../releases)** tab:

- **Android App:** Download `raybrook.apk` under the latest `app-v*` release. The Android APK is strictly compiled for **64-bit ARM architecture (`arm64-v8a`)**
- **Web Dashboard:** Access the live application at [raybrook.vercel.app](https://raybrook.vercel.app) or view release logs under the latest `web-v*` release.
- **Browser Extension:** Download `ray-brook-extension.zip` (for Chromium via "Load unpacked") or `ray-brook-extension.xpi` (for Zen Browser / Firefox via "Install Add-on From File...") under the latest `ext-v*` release.

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

### Web Dashboard

```bash
cd web-dashboard
npm install
npm run dev
```

### Browser Extension

#### Chrome & Chromium-based (Brave, Edge, Opera)
1. Open your browser and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked** and select the `browser-extension` folder (or extracted `.zip` release).
4. Click the extension icon, enter your secret Supabase profile API key, and hit **Save Key**.

#### Zen Browser & Firefox-based (Gecko)
1. Open Zen Browser and press `Ctrl + Shift + A` (or navigate to `about:addons`).
2. Click the ⚙️ gear icon in the top-right corner.
3. Select **Install Add-on From File...** and choose `ray-brook-extension.xpi` (or load temporarily from `about:debugging` → This Firefox → Load Temporary Add-on).
4. Click the extension icon, enter your secret Supabase profile API key, and hit **Save Key**.

---

## 🔄 Automated CI/CD Workflows

Builds and distribution packages are managed automatically via GitHub Actions:

- **Pushing tag `app-v*`** triggers an Expo EAS cloud build, downloads the compiled APK, and creates a GitHub Release.
- **Pushing tag `ext-v*`** bundles the extension into `.zip` and `.xpi` packages and attaches them to a GitHub Release.
- **Pushing tag `web-v*`** publishes a GitHub Release tagged with change notes and direct access to the live Vercel web deployment.

## ©️ License

Copyright © 2026 Richter Anthony Yap. All Rights Reserved.
