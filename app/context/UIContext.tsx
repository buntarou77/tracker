'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface UIContextType {
  isLoading: boolean;
  error: string;
  loadingSending: boolean;
  planIsSending: boolean;
  isBankAccountMissing: boolean;
  isAccountsVisible: boolean;
  addBankAccountForm: boolean;

  setIsLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setLoadingSending: (loading: boolean) => void;
  setPlanIsSending: (sending: boolean) => void;
  setIsBankAccountMissing: (isBankAccountMissing: boolean)=> void;
  setIsAccountsVisible: (isAccountsVisible: boolean)=> void;
  setAddBankAccountForm: (addBankAccountForm: boolean)=> void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingSending, setLoadingSending] = useState(false);
  const [isBankAccountMissing, setIsBankAccountMissing] = useState(false);
  const [planIsSending, setPlanIsSending] = useState(false);
  const [isAccountsVisible, setIsAccountsVisible] = useState(false);
  const [addBankAccountForm, setAddBankAccountForm] = useState(false);

  const contextValue = useMemo(() => ({
    isLoading,
    error,
    loadingSending,
    planIsSending,
    isBankAccountMissing,
    addBankAccountForm,
    isAccountsVisible,

    setIsLoading,
    setError,
    setIsAccountsVisible,
    setAddBankAccountForm,
    setLoadingSending,
    setIsBankAccountMissing,
    setPlanIsSending,
  }), [isLoading, error, loadingSending, planIsSending, isBankAccountMissing, addBankAccountForm, isAccountsVisible]);

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI должен использоваться внутри UIProvider');
  }
  return context;
}

export default UIContext; 