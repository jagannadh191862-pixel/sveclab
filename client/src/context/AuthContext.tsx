import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('svec_auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('svec_auth_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('svec_auth_token');
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getProfile();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('svec_auth_user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('svec_auth_token', newToken);
    localStorage.setItem('svec_auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('svec_auth_token');
    localStorage.removeItem('svec_auth_user');
  };

  const isAuthenticated = Boolean(token && user);
  const isAdmin = Boolean(user && user.role === 'administrator');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
