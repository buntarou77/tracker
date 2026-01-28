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
  exchangeRates: any;
  hasMore: boolean;
  nextCursor: string | null;

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
  const [nextCursor, setNextCursor] = useState<string>('')
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [activeBank, setActiveBank] = useState({name: '', id: ''});
  const [bankNames, setBankNames] = useState<any[]>([]);
  const [trans, setTrans] = useState({});
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('');
 const [exchangeRates, setExchangeRates] = useState<any>({});
  const { login } = useAuthContext();
  console.log(bankNames)
  
  useEffect(() => {
    async function loadBankData() {

      if (login && bankNames.length === 0) {
        try {
          const response = await fetch(`/api/getBankNames`, {
            method: 'GET'
          });
          console.log(response)
          if (!response.ok) {
            return 
          }
            const namesData = await response.json();
            console.log(namesData)
            const trueData = namesData.banks;
            setBankNames(trueData)
            if (!trueData || trueData.length === 0) {
              return;
            }
            
            const activeBankCookie = Cookies.get('ActiveBankId');
            // if (activeBankCookie) {
            //   const activeBankId = JSON.parse(activeBankCookie)
            //   const activeBank = trueData.find((bank: bankType) => bank.id === activeBankId);
            //   if (activeBank) {  
            //     try {
            //       if(activeBank.name === '') return 
            //       console.log('getTrans: bankTransactions 70')
            //       const response = await fetch(`/api/getTrans?bankId=${activeBank.id}`, {
            //         method: 'GET'
            //       });
            //       if (response.ok) {
            //         const transData = await response.json();
            //         setTrans(transData.transactions);
            //         setBalance(activeBank.balance);  
            //         setCurrency(activeBank.currency);
            //         setHesNext(transData.hesNext)
            //         setNextCursor(transData.nextCursor)
            //         setActiveBank({name: activeBank.name, id: activeBank.id});
            //       }
            //     } catch(e) {
            //     }
            //   }
            // } else {
            //   try {
            //     if(activeBank.name === '' ) return 
            //     console.log('getTrans: bankTransaction 87')
            //     const response = await fetch(`/api/getTrans?bankId=${trueData[0].id}`, {
            //       method: 'GET'
            //     });
            //     if (response.ok) {
            //       const transData = await response.json();
            //       const someActiveBank = trueData[0];
            //       setTrans(transData.transactions);
            //       setBalance(someActiveBank.balance);
            //       setCurrency(someActiveBank.currency);
            //       setActiveBank({name: someActiveBank.name, id: someActiveBank.id});
            //       Cookies.set('ActiveBankId', JSON.stringify(someActiveBank.id || ''));
            //     }
            //   } catch(e) {
            //   }
            // }
          
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
    throw new Error('useBankTransaction must be used within a BankTransactionProvider');
  }
  return context;
}

export default BankTransactionContext; 