import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAuthToken } from '../lib/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'food_van_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    setAuthToken(token);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then((response) => setUser(response.data.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken('');
        setUser(null);
        setAuthToken('');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
    setAuthToken(response.data.token);
    return response.data.user;
  };

  const signup = async (payload) => {
    const response = await api.post('/auth/signup', payload);
    localStorage.setItem(TOKEN_KEY, response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
    setAuthToken(response.data.token);
    return response.data.user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setUser(null);
    setAuthToken('');
  };

  const value = useMemo(() => ({ token, user, loading, isAuthenticated: Boolean(user), login, signup, logout, setUser }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
