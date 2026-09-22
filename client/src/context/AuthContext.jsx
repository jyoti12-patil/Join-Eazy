import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('joineazy_token'));

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('joineazy_user');
        const storedToken = localStorage.getItem('joineazy_token');
        if (storedUser && storedToken) {
          const parsed = JSON.parse(storedUser);
          try {
            const refreshed = await api.getMe(parsed);
            if (refreshed) {
              setUser(refreshed);
              localStorage.setItem('joineazy_user', JSON.stringify(refreshed));
            } else {
              logout();
            }
          } catch (err) {
            if (err.response?.status === 401 || err.message?.includes('401')) {
              logout();
            } else {
              setUser(parsed);
            }
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Error initializing auth:', e);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('joineazy_token', res.token);
    localStorage.setItem('joineazy_user', JSON.stringify(res.user));
    return res.user;
  };

  const register = async (payload) => {
    const res = await api.register(payload);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('joineazy_token', res.token);
    localStorage.setItem('joineazy_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('joineazy_token');
    localStorage.removeItem('joineazy_user');
  };

  // Quick switch between demo personas for easy testing
  const switchDemoUser = async (email) => {
    return await login(email, 'password123');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    switchDemoUser,
    isStudent: user?.role === 'STUDENT',
    isAdmin: user?.role === 'ADMIN',
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
