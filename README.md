# WhatIEat

> Scan your fridge, detect ingredients, and get personalized recipe suggestions based on your dietary profile and calorie goals.

The vision backend repo is [here](https://github.com/magicAyyub/fridge_detector).

## What it does

1. **Scan** | take a photo of your fridge; the app sends it to a FastAPI vision API and detects ingredients automatically.
2. **Recipes** | get recipe suggestions matched to your detected ingredients and dietary preferences.
3. **Profile** | set dietary restrictions, calorie targets, and preferences that influence every recommendation.

---

## Stack

| Layer     | Tech                                            |
| --------- | ----------------------------------------------- |
| Framework | Expo SDK 54 + Expo Router v6                    |
| UI        | HeroUI Native 1.0.0 + Uniwind (Tailwind for RN) |
| State     | Zustand                                         |
| Backend   | FastAPI (separate repo)                         |
| Language  | TypeScript (strict)                             |

---

## Getting started

**Prerequisites:** Node.js 18+, Expo CLI, iOS Simulator or Android Emulator (or a physical device with Expo Go).

```bash
# Install dependencies
npm install

# Start the dev server (clears cache)
npm start
```

Then press `i` for iOS, `a` for Android, or scan the QR code with Expo Go.

---

## Scripts

| Command           | Description                           |
| ----------------- | ------------------------------------- |
| `npm start`       | Start Expo dev server (cache cleared) |
| `npm run ios`     | Open in iOS Simulator                 |
| `npm run android` | Open in Android Emulator              |
| `npm run web`     | Open in browser (limited RN support)  |
| `npm run lint`    | Run ESLint                            |

---

## Project structure

```
src/
├── app/            # Expo Router file-based routes
│   ├── (tabs)/     # Main tabs: Scan, Recipes, Profile
│   └── _showcase/  # HeroUI component explorer (dev only)
├── components/     # Shared UI components
├── services/       # API layer (vision, recipes, base client)
├── hooks/          # Custom hooks (useFridge, …)
├── store/          # Zustand global state
├── types/          # Shared TypeScript types
└── contexts/       # Theme context
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full breakdown: conventions, data flow, API wiring, and dev shortcuts.

---

## Backend

The FastAPI backend lives in a separate repository. Update the base URL in `src/config/runtime-config.json` once you deploy it.

In development :

make a share c
check your ip :

```bash
ipconfig getifaddr en0 || ipconfig getifaddr en1 || ifconfig | grep 'inet '
```

then use it. Exemple :

```json
{
  "apiBaseUrl": "http://172.20.10.10:8000",
  ...
}
```

example in production:

```json
{
  "apiBaseUrl": "https://your-deployed-backend.com",
  ...
}
```

---

## Dev shortcut

The **HeroUI component showcase** is accessible from the Profile tab — tap the animated **"UI Showcase"** button at the bottom. Only visible in development builds.
