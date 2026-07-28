# Umhlabatea — Mobile App

Expo (React Native) + **NativeWind** (Tailwind) client for the Umhlabatea AI
music platform. Runs **offline-first**: with no environment variables it uses the
in-app mock backed by `@umhlabatea/core`, so everything works on a fresh clone
with no keys, database, or network.

## Run

```bash
npm install                 # from this directory
npm run start               # Expo dev server (press w / i / a)
npm run web                 # web preview
npm run typecheck           # tsc --noEmit (strict)
npm run export:web          # static web bundle → dist/
```

## Go live

Set a single variable to point the app at the running API (`apps/api`):

```bash
EXPO_PUBLIC_API_URL=http://localhost:5000 npm run start
```

`src/services/client.ts` selects the mock or HTTP client from that variable —
nothing else in the app changes.

## Layout

```
app/                     expo-router routes (file-based)
  (tabs)/                Discover · Generate · Community · Library · Profile
  track/[id].tsx         track detail + SEO/AEO metadata (JSON-LD → <head> on web)
  player.tsx             full-screen player
  subscriptions.tsx      tiers + embedded AI agents
  compliance.tsx         SAMRO / CAPASSO / RISA rights hub
  auth.tsx               register / login
src/
  services/              ApiClient interface + mock & http implementations
  store/                 zustand: auth session
  player/                zustand + expo-av global audio player
  components/            NativeWind design system (ui, music, Screen, MiniPlayer)
  theme/                 brand tokens + formatters (re-exported from core)
```

Brand tokens (colours, tiers, revenue split) come from `@umhlabatea/core` so the
app, the API, and any web export share one source of truth.
