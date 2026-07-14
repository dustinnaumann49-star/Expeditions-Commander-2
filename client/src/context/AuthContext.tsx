import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from '../api/client';

interface AuthContextValue {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());

  const login = useCallback(async (u: string, p: string) => {
    const res = await api.login(u, p);
    setToken(res.token);
    setUsername(res.username);
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(async (u: string, p: string) => {
    const res = await api.register(u, p);
    setToken(res.token);
    setUsername(res.username);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUsername(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden.');
  return ctx;
}
