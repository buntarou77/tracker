'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Target {
  id: number;
  target: string;
  amount: number;
  achieved?: boolean;
  achievedDate?: Date;
  progress?: number;
}

interface Plan {
  id: number;
  name: string;
  type: string;
  totalAmount: number;
  frequency: string;
  categorys: Array<{
    category: string;
    amount: number;
    id: number;
  }>;
  targets?: Target[];
}

export default function BudgetPage() {
  const { 
    plans, 
    trans, 
    login, 
    activeBank,
    activePlan,
    setActivePlan,
    currency,
    activePlansStatus,
    setPlans,
    balance,
    setTrans,
    moreGains,
    moreLosses,
    setMoreGains,
    setMoreLosses
  } = useApp();
  
  const { user } = useAuth();
  const [categoryProgress, setCategoryProgress] = useState<Record<string, number>>({});
  const [targetsProgress, setTargetsProgress] = useState<Record<number, number>>({});
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [budgetStatus, setBudgetStatus] = useState({
    totalSaved: 0,
    monthlyBalance: 0,
    canAffordTargets: {} as Record<number, boolean>
  });
  const [claimingTarget, setClaimingTarget] = useState<number | null>(null);

  useEffect(() => {
    if (plans && plans.length > 0 && !activePlan) {
      const storedActivePlans = localStorage.getItem('activePlans');
      const activePlansIds = storedActivePlans ? JSON.parse(storedActivePlans) : [];
      
      if (activePlansIds.length > 0) {
        const firstActivePlan = plans.find(plan => activePlansIds.includes(plan.id));
        if (firstActivePlan) {
          setActivePlan(firstActivePlan);
        }
      } else if (plans.length > 0) {
        setActivePlan(plans[0]);
      }
    }
    setIsLoading(false);
  }, [plans, activePlan, setActivePlan]);

  useEffect(() => {
    if (!activePlan || !trans) return;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    const monthTransactions = (trans as any)[monthKey] || [];

    const categorySpending: Record<string, number> = {};
    
    monthTransactions.forEach((transaction: any) => {
      if (transaction.type === 'loss') {
        categorySpending[transaction.category] = (categorySpending[transaction.category] || 0) + transaction.amount;
      }
    });

    const progress: Record<string, number> = {};
    if (activePlan.categorys) {
      activePlan.categorys.forEach((cat: any) => {
        const spent = categorySpending[cat.category] || 0;
        const percentage = (spent / cat.amount) * 100;
        progress[cat.category] = percentage;
      });
    }
    console.log(progress)
    setCategoryProgress(progress);
  }, [activePlan, trans]);

  // Расчет прогресса targets и состояния бюджета
  useEffect(() => {
    if (!activePlan || !trans) return;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    const monthTransactions = (trans as any)[monthKey] || [];

    const monthlySaved = monthTransactions
      .filter((t: any) => t.type === 'gain')
      .reduce((sum: number, t: any) => sum + t.amount, 0);


    const monthlyIncome = monthTransactions
      .filter((t: any) => t.type === 'gain')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const monthlyExpenses = monthTransactions
      .filter((t: any) => t.type === 'loss')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const monthlyBalance = monthlyIncome - monthlyExpenses;


    const progress: Record<number, number> = {};
    const canAffordTargets: Record<number, boolean> = {};

    if (activePlan.targets) {
      activePlan.targets.forEach((target: Target) => {
        if (!target.achieved) {
          progress[target.id] = (balance / target.amount) * 100;
          canAffordTargets[target.id] = balance >= target.amount;
        }
      });
    }
console.log(progress)
    setTargetsProgress(progress);
    setBudgetStatus({
      totalSaved: monthlySaved, 
      monthlyBalance,
      canAffordTargets
    });
  }, [activePlan, trans]);

  useEffect(() => {
    const recommendations: string[] = [];

    // Рекомендации по категориям
    Object.entries(categoryProgress).forEach(([category, progress]) => {
      if (progress > 100) {
        recommendations.push(
          `⚠️ Budget exceeded in category "${category}" by ${Math.round(progress - 100)}%. Consider reducing expenses.`
        );
      } else if (progress > 80) {
        recommendations.push(
          `⚡ Almost at limit in "${category}" (${Math.round(progress)}%). Monitor spending carefully.`
        );
      }
    });

    // Рекомендации по целям накопления
    if (activePlan?.targets) {
      const affordableTargets = activePlan.targets.filter((target: Target) => 
        target && budgetStatus.canAffordTargets[target.id]
      ).length;
      
      if (affordableTargets > 0) {
        recommendations.push(
          `🎯 You can afford ${affordableTargets} goal${affordableTargets > 1 ? 's' : ''}! Consider claiming them.`
        );
      }

      const lowProgressTargets = Object.entries(targetsProgress).filter(([_, progress]) => progress < 25).length;
      if (lowProgressTargets > 0) {
        recommendations.push(
          `💡 ${lowProgressTargets} goal${lowProgressTargets > 1 ? 's have' : ' has'} low progress. Increase savings to reach them faster.`
        );
      }
    }

    // Рекомендации по месячному балансу
    if (balance < 0) {
      recommendations.push(
        `📉 Monthly expenses exceed income by $${Math.abs(budgetStatus.monthlyBalance)}. Review your spending.`
      );
    } else if (budgetStatus.monthlyBalance > budgetStatus.totalSaved * 0.1) {
      recommendations.push(
        `💰 Great monthly balance of $${budgetStatus.monthlyBalance}! Consider increasing savings goals.`
      );
    }

    // Рекомендации по общим сбережениям
    if (budgetStatus.totalSaved < 1000) {
      recommendations.push(
        `🚨 Build emergency fund: You have $${budgetStatus.totalSaved} saved. Aim for at least $1,000.`
      );
    }

    setAiRecommendations(recommendations);
  }, [categoryProgress, targetsProgress, budgetStatus, activePlan]);


  const claimTarget = async (planId: number, targetId: number, targetAmount: number) => {
    setClaimingTarget(targetId);
    
    try {
      const expenseResponse = await fetch('/api/addTransRedis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login,
          bankName: activeBank.name,
          amount: targetAmount,
          category: 'savings',
          type: 'loss',
          date: new Date().toISOString().split('T')[0],
          note: `Target claimed: ${activePlan.targets?.find((t: any) => t.id === targetId)?.target}`
        })
      });

      if (!expenseResponse.ok) {
        throw new Error('Failed to record expense');
      }

      const updatedPlan = {
        ...activePlan,
        targets: activePlan.targets?.filter((target: Target) => target.id !== targetId)
      };

      const updateResponse = await fetch(`/api/rewritePlan?login=${login}&id=${planId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlan)
      });

      if (updateResponse.ok) {
        const updatedPlans = plans.map((plan: Plan) => 
          plan.id === planId
            ? {
                ...plan,
                targets: plan.targets?.filter((target: Target) => target.id !== targetId)
              }
            : plan
        );
        setPlans(updatedPlans);
        
        if (activePlan.id === planId) {
          setActivePlan(updatedPlan);
        }

        const newTrans = await fetch(`/api/getTransRedis?login=${login}&bankName=${activeBank.name}`);
        if (newTrans.ok) {
          const transData = await newTrans.json();
          setTrans(transData.value);
        }
      } else {
        throw new Error('Failed to update plan');
      }
    } catch (error) {
      console.error('Error claiming target:', error);
      alert('Failed to claim target. Please try again.');
    } finally {
      setClaimingTarget(null);
    }
  };



  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {activePlan && (
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Budget Tracking</h1>
          <div className="flex gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm mb-1">Active Plan</h3>
              <p className="text-xl font-bold text-blue-400">{activePlan?.name}</p>
              <p className="text-sm text-gray-300 capitalize">{activePlan.frequency} • {activePlan.type}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm mb-1">Budget Status</h3>
              <p className="text-lg font-bold text-green-400">{balance}<span className="text-gray-300">{currency}</span> </p>
              <p className={`text-sm ${budgetStatus.monthlyBalance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                ${budgetStatus.monthlyBalance} this month
              </p>
            </div>
          </div>
        </div>
        )}
        {/* Plan Selector */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Select Active Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan: any) => (
              <div 
                key={plan.id}
                onClick={() => setActivePlan(plan)}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                  activePlan?.id === plan.id 
                    ? 'bg-blue-600 border-2 border-blue-400' 
                    : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                }`}
              >
                <h3 className="text-white font-medium mb-2">{plan.name}</h3>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${
                    plan.type === 'income' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${plan.totalAmount}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{plan.frequency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Progress */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Category Budget Progress</h2>
          {activePlan?.categorys && activePlan?.categorys.length > 0 && activePlan? (
            <div className="space-y-4">
              {activePlan.categorys.map((category: any) => {
                const progress = categoryProgress[category.category] || 0;
                const progressColor = progress > 100 ? 'bg-red-500' : progress > 80 ? 'bg-yellow-500' : 'bg-green-500';
                
                return (
                  <div key={category.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-white font-medium capitalize">{category.category}</h3>
                      <div className="text-right">
                        <span className={`font-bold ${progress > 100 ? 'text-red-400' : 'text-white'}`}>
                          {progress.toFixed(1)}%
                        </span>
                        <div className="text-sm text-gray-400">
                          ${((category.amount * progress) / 100).toFixed(0)} / ${category.amount}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    {progress > 100 && (
                      <p className="text-red-400 text-sm mt-2">
                        ⚠️ Over budget by ${((category.amount * (progress - 100)) / 100).toFixed(0)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No categories defined for this plan</p>
            </div>
          )}
        </div>

        {/* Targets Progress */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Savings Goals Progress</h2>
          {activePlan?.targets && activePlan?.targets.length > 0 && activePlan ? (
            <div className="space-y-4">
              {activePlan.targets.map((target: Target) => (
                <div key={target.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="text-white font-medium">🎯 {target.target}</h3>
                      <p className="text-gray-400 text-sm">Goal: ${target.amount}</p>
                    </div>
                    <div className="text-right">
                      {target.achieved ? (
                        <span className="text-green-400 font-medium text-lg">✓ Achieved</span>
                      ) : (
                        <div>
                          <span className="text-blue-400 font-bold text-lg">
                            {Math.round(targetsProgress[target.id] || 0)}%
                          </span>
                          <div className="text-sm text-gray-400">
                            ${((target.amount * (targetsProgress[target.id] || 0)) / 100).toFixed(0)} saved
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {target && (
                    <div className="mb-3">
                      <div className="w-full bg-gray-600 rounded-full h-3">
                        <div 
                          className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, targetsProgress[target.id] || 0)}%` }}
                        />
                      </div>
                    </div>
                  )}
                    {target && (
                     <div className="flex justify-between items-center">
                       <div className="text-sm text-gray-400">
                         {budgetStatus.canAffordTargets[target.id] ? (
                           <span className="text-green-400">✅ Can afford this goal!</span>
                         ) : (
                           <span>💰 Need {(target.amount - balance).toFixed(0)}{currency} more</span>
                         )}
                       </div>
                       <div className="flex gap-2">
                         {budgetStatus.canAffordTargets[target.id] && (
                           <button
                             onClick={() => claimTarget(activePlan.id, target.id, target.amount)}
                             disabled={claimingTarget === target.id}
                             className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                             {claimingTarget === target.id ? 'Claiming...' : '🎯 Claim Goal'}
                           </button>
                         )}
                       </div>
                     </div>
                   )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No savings goals defined for this plan</p>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">🤖 AI Recommendations</h2>
          {aiRecommendations.length > 0 ? (
            <div className="space-y-3">
              {aiRecommendations.map((recommendation, index) => (
                <div key={index} className="p-3 bg-gray-700 rounded-lg">
                  <p className="text-gray-300">{recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Great job! All indicators are normal.</p>
          )}
        </div>
      </div>
    </div>
  );
} 