'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppAction } from '../types';
import { appReducer, initialState } from './appReducer';
import { useAuth } from '../hooks/useAuth';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // API функции
  loadBankAccounts: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadPlans: () => Promise<void>;
  refreshAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user: authUser, loading: authLoading } = useAuth();

  // Синхронизация с useAuth
  useEffect(() => {
    if (authUser && !state.user.data) {
      dispatch({ type: 'SET_USER', payload: authUser });
    } else if (!authUser && state.user.data) {
      dispatch({ type: 'LOGOUT_USER' });
    }
  }, [authUser, state.user.data]);

  // Загрузка банковских счетов
  const loadBankAccounts = async () => {
    if (!state.user.isAuthenticated || !state.user.data) return;

    dispatch({ type: 'SET_BANK_ACCOUNTS_LOADING', payload: true });
    try {
      const response = await fetch(`/api/getBankAccountsRedis?login=${state.user.data.login}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const accounts = Array.isArray(data.accounts) ? data.accounts : [];
        dispatch({ type: 'SET_BANK_ACCOUNTS_SUCCESS', payload: accounts });
      } else {
        dispatch({ type: 'SET_BANK_ACCOUNTS_ERROR', payload: 'Ошибка загрузки счетов' });
      }
    } catch (error) {
      console.error('Load bank accounts error:', error);
      dispatch({ type: 'SET_BANK_ACCOUNTS_ERROR', payload: 'Ошибка сети при загрузке счетов' });
    }
  };

  // Загрузка транзакций
  const loadTransactions = async () => {
    if (!state.user.isAuthenticated || !state.user.data) return;

    dispatch({ type: 'SET_TRANSACTIONS_LOADING', payload: true });
    try {
      const response = await fetch(`/api/getTransRedis?login=${state.user.data.login}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const transactions = Array.isArray(data.transactions) ? data.transactions : [];
        dispatch({ type: 'SET_TRANSACTIONS_SUCCESS', payload: transactions });
      } else {
        dispatch({ type: 'SET_TRANSACTIONS_ERROR', payload: 'Ошибка загрузки транзакций' });
      }
    } catch (error) {
      console.error('Load transactions error:', error);
      dispatch({ type: 'SET_TRANSACTIONS_ERROR', payload: 'Ошибка сети при загрузке транзакций' });
    }
  };

  // Загрузка планов
  const loadPlans = async () => {
    if (!state.user.isAuthenticated || !state.user.data) return;

    dispatch({ type: 'SET_PLANS_LOADING', payload: true });
    try {
      const response = await fetch(`/api/getPlans?login=${state.user.data.login}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const plans = Array.isArray(data.plans) ? data.plans : [];
        dispatch({ type: 'SET_PLANS_SUCCESS', payload: plans });
      } else {
        dispatch({ type: 'SET_PLANS_ERROR', payload: 'Ошибка загрузки планов' });
      }
    } catch (error) {
      console.error('Load plans error:', error);
      dispatch({ type: 'SET_PLANS_ERROR', payload: 'Ошибка сети при загрузке планов' });
    }
  };

  // Загрузка всех данных
  const refreshAllData = async () => {
    if (!state.user.isAuthenticated) return;
    
    await Promise.all([
      loadBankAccounts(),
      loadTransactions(),
      loadPlans()
    ]);
  };

  // Автоматическая загрузка данных при авторизации
  useEffect(() => {
    if (state.user.isAuthenticated && state.user.data && !authLoading) {
      refreshAllData();
    }
  }, [state.user.isAuthenticated, authLoading]);

  const contextValue: AppContextType = {
    state,
    dispatch,
    loadBankAccounts,
    loadTransactions,
    loadPlans,
    refreshAllData,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext должен использоваться внутри AppProvider');
  }
  return context;
} 