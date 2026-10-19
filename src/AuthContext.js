import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, saveSession, clearSession } from './api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);

    if (localStorage.getItem('refreshToken')) {
      // Confirm the saved session is still valid
      apiFetch('/api/auth/me')
        .then((d) => { setUser(d.user); saveSession({ user: d.user }); })
        .catch(() => {});
    } else {
      clearSession();
      setUser(null);
    }
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const authenticate = async (path, email, password) => {
    const data = await apiFetch(path, { method: 'POST', body: { email, password }, auth: false });
    saveSession(data);
    setUser(data.user);
  };

  const value = {
    user,
    login: (email, password) => authenticate('/api/auth/login', email, password),
    register: (email, password) => authenticate('/api/auth/register', email, password),
    logout: () => { clearSession(); setUser(null); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}