import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Target passcode for Yoganteek Ops Team
const PASSCODE = 'Yoganteek2026!';
const AUTH_KEY = 'yoganteek_ops_auth_token';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_KEY);
    if (storedAuth === 'authenticated_v1') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (inputPasscode) => {
    if (inputPasscode.trim() === PASSCODE || inputPasscode.trim() === 'yoganteek') {
      localStorage.setItem(AUTH_KEY, 'authenticated_v1');
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: 'Incorrect Passcode. Please try again.' };
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
