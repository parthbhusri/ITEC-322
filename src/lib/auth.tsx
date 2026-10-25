"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, AUTH_EXPIRED_EVENT, getToken, setToken, type ApiUser } from "./api";
import { syncFavoritesWithAccount } from "./favorites";

interface AuthState {
  user: ApiUser | null;
  /** True until we've checked whether a saved login is still valid. */
  loading: boolean;
  login: (email: string, password: string) => Promise<ApiUser>;
  logout: () => void;
  setUser: (user: ApiUser) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within an AuthProvider");
  return value;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On first load, restore the saved login if the token still works
  useEffect(() => {
    let cancelled = false;
    const check = getToken() ? api.me() : Promise.resolve(null);
    check
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Any request that gets "401 Unauthorized" logs the user out
  useEffect(() => {
    function handleExpired() {
      setUser(null);
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  // Saved items follow the account: load them on login, back to the
  // browser's own list on logout
  const userId = user?.id ?? null;
  useEffect(() => {
    if (loading) return;
    syncFavoritesWithAccount(userId !== null);
  }, [userId, loading]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    setToken(result.access_token);
    const me = await api.me();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
