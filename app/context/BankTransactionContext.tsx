'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import Cookies from 'js-cookie';
import { useAuthContext } from './AuthContext';
import { TransactionType } from '../types/shared/transactions';
interface BankTransactionContextType {
  activeBank: { name: string; id: string };
  bankNames: any[];
  trans: any[];
  balance: number;
  currency: "USD" | "EUR" | "GBP" | "JPY" | "CHF" | "CNY" | "RUB";
  exchangeRates: any;
  hasMore: boolean;
  nextCursor: string | null;
  analyticTransactions: Record<string, TransactionType[]>

  setAnalyticTransactions: (analyticTransactions: any ) => void
  setActiveBank: (bank: { name: string; id: string }) => void;
  setHasMore: (hasMore: boolean) => void;
  setNextCursor: (nextCursor: string | null) => void;
  setBankNames: (bankNames: any[]) => void;
  setTrans: (trans: any[]) => void;
  setBalance: (balance: number) => void;
  setCurrency: (currency: string) => void;
  setExchangeRates: (rates: any) => void;
}
interface bankType{
  name: string,
  balance: number,
  id: string,
  currnecy: string
}

const BankTransactionContext = createContext<BankTransactionContextType | undefined>(undefined);

interface BankTransactionProviderProps {
  children: ReactNode;
}

export function BankTransactionProvider({ children }: BankTransactionProviderProps) {
  const [nextCursor, setNextCursor] = useState<string>(`${new Date()}`)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [activeBank, setActiveBank] = useState({name: '', id: ''});
  const [bankNames, setBankNames] = useState<any[]>([]);
  const [trans, setTrans] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('');
  const [exchangeRates, setExchangeRates] = useState<any>({});
  const [analyticTransactions, setAnalyticTransactions] = useState<Record<string,TransactionType[]>>({})
  const { login } = useAuthContext();
  
  useEffect(() => {
    async function loadBankData() {

      if (login && bankNames.length === 0) {
        try {
          const response = await fetch(`/api/getBankNames`, {
            method: 'GET'
          });
          if (!response.ok) {
            return 
          }
            const namesData = await response.json();
            const trueData = namesData.banks;
            setBankNames(trueData)
            if (!trueData || trueData.length === 0) {
              return;
            }
            const activeBankCookie = Cookies.get('ActiveBankId');          
        } catch(e) {
        }
      }
    }
    
    loadBankData();
  }, [login, bankNames.length]);
  
  const contextValue = useMemo(() => ({
    activeBank,
    bankNames,
    trans,
    balance,
    exchangeRates,
    currency,
    nextCursor,
    hasMore,
    setExchangeRates,
    setHasMore,
    setNextCursor,
    setActiveBank,
    setBankNames,
    setTrans,
    setBalance,
    setCurrency,
    analyticTransactions,
    setAnalyticTransactions
  }), [activeBank, bankNames, trans, balance, currency, analyticTransactions]);

  return (
    <BankTransactionContext.Provider value={contextValue}>
      {children}
    </BankTransactionContext.Provider>
  );
}

export function useBankTransaction() {
  const context = useContext(BankTransactionContext);
  if (!context) {
    throw new Error('useBankTransaction must be used within a BankTransactionProvider');
  }
  return context;
}

export default BankTransactionContext; 