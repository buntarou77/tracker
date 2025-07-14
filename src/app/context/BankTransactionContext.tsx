'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import Cookies from 'js-cookie';
import { useAuthContext } from './AuthContext';
interface BankTransactionContextType {
  activeBank: { name: string; id: string };
  bankNames: any[];
  trans: any[];
  balance: number;
  currency: string;
  
  setActiveBank: (bank: { name: string; id: string }) => void;
  setBankNames: (bankNames: any[]) => void;
  setTrans: (trans: any[]) => void;
  setBalance: (balance: number) => void;
  setCurrency: (currency: string) => void;
}

const BankTransactionContext = createContext<BankTransactionContextType | undefined>(undefined);

interface BankTransactionProviderProps {
  children: ReactNode;
}

export function BankTransactionProvider({ children }: BankTransactionProviderProps) {
  const [activeBank, setActiveBank] = useState({name: '', id: ''});
  const [bankNames, setBankNames] = useState<any[]>([]);
  const [trans, setTrans] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('');
 const [exchangeRates, setExchangeRates] = useState<any>({});
  const { login, isAuthenticated } = useAuthContext();

  
  useEffect(() => {
    async function loadBankData() {
      if (login && bankNames.length === 0) {
        try {
          const response = await fetch(`/api/getBankNamesRedis?login=${login}`, {
            method: 'GET'
          });
          
          if (response.ok) {
            const namesData = await response.json();
            const trueData = namesData.value.bankAccounts || namesData.value;
            setBankNames(trueData);
            
            if (!trueData || trueData.length === 0) {
              return;
            }
            
            const activeBankName = Cookies.get('ActiveBankName');
            if (activeBankName) {
              const activeBank = trueData.find((bank: any) => bank.name === activeBankName);
              if (activeBank) {
                try {
                  const response = await fetch(`/api/getTransRedis?login=${login}&bankName=${activeBank.name}`, {
                    method: 'GET'
                  });
                  if (response.ok) {
                    const transData = await response.json();
                    setTrans(transData.value);
                    setBalance(activeBank.balance);  
                    setCurrency(activeBank.currency);
                    setActiveBank({name: activeBank.name, id: activeBank.id});
                  }
                } catch(e) {
                  console.error('Error loading transactions:', e);
                }
              }
            } else {
              try {
                const response = await fetch(`/api/getTransRedis?login=${login}&bankName=${trueData[0].name}`, {
                  method: 'GET'
                });
                if (response.ok) {
                  const transData = await response.json();
                  const someActiveBank = trueData[0];
                  setTrans(transData.value);
                  setBalance(someActiveBank.balance);
                  setCurrency(someActiveBank.currency);
                  setActiveBank({name: someActiveBank.name, id: someActiveBank.id});
                }
              } catch(e) {
                console.error('Error loading default bank transactions:', e);
              }
            }
          }
        } catch(e) {
          console.error('Error loading bank data:', e);
        }
      }
    }
    
    loadBankData();
  }, [login, bankNames.length, isAuthenticated]);

  const contextValue = useMemo(() => ({
    activeBank,
    bankNames,
    trans,
    balance,
    exchangeRates,
    currency,
    setExchangeRates,
    setActiveBank,
    setBankNames,
    setTrans,
    setBalance,
    setCurrency,
  }), [activeBank, bankNames, trans, balance, currency]);

  return (
    <BankTransactionContext.Provider value={contextValue}>
      {children}
    </BankTransactionContext.Provider>
  );
}

export function useBankTransaction() {
  const context = useContext(BankTransactionContext);
  if (!context) {
    throw new Error('useBankTransaction должен использоваться внутри BankTransactionProvider');
  }
  return context;
}

export default BankTransactionContext; 