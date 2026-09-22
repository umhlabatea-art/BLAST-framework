# Umhlabatea Studio Hub (`apps/studio`)

A self-contained, dependency-free **web** surface that merges the marketing hub,
an **in-browser music production studio**, the retro **Umhlabatea Studios**
cassette player, and a **voice & meeting-minutes recorder** — all wired together
by a single local store so notes and sessions connect across every zone.

It is intentionally a single `index.html` with no build step: it runs by opening
the file in any modern browser (including a phone), and it is published as a
Claude Artifact for on-device preview. This complements the React Native app in
`apps/mobile`; the browser-native audio APIs (Web Audio, Web Speech,
MediaRecorder) it relies on are not available in React Native without native
builds, which is why the studio and recorder live here.

## Zones

| Zone       | What it does                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------- |
| **Home**   | Landing / value props, live purchase ticker, featured artists.                               |
| **Studio** | Real **Web Audio** engine: 16-step sequencer, 7 synthesized voices (kick, snare, hi-hat, clap, signature **log drum**, bass, shaker), a melodic **piano-roll** (C-minor pentatonic poly synth), per-channel **3-band EQ** / pan / mute / solo, a master **effects chain** (reverb · delay · compressor), and master gain. Amapiano preset at 115 BPM. **Bounce to .wav** (offline render → 16-bit PCM download) or save the beat as a track. |
| **Player** | Retro **RBX-9000** cassette player for the B.A.Hz Retroblend show (animated reels + queue).  |
| **Record** | Live dictation (Web Speech API) + audio capture (MediaRecorder) + **AI meeting minutes** (via the user's OpenRouter key, with an offline heuristic fallback). Turn action items into **agent tasks** (routed to the right agent), or attach transcript/minutes to any track, registration, community post, or agent task. |
| **Agents** | The six AI agents (CRM, SEO/AEO, Marketing, Mixing, Visual, Legal). SEO, Mixing and Legal are interactive, drawing on the production/legal reference guides. |
| **Rights** | SAMRO / CAPASSO / RISA registration pipeline (`draft → prepared → submitted → registered`), with ISRC generation for RISA. |
| **Plans**  | Starter / Pro Artist / Label pricing.                                                         |

## The connective tissue

Everything persists in `localStorage` under `umhlabatea.hub.v2`
(`tracks`, `registrations`, `posts`, `agentTasks`, `notes`, `settings`). The
recorder's **"Attach to…"** flow writes a note reference onto any item in any
collection, and **"Create agent tasks"** turns meeting-minutes action items into
`AgentTask`s routed to the right agent (via `routeAgent` in `@umhlabatea/core`).
That is what "connected to all other options" means: a voice memo can live on a
track, a rights registration, a community post, or an agent task.

### Mobile-readable tasks

Agent tasks use the shared `AgentTask` shape from `@umhlabatea/core`. When an
**API URL** is set in Settings, the hub `POST`s created tasks to
`/api/agents/tasks` on the backend (`apps/api`); the mobile app's **Agent Tasks**
screen (`apps/mobile/app/tasks.tsx`) reads the same endpoint, so a task dictated
in the Studio Hub shows up in the phone app. Offline, tasks stay in the hub's
local store.

## AI provider

Live AI (meeting minutes, SEO) uses **OpenRouter** chat completions with a key
the user pastes into Settings (stored only in the browser, sent only to
OpenRouter). Without a key, deterministic on-device stubs are used so every
feature still works offline — the same offline-first, env-swappable philosophy
as the rest of the monorepo.

## Design

A premium editorial system: **Fraunces** (serif display), **DM Sans** (body),
and **IBM Plex Mono** (labels/eyebrows), on a **bone / deep-ink / Safety-Gold /
steel** palette with a subtle film-grain overlay — adapted from the Umhlabatea
design schematic. Fonts progressive-enhance and fall back to system stacks when
web fonts are blocked (e.g. under an Artifact CSP). A deep-ink retro-console
treatment is reserved for the Studio and player zones.

## Run

Open `apps/studio/index.html` in a browser, or serve the folder statically
(`npx serve apps/studio`). No install, no bundler. Microphone features require
`https://` or `localhost` and browser mic permission; live dictation needs a
Web Speech-capable browser (Chrome/Edge/Safari).
