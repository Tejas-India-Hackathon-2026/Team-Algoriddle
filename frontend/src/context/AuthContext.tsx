import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, registerUser, fetchCurrentUser, logoutUser as apiLogout } from '../services/api.ts';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferredDistrict?: string;
  role?: string;
  passportLevel?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { name: string; email: string; password: string; phone?: string; preferredDistrict?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AUTH_TOKEN_KEY = 'yatra_auth_token';
export const AUTH_USER_KEY = 'yatra_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Synchronously initialize from localStorage to prevent auth check flickering
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await fetchCurrentUser(storedToken);
        if (isMounted) {
          setUser(currentUser);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
          setIsLoading(false);
        }
      } catch (err) {
        // If session verification fails or server restarted, if we have local user fallback keep or clear
        if (isMounted) {
          const savedUser = localStorage.getItem(AUTH_USER_KEY);
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch {
              setUser(null);
              setToken(null);
              localStorage.removeItem(AUTH_TOKEN_KEY);
              localStorage.removeItem(AUTH_USER_KEY);
            }
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
          }
          setIsLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginUser(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem(AUTH_TOKEN_KEY, res.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user));
  };

  const register = async (userData: { name: string; email: string; password: string; phone?: string; preferredDistrict?: string }) => {
    const res = await registerUser(userData);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem(AUTH_TOKEN_KEY, res.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user));
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem(AUTH_TOKEN_KEY);
    await apiLogout(currentToken || undefined);
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
