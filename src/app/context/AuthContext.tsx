'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthContextType {
  login: string;
  setLogin: (login: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [login, setLogin] = useState('');
  const auth = useAuth();

  // Загружаем данные когда пользователь аутентифицирован
  useEffect(() => {
    if (auth.user && auth.isAuthenticated) {
      setLogin(auth.user.login);
    }
  }, [auth.user, auth.isAuthenticated]);

  const contextValue = useMemo(() => ({
    login,
    setLogin,
  }), [login]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext должен использоваться внутри AuthProvider');
  }
  return context;
}

export default AuthContext; 