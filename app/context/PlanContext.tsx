'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuthContext } from './AuthContext';
import { useAuth } from '../hooks/useAuth';
import { getPlanType } from '../types/shared/plan';
interface PlanContextType {
  plans: any[];
  activePlans: any[];
  activePlansStatus: any;
  storagePlans: any[];
  activeMonthPlan: PlanType;

  setActiveMonthPlan: (activeMonthPlan: PlanType) => void;
  setPlans: (plans: any[] | ((prev: any[]) => any[])) => void;
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
  const [activeMonthPlan, setActiveMonthPlan] = useState<getPlanType>({})
  const [activePlansStatus, setActivePlansStatus] = useState({
    daily: { status: false, id: 0 },
    weekly: { status: false, id: 0 },
    monthly: { status: false, id: 0 },
    yearly: { status: false, id: 0 }
  });
  
  const { login } = useAuthContext();

  const getActivePlans = () => {
    const activePlansStorageData = localStorage.getItem('activePlansIds');
    return activePlansStorageData ? JSON.parse(activePlansStorageData) : [];
  };

  useEffect(() => {
    async function loadPlans() {
      if (login) {
        try {
          const res = await fetch(`api/getPlans?`, {
            method: 'GET'
          });
          
          if (res.ok) {
            const data = await res.json();
            const activePlansIdsData = getActivePlans();
            console.log('plansData')
            console.log(data.plans)
            const activePlansStatusData = data.plans.reduce((acc: any, plan: any) => {
              if (activePlansIdsData.includes(plan.id)) {
                acc[plan.frequency] = {
                  status: true,
                  id: plan._id
                };
              }
              return acc;
            }, {
              daily: { status: false, id: 0 },
              weekly: { status: false, id: 0 },
              monthly: { status: false, id: 0 },
              yearly: { status: false, id: 0 }
            });
            console.log('212121')
            console.log(activePlansIdsData)
            console.log(activePlansStatusData)
            setActivePlansStatus(activePlansStatusData);
            console.log('monthly')
            console.log(activePlansStatusData.monthly)
            if(activePlansStatusData.monthly.status){
              console.log(1)
              setActiveMonthPlan(plans.find((item)=> item.id === activePlansStatusData['monthly'].id))
            }
            setPlans(data.plans.map((item: getPlanType)=> {
              return{
                ...item,
                id: item._id
              }
            }));
          }
        } catch(e) {
        }
      }
    }
    
    loadPlans();
  }, [login]);

  const contextValue = useMemo(() => ({
    plans,
    activePlans,
    activePlansStatus,
    activeMonthPlan,
    setActiveMonthPlan,
    setPlans,
    setActivePlans,
    setActivePlansStatus,
    storagePlans,
    setStoragePlans,
  }), [plans, activePlans, activePlansStatus, storagePlans, setPlans, activeMonthPlan, setActiveMonthPlan, setActivePlans, setActivePlansStatus, setStoragePlans]);

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