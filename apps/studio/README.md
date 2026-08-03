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
| **Studio** | Real **Web Audio** engine: 16-step sequencer, 7 synthesized voices (kick, snare, hi-hat, clap, signature **log drum**, bass, shaker), per-channel **3-band EQ**, pan, mute/solo, master. Amapiano preset at 115 BPM. Save a beat as a track. |
| **Player** | Retro **RBX-9000** cassette player for the B.A.Hz Retroblend show (animated reels + queue).  |
| **Record** | Live dictation (Web Speech API) + audio capture (MediaRecorder) + **AI meeting minutes** (via the user's OpenRouter key, with an offline heuristic fallback). Attach transcript/minutes to any track, registration, community post, or agent task. |
| **Agents** | The six AI agents (CRM, SEO/AEO, Marketing, Mixing, Visual, Legal). SEO, Mixing and Legal are interactive, drawing on the production/legal reference guides. |
| **Rights** | SAMRO / CAPASSO / RISA registration pipeline (`draft → prepared → submitted → registered`), with ISRC generation for RISA. |
| **Plans**  | Starter / Pro Artist / Label pricing.                                                         |

## The connective tissue

Everything persists in `localStorage` under `umhlabatea.hub.v1`
(`tracks`, `registrations`, `posts`, `agentTasks`, `notes`, `settings`). The
recorder's **"Attach to…"** flow writes a note reference onto any item in any
collection, which is what "connected to all other options" means in practice: a
voice memo can live on a track, a rights registration, a community post, or an
agent task.

## AI provider

Live AI (meeting minutes, SEO) uses **OpenRouter** chat completions with a key
the user pastes into Settings (stored only in the browser, sent only to
OpenRouter). Without a key, deterministic on-device stubs are used so every
feature still works offline — the same offline-first, env-swappable philosophy
as the rest of the monorepo.

## Design

IBM Plex Mono (progressive-enhanced; falls back to the system monospace stack
when web fonts are blocked, e.g. under an Artifact CSP) on the shared
paper/ink/accent palette, with a retro-console treatment reserved for the Studio
and player zones.

## Run

Open `apps/studio/index.html` in a browser, or serve the folder statically
(`npx serve apps/studio`). No install, no bundler. Microphone features require
`https://` or `localhost` and browser mic permission; live dictation needs a
Web Speech-capable browser (Chrome/Edge/Safari).
