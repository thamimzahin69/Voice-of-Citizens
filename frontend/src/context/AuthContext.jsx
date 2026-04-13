/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  async function signIn({ email, password }) {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      setUser(data.user);
      setToken(data.token);
      return data;
    } finally {
      setLoading(false);
    }
  }

  async function signUp(signupData) {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/register', signupData);
      setUser(data.user);
      setToken(data.token);
      return data;
    } finally {
      setLoading(false);
    }
  }

  async function completeProfile(formData) {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/complete-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    setUser(null);
    setToken(null);
  }

  const value = {
    user,
    loading,
    token,
    isAdmin,
    signIn,
    signUp,
    completeProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
