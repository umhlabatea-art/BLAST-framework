/**
 * Auth store (zustand). Holds the session token + user. `getToken()` is a plain
 * getter so the HTTP client can read the token without subscribing to the store.
 */
import { create } from "zustand";
import { api } from "../services/client";
import type { AuthUser } from "../services/types";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

let currentToken: string | null = null;
export function getToken() {
  return currentToken;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  async register(email, password) {
    set({ loading: true, error: null });
    try {
      const { token, user } = await api.register(email, password);
      currentToken = token;
      set({ user, token, loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
      throw err;
    }
  },
  async login(email, password) {
    set({ loading: true, error: null });
    try {
      const { token, user } = await api.login(email, password);
      currentToken = token;
      set({ user, token, loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
      throw err;
    }
  },
  logout() {
    currentToken = null;
    set({ user: null, token: null });
  },
}));
