'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useAuth } from '../hooks/useAuth';
interface AppContextType {
  trans: any[];
  plans: any[];
  activePlans: any[];
  activePlan: any;
  activePlansStatus: any;
  categorys: any[];
  targets: any[];
  storagePlans: any[];
  accounts: any[];
  bankNames: any[];
  login: string;
  activeBank: { name: string; id: string };
  balance: number;
  currency: string;
  skipTrans: number;
  moreGains: number;
  moreLosses: number;
  
  isLoading: boolean;
  error: string;
  loadingSending: boolean;
  planIsSending: boolean;
  
  setTrans: (trans: any[]) => void;
  setPlans: (plans: any[]) => void;
  setActivePlans: (activePlans: any[]) => void;
  setActivePlan: (activePlan: any) => void;
  setActivePlansStatus: (status: any) => void;
  setCategorys: (categorys: any[]) => void;
  setTargets: (targets: any[]) => void;
  setStoragePlans: (storagePlans: any[]) => void;
  setAccounts: (accounts: any[]) => void;
  setBankNames: (bankNames: any[]) => void;
  setLogin: (login: string) => void;
  setActiveBank: (bank: { name: string; id: string }) => void;
  setBalance: (balance: number) => void;
  setCurrency: (currency: string) => void;
  setSkipTrans: (skip: number) => void;
  setMoreGains: (gains: number) => void;
  setMoreLosses: (losses: number) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setLoadingSending: (loading: boolean) => void;
  setPlanIsSending: (sending: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [trans, setTrans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [login, setLogin] = useState('');
  const [activeBank, setActiveBank] = useState({name: '', id: ''});
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [bankNames, setBankNames] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [activePlans, setActivePlans] = useState<any[]>([]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [activePlansStatus, setActivePlansStatus] = useState({
    daily: { status: false, id: 0 },
    weekly: { status: false, id: 0 },
    monthly: { status: false, id: 0 },
    yearly: { status: false, id: 0 }
  });
  const [skipTrans, setSkipTrans] = useState(0);
  const [storagePlans, setStoragePlans] = useState<any[]>([]);
  const [categorys, setCategorys] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [loadingSending, setLoadingSending] = useState(false);
  const [planIsSending, setPlanIsSending] = useState(false);
  const [moreGains, setMoreGains] = useState(0);
  const [moreLosses, setMoreLosses] = useState(0);
  const auth = useAuth();
  
  // Загружаем данные когда пользователь аутентифицирован
  useEffect(() => {
    if(auth.user && auth.isAuthenticated){
      setLogin(auth.user.login)
    }
  }, [auth.user, auth.isAuthenticated])

  // Основная загрузка данных при аутентификации
  useEffect(() => {
    async function loadUserData() {
      if(auth.isAuthenticated && auth.user && !auth.isLoading) {
        const userLogin = auth.user.login;
        setLogin(userLogin);
        
        // Загружаем банковские данные
        if(bankNames.length === 0) {
          try {
            const response = await fetch(`/api/getBankNamesRedis?login=${userLogin}`, {
              method: 'GET'
            })
            if (response.ok) {
              const namesData = await response.json()
              const trueData = namesData.value.bankAccounts || namesData.value
              setBankNames(trueData)
              
              if(!trueData || trueData.length === 0){
                setIsLoading(false)
                return
              }
              
              const activeBankName = Cookies.get('ActiveBankName')
              if(activeBankName){
                const activeBank = trueData.find((bank: any) => bank.name === activeBankName)
                if(activeBank){
                  try{
                    const response = await fetch(`/api/getTransRedis?login=${userLogin}&bankName=${activeBank.name}`, {
                      method: 'GET'
                    })
                    if(response.ok){
                      const transData = await response.json()
                      setTrans(transData.value)
                      setBalance(activeBank.balance)  
                      setCurrency(activeBank.currency)
                      setActiveBank({name: activeBank.name, id: activeBank.id})
                      setIsLoading(false)
                    }
                  }catch(e){
                    console.log(e)
                    setIsLoading(false)
                  }
                }
              }else{
                try{
                  const response = await fetch(`/api/getTransRedis?login=${userLogin}&bankName=${trueData[0].name}`, {
                    method: 'GET'
                  })
                  if(response.ok){
                    const transData = await response.json()
                    const someActiveBank = trueData[0]
                    setTrans(transData.value)
                    setBalance(someActiveBank.balance)
                    setCurrency(someActiveBank.currency)
                    setActiveBank({name: someActiveBank.name, id: someActiveBank.id})
                    setIsLoading(false)
                  }
                }catch(e){
                  console.log(e)
                  setIsLoading(false)
                }
              }

            } else {
              setIsLoading(false)
              setError('Не удалось загрузить банковские счета')
            }
          } catch(e) {
            console.log(e)
            setIsLoading(false)
            setError('Ошибка при загрузке данных банковских счетов')
          }
        }
        
        // Загружаем планы
        try{
          const res = await fetch(`api/getPlans?login=${userLogin}`, {
            method: 'GET'
          })
          if(res.ok){
            const data = await res.json();
            const activePlans = getActivePlans();
            
            const activePlansStatus = data.plans.reduce((acc: any, plan: any) => {
              if (activePlans.includes(plan.id)) {
                acc[plan.frequency] = {
                  status: true,
                  id: plan.id
                };
              }
              return acc;
            }, {
              daily: { status: false, id: 0 },
              weekly: { status: false, id: 0 },
              monthly: { status: false, id: 0 },
              yearly: { status: false, id: 0 }
            });

            setActivePlansStatus(activePlansStatus);
            setPlans(data.plans);
          }
        }catch(e){
          console.log(e)
        }
      }
    }
    
    loadUserData();
  }, [auth.isAuthenticated, auth.user, auth.isLoading, bankNames.length])


  const getActivePlans = () => {
    const activePlans = localStorage.getItem('activePlans');
    return activePlans ? JSON.parse(activePlans) : [];
  };
  
  const contextValue: AppContextType = {
    trans,
    plans,
    activePlans,
    activePlan,
    activePlansStatus,
    categorys,
    targets,
    storagePlans,
    accounts,
    bankNames,
    login,
    activeBank,
    balance,
    currency,
    skipTrans,
    moreGains,
    moreLosses,
    
    isLoading,
    error,
    loadingSending,
    planIsSending,
    
    setTrans,
    setPlans,
    setActivePlans,
    setActivePlan,
    setActivePlansStatus,
    setCategorys,
    setTargets,
    setStoragePlans,
    setAccounts,
    setBankNames,
    setLogin,
    setActiveBank,
    setBalance,
    setCurrency,
    setSkipTrans,
    setMoreGains,
    setMoreLosses,
    setIsLoading,
    setError,
    setLoadingSending,
    setPlanIsSending
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp должен использоваться внутри AppProvider');
  }
  return context;
}

export default AppContext; 