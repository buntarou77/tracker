'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BalanceContextType {
  balance: number;
  setBalance: (balance: number) => void;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(0);

  return (
    <BalanceContext.Provider value={{ balance, setBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance должен использоваться внутри BalanceProvider');
  }
  return context;
}