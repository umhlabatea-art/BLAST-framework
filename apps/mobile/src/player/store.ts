/**
 * Global audio-player store (zustand + expo-av). One Sound instance lives here
 * so the mini-player and the full-screen player stay in sync across the app.
 */
import { create } from "zustand";
import { Audio, AVPlaybackStatus } from "expo-av";
import type { Track } from "../services/types";

interface PlayerState {
  current: Track | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  sound: Audio.Sound | null;
  play: (track: Track) => Promise<void>;
  toggle: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  stop: () => Promise<void>;
}

export const usePlayer = create<PlayerState>((set, get) => ({
  current: null,
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  sound: null,

  async play(track) {
    const { sound: existing } = get();
    if (existing) {
      await existing.unloadAsync().catch(() => {});
    }
    set({ current: track, isPlaying: false, positionMs: 0, durationMs: (track.durationSec || 0) * 1000 });

    if (!track.audioUrl) {
      // No audio source (rare) — reflect "playing" state for the UI anyway.
      set({ isPlaying: true });
      return;
    }
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.audioUrl },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          set({
            isPlaying: status.isPlaying,
            positionMs: status.positionMillis ?? 0,
            durationMs: status.durationMillis ?? get().durationMs,
          });
        }
      );
      set({ sound, isPlaying: true });
    } catch {
      // Audio failed to load (e.g. web autoplay policy) — keep UI responsive.
      set({ isPlaying: true });
    }
  },

  async toggle() {
    const { sound, isPlaying } = get();
    if (!sound) {
      set({ isPlaying: !isPlaying });
      return;
    }
    if (isPlaying) await sound.pauseAsync();
    else await sound.playAsync();
  },

  async seek(ms) {
    const { sound } = get();
    if (sound) await sound.setPositionAsync(ms);
    set({ positionMs: ms });
  },

  async stop() {
    const { sound } = get();
    if (sound) await sound.unloadAsync().catch(() => {});
    set({ current: null, isPlaying: false, sound: null, positionMs: 0, durationMs: 0 });
  },
}));
