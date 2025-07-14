'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuthContext } from './AuthContext';
import { useAuth } from '../hooks/useAuth';
interface PlanContextType {
  plans: any[];
  activePlans: any[];
  activePlansStatus: any;
  storagePlans: any[];
  
  setPlans: (plans: any[]) => void;
  setActivePlans: (activePlans: any[]) => void;
  setActivePlansStatus: (status: any) => void;
  setStoragePlans: (storagePlans: any[]) => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

interface PlanProviderProps {
  children: ReactNode;
}

export function PlanProvider({ children }: PlanProviderProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [activePlans, setActivePlans] = useState<any[]>([]);
  const [storagePlans, setStoragePlans] = useState<any[]>([]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [activePlansStatus, setActivePlansStatus] = useState({
    daily: { status: false, id: 0 },
    weekly: { status: false, id: 0 },
    monthly: { status: false, id: 0 },
    yearly: { status: false, id: 0 }
  });
  
  const { login, isAuthenticated} = useAuthContext();

  const getActivePlans = () => {
    const activePlans = localStorage.getItem('activePlans');
    return activePlans ? JSON.parse(activePlans) : [];
  };

  useEffect(() => {
    async function loadPlans() {
      if (login) {
        try {
          const res = await fetch(`api/getPlans?login=${login}`, {
            method: 'GET'
          });
          
          if (res.ok) {
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
        } catch(e) {
          console.error('Error loading plans:', e);
        }
      }
    }
    
    loadPlans();
  }, [login, isAuthenticated]);

  const contextValue = useMemo(() => ({
    plans,
    activePlans,
    activePlansStatus,
    activePlan,
    setActivePlans,
    setActivePlan,
    setActivePlansStatus,
    storagePlans,
    setStoragePlans,
  }), [plans, activePlans, activePlansStatus, storagePlans, activePlan, setActivePlan]);

  return (
    <PlanContext.Provider value={contextValue}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan должен использоваться внутри PlanProvider');
  }
  return context;
}

export default PlanContext; 