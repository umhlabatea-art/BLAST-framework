import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { client } from "../services/client";
import { mock } from "../services/mock";
import type { User } from "../types";

interface AuthCtx {
  user: User | null;
  token: string | null;
  offline: boolean;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<void>;
  logout(): void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("umh_token"));
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    client
      .get<{ user: User }>("/api/auth/me", token)
      .then((d) => { setUser(d.user); setOffline(false); })
      .catch(() => {
        // API unreachable — load demo user in offline mode.
        setOffline(true);
        const stored = localStorage.getItem("umh_user");
        if (stored) setUser(JSON.parse(stored));
        else {
          mock.me().then((d) => { setUser(d.user); localStorage.setItem("umh_user", JSON.stringify(d.user)); });
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function login(email: string, password: string) {
    try {
      const d = await client.post<{ token: string; user: User }>("/api/auth/login", { email, password });
      setToken(d.token);
      setUser(d.user);
      setOffline(false);
      localStorage.setItem("umh_token", d.token);
      localStorage.setItem("umh_user", JSON.stringify(d.user));
    } catch {
      // Offline: accept any credentials.
      const d = await mock.login(email, password);
      setToken(d.token);
      setUser(d.user);
      setOffline(true);
      localStorage.setItem("umh_token", d.token);
      localStorage.setItem("umh_user", JSON.stringify(d.user));
    }
  }

  async function register(email: string, password: string) {
    try {
      const d = await client.post<{ token: string; user: User }>("/api/auth/register", { email, password });
      setToken(d.token);
      setUser(d.user);
      setOffline(false);
      localStorage.setItem("umh_token", d.token);
      localStorage.setItem("umh_user", JSON.stringify(d.user));
    } catch {
      const d = await mock.register(email, password);
      setToken(d.token);
      setUser(d.user);
      setOffline(true);
      localStorage.setItem("umh_token", d.token);
      localStorage.setItem("umh_user", JSON.stringify(d.user));
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    setOffline(false);
    localStorage.removeItem("umh_token");
    localStorage.removeItem("umh_user");
  }

  return (
    <Ctx.Provider value={{ user, token, offline, loading, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
