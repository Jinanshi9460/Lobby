import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lobby_token');
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        localStorage.removeItem('lobby_token');
        delete api.defaults.headers.common.Authorization;
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const login = ({ token, user: userData }) => {
    if (token) {
      localStorage.setItem('lobby_token', token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore API logout failures and clear local session anyway.
    }
    localStorage.removeItem('lobby_token');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);
