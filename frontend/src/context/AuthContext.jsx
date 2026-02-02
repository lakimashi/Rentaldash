import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'rental_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetch('/api/auth/me', { credentials: 'include', headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(setUser)
        .catch(() => localStorage.removeItem(TOKEN_KEY))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    return fetch('/api/auth/me', { credentials: 'include', headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => {
        setUser(u);
        return u;
      });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  };

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
