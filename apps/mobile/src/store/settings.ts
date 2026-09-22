/**
 * Settings store (zustand + AsyncStorage). Holds the user's OpenRouter API key
 * and model so the AI-powered tasks can run live. The key is persisted locally
 * on the device only — it is never sent anywhere except OpenRouter.
 */
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "umhlabatea.settings.v1";
const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";

interface SettingsState {
  openRouterKey: string;
  model: string;
  loaded: boolean;
  setKey: (k: string) => void;
  setModel: (m: string) => void;
  save: () => Promise<void>;
  clear: () => Promise<void>;
  load: () => Promise<void>;
  hasAI: () => boolean;
}

export const useSettings = create<SettingsState>((set, get) => ({
  openRouterKey: "",
  model: DEFAULT_MODEL,
  loaded: false,

  setKey: (k) => set({ openRouterKey: k }),
  setModel: (m) => set({ model: m }),

  async save() {
    const { openRouterKey, model } = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ openRouterKey, model }));
  },
  async clear() {
    set({ openRouterKey: "", model: DEFAULT_MODEL });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
  async load() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw) as { openRouterKey?: string; model?: string };
        set({ openRouterKey: v.openRouterKey || "", model: v.model || DEFAULT_MODEL });
      }
    } catch {
      // ignore corrupt/absent storage — fall back to defaults
    }
    set({ loaded: true });
  },

  hasAI: () => get().openRouterKey.trim().length > 0,
}));
