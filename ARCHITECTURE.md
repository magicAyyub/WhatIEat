# WhatIEat — Architecture

An app that scans a fridge, detects ingredients, and suggests recipes based on the user's dietary profile and calorie goals.

---

## Stack

| Layer     | Tech                                            |
| --------- | ----------------------------------------------- |
| Framework | Expo (SDK 54) + Expo Router v6                  |
| UI        | HeroUI Native 1.0.0 + Uniwind (Tailwind for RN) |
| State     | Zustand                                         |
| Backend   | FastAPI (external)                              |
| Language  | TypeScript (strict)                             |

---

## Project structure

```
src/
├── app/                        # Expo Router — file-based routing
│   ├── _layout.tsx             # Root layout (fonts, providers)
│   ├── index.tsx               # Redirects → /(tabs)/scan
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab bar (Scan / Recipes / Profile)
│   │   ├── scan.tsx            # Fridge camera screen
│   │   ├── recipes.tsx         # Recipe suggestions screen
│   │   └── profile.tsx         # User prefs + hidden dev link
│   └── _showcase/              # HeroUI component explorer (dev only)
│
├── components/
│   ├── ui/                     # Shared HeroUI wrappers (AppText, SafeAreaView, selects…)
│   ├── scan/
│   │   └── CameraCapture.tsx   # Camera capture component (placeholder, needs expo-camera)
│   └── recipe/
│       └── RecipeCard.tsx      # Recipe card using the Recipe type
│
├── services/
│   ├── api.ts                  # Base fetch client (api.get / api.post) → FastAPI
│   ├── vision.ts               # POST /vision/scan — uploads fridge photo, returns ingredients
│   └── recipes.ts              # POST /recipes/recommend, GET /recipes/:id
│
├── hooks/
│   └── useFridge.ts            # Thin wrapper over useFridgeStore — use this in screens
│
├── store/
│   └── index.ts                # Zustand stores (useFridgeStore, useProfileStore)
│
├── types/
│   └── ingredient.ts           # Ingredient, Recipe, UserProfile, ScanResult
│
├── contexts/
│   └── app-theme-context.tsx   # Light/dark theme toggle (useAppTheme)
│
├── assets/                     # Fonts, images (@/assets/…)
└── helpers/                    # Template utilities (accessibility hook, simulate-press)
```

---

## Key conventions

**Aliases** — `@/` maps to `src/`. Use it everywhere, no relative hell.

**Theme** — Two variants: `light` / `dark`. Toggle with `useAppTheme().toggleTheme()`. CSS vars live in `themes/alpha.css`.

**State**

- Detected fridge ingredients → `useFridge()` (backed by `useFridgeStore`)
- User dietary profile → `useProfileStore()` directly
- Both are global — no need to pass props across tabs

**API base URL** — hardcoded in `src/services/api.ts`. Change it once when you deploy the backend.

---

## Typical data flow

```
scan.tsx
  └─ CameraCapture → takes photo (imageUri)
  └─ uploadFridgeImage(imageUri)   [services/vision.ts]
  └─ setScannedIngredients(result) [useFridge]
       └─ stored in Zustand

recipes.tsx
  └─ useFridge() → ingredients
  └─ getRecipes({ ingredientIds, profile }) [services/recipes.ts]
  └─ renders <RecipeCard />
```

---

## Dev shortcuts

- **UI Showcase** (HeroUI components) — tap the animated **"UI Showcase"** button at the bottom of the Profile tab. Only visible in dev builds.
- **Clear cache & restart** — `npx expo start --clear`
