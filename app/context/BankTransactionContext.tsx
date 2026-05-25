'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import Cookies from 'js-cookie';
import { useAuthContext } from './AuthContext';
import { TransactionType } from '../types/shared/transactions';
import { authFetch } from '../services/authFetch';
import { ErrorObjectType } from '../types/shared/error';
import { sendEvent } from '../services/broadcastChannel';
import {useError} from './ErrorContext'
interface BankTransactionContextType {
  activeBank: { name: string; id: string };
  banks: any[];
  trans: any[];
  balance: number;
  currency: "USD" | "EUR" | "GBP" | "JPY" | "CHF" | "CNY" | "RUB";
  exchangeRates: any;
  hasMore: boolean;
  nextCursor: string | null;
  analyticTransactions: Record<string, TransactionType[]>;
  loading: boolean;
  lastUpdated: number;
  orchestator: (transaction: TransactionType, bankId: string) => Promise<void>;

  refreshBanks: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshExchangeRates: () => Promise<void>;

  setAnalyticTransactions: (analyticTransactions: any) => void;
  setActiveBank: (bank: { name: string; id: string }) => void;
  setHasMore: (hasMore: boolean) => void;
  setNextCursor: (nextCursor: string | null) => void;
  setBanks: (banks: any[]) => void;
  setTrans: (trans: any[]) => void;
  setBalance: (balance: number) => void;
  setCurrency: (currency: string) => void;
  setExchangeRates: (rates: any) => void;
}

interface addTransactionEventType {
  type: string;
  payload: TransactionType
}

interface dependenciesType {
  addError: (error: ErrorObjectType)=> void,
  setBalance: React.Dispatch<React.SetStateAction<number>>,
  setTransactions: React.Dispatch<React.SetStateAction<Record<string, TransactionType[]>>>,
  sendEvent: (event: addTransactionEventType) => void
}

interface bankData {
  id: string;
  userId: string;
  name: string;
  notes: string;
  currency: string;
  balance: number;
  createAt: Date | string;
}

const BankTransactionContext = createContext<BankTransactionContextType | undefined>(undefined);

interface BankTransactionProviderProps {
  children: ReactNode;
} 

export function BankTransactionProvider({ children }: BankTransactionProviderProps) {
  const [nextCursor, setNextCursor] = useState<string>(`${new Date()}`);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [activeBank, setActiveBank] = useState({ name: '', id: '' });
  const {addError} = useError();
  const [banks, setBanks] = useState<bankData[]>([]);
  const [trans, setTrans] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('');
  const [exchangeRates, setExchangeRates] = useState<any>({});
  const [analyticTransactions, setAnalyticTransactions] = useState<Record<string, TransactionType[]>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(0);

  const { login, isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (isAuthenticated && login) {
      loadInitialData();
    }
  }, [isAuthenticated, login]);

  function createTransactionOrchestrator(deps: dependenciesType){
    return async function addTransactionOrchestrator(transaction: TransactionType, bankId: string){
      const {addError, setBalance, setTransactions, sendEvent } = deps;
      try{
        if(!bankId.trim()){
          throw new Error('Please select a bank')
        }
        const response = await authFetch(`/api/addTrans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({...transaction, bankId}),
        });
        if(!response.ok){
          throw new Error('Transaction failed')
        }

        const data = await response.json();
        const newTransaction = data.data;
        const key = data.monthKey;
        setBalance((prev) => prev + (newTransaction.type === 'gain' ? newTransaction.amount : -newTransaction.amount));
        setTransactions((prev) => {
          return {
          ...prev,
          [key]: [...(prev[key] || []), newTransaction]
          }
        });

        sendEvent({type: 'ADD_TRANSACTION', payload: newTransaction});

      }catch(e){
        addError({
          theme: 'redDark',
          name: 'Error',
          desc: 'Transaction failed'
        })
        return;
      }
    }
  }

  const loadInitialData = async () => {
    try {
      setLoading(true);

      await refreshBanks();

      const activeBankCookie = Cookies.get('ActiveBankId');
      if (activeBankCookie) {
        setActiveBank(JSON.parse(activeBankCookie));
      }

      const currencyCookie = Cookies.get('Currency');
      if (currencyCookie) {
        setCurrency(currencyCookie);
      }

      await refreshBalance();
      await refreshTransactions();

    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const refreshBanks = async () => {
    try {
      setLoading(true);

      const response = await authFetch('/api/getBankNames', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch banks: ${response.status}`);
      }

      const namesData = await response.json();
      const trueData = namesData.banks || [];

      setBanks(trueData);
      setLastUpdated(Date.now());

      if (trueData.length > 0 && !activeBank.id) {
        const firstBank = trueData[0];
        const bankData = {
          name: firstBank.name,
          id: firstBank.id,
        };
        setActiveBank(bankData);
        Cookies.set('ActiveBankId', JSON.stringify(bankData));
      }

    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    try {
      if(!activeBank.id) return;
      const response = await authFetch(`/api/getBankAccountInfo?bankId=${activeBank.id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.status}`);
      }

      const data = await response.json();
      const newBalance = data.balance || 0;

      setBalance(newBalance);
      setLastUpdated(Date.now());

    } catch (error) {
      throw error;
    }
  };

  const refreshTransactions = async () => {
    try {
      if(!activeBank.id) return;
      const response = await authFetch(`/api/transactions?bankId=${activeBank.id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const data = await response.json();
      const transactions = Array.isArray(data) ? data : data.transactions || [];

      setTrans(transactions);
      setLastUpdated(Date.now());

    } catch (error) {
      throw error;
    }
  };

  const refreshExchangeRates = async () => {
    try {
      const response = await authFetch('/api/getExchangeRate', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates: ${response.status}`);
      }

      const data = await response.json();

      setExchangeRates(data);
      setLastUpdated(Date.now());

    } catch (error) {
      throw error;
    }
  };

  const handleSetActiveBank = (bank: { name: string; id: string }) => {
    setActiveBank(bank);
    Cookies.set('ActiveBankId', JSON.stringify(bank), { expires: 30 });
  };

  const handleSetCurrency = (curr: string) => {
    setCurrency(curr as any);
    Cookies.set('Currency', curr, { expires: 30 });
  };
  const orchestator = useMemo(()=>{
    return createTransactionOrchestrator({
      addError,
      setBalance,
      setTransactions: setAnalyticTransactions,
      sendEvent
    })
  }, [ sendEvent, addError])

  const contextValue = useMemo(
    () => ({
      activeBank,
      banks,
      trans,
      balance,
      exchangeRates,
      currency,
      nextCursor,
      hasMore,
      analyticTransactions,
      loading,
      lastUpdated,
      orchestator,

      refreshBanks,
      refreshBalance,
      refreshTransactions,
      refreshExchangeRates,

      setAnalyticTransactions,
      setActiveBank: handleSetActiveBank,
      setHasMore,
      setNextCursor,
      setBanks,
      setTrans,
      setBalance,
      setCurrency: handleSetCurrency,
      setExchangeRates,
    }),
    [activeBank, banks, trans, balance, currency, exchangeRates, nextCursor, hasMore, analyticTransactions, loading, lastUpdated]
  );

  return (
    <BankTransactionContext.Provider value={contextValue}>
      {children}
    </BankTransactionContext.Provider>
  );
}

export function useBankTransaction() {
  const context = useContext(BankTransactionContext);
  if (!context) {
    throw new Error(
      'useBankTransaction must be used within a BankTransactionProvider'
    );
  }
  return context;
}

export default BankTransactionContext;