'use client';

import { useAppContext } from '../context/BalanceContext';
import { BankAccount, Transaction, Plan } from '../types';

// Хук для работы с пользователем
export function useUser() {
  const { state } = useAppContext();
  
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      // Перезагружаем страницу для полного выхода
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // В случае ошибки все равно перезагружаем
      window.location.href = '/';
    }
  };

  return {
    user: state.user.data,
    isAuthenticated: state.user.isAuthenticated,
    loading: state.user.loading,
    error: state.user.error,
    logout,
  };
}

// Хук для работы с банковскими счетами
export function useBankAccounts() {
  const { state, dispatch, loadBankAccounts } = useAppContext();

  const createAccount = async (accountData: Omit<BankAccount, 'id'>) => {
    if (!state.user.isAuthenticated || !state.user.data) {
      return { success: false, error: 'Не авторизован' };
    }

    try {
      const response = await fetch('/api/addNewAccountRedis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          login: state.user.data.login,
          bankName: accountData.name,
          balance: accountData.balance,
        }),
      });

      if (response.ok) {
        // Optimistic update
        const newAccount = { 
          ...accountData, 
          id: Date.now().toString() 
        };
        dispatch({ type: 'ADD_BANK_ACCOUNT', payload: newAccount });
        
        // Обновляем список счетов для синхронизации
        setTimeout(() => loadBankAccounts(), 500);
        
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Не удалось создать счет' };
      }
    } catch (error) {
      console.error('Create account error:', error);
      return { success: false, error: 'Ошибка сети' };
    }
  };

  const deleteAccount = async (accountName: string) => {
    if (!state.user.isAuthenticated || !state.user.data) {
      return { success: false, error: 'Не авторизован' };
    }

    try {
      const response = await fetch('/api/deleteAccountRedis', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          login: state.user.data.login,
          bankName: accountName,
        }),
      });

      if (response.ok) {
        dispatch({ type: 'DELETE_BANK_ACCOUNT', payload: accountName });
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Не удалось удалить счет' };
      }
    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, error: 'Ошибка сети' };
    }
  };

  // Вычисляемые значения
  const totalBalance = state.bankAccounts.data.reduce(
    (total, account) => total + (account.balance || 0), 
    0
  );

  return {
    accounts: state.bankAccounts.data,
    loading: state.bankAccounts.loading,
    error: state.bankAccounts.error,
    totalBalance,
    createAccount,
    deleteAccount,
    refreshAccounts: loadBankAccounts,
  };
}

// Хук для работы с транзакциями
export function useTransactions() {
  const { state, dispatch, loadTransactions } = useAppContext();

  const createTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    if (!state.user.isAuthenticated || !state.user.data) {
      return { success: false, error: 'Не авторизован' };
    }

    try {
      const response = await fetch('/api/addTrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          login: state.user.data.login,
          amount: transactionData.amount,
          description: transactionData.description,
          date: transactionData.date,
          bankName: transactionData.bankAccount,
        }),
      });

      if (response.ok) {
        // Optimistic update
        const newTransaction = { 
          ...transactionData, 
          id: Date.now().toString() 
        };
        dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
        
        // Обновляем транзакции для синхронизации
        setTimeout(() => loadTransactions(), 500);
        
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Не удалось создать транзакцию' };
      }
    } catch (error) {
      console.error('Create transaction error:', error);
      return { success: false, error: 'Ошибка сети' };
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!state.user.isAuthenticated || !state.user.data) {
      return { success: false, error: 'Не авторизован' };
    }

    try {
      const response = await fetch('/api/delTransRedis', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          login: state.user.data.login,
          transactionId: transactionId,
        }),
      });

      if (response.ok) {
        dispatch({ type: 'DELETE_TRANSACTION', payload: transactionId });
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Не удалось удалить транзакцию' };
      }
    } catch (error) {
      console.error('Delete transaction error:', error);
      return { success: false, error: 'Ошибка сети' };
    }
  };

  // Вычисляемые значения для текущего месяца
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyTransactions = state.transactions.data.filter(trans => {
    const transDate = new Date(trans.date);
    return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(trans => trans.type === 'income')
    .reduce((total, trans) => total + Math.abs(trans.amount), 0);

  const monthlyExpenses = monthlyTransactions
    .filter(trans => trans.type === 'expense')
    .reduce((total, trans) => total + Math.abs(trans.amount), 0);

  return {
    transactions: state.transactions.data,
    loading: state.transactions.loading,
    error: state.transactions.error,
    monthlyIncome,
    monthlyExpenses,
    createTransaction,
    deleteTransaction,
    refreshTransactions: loadTransactions,
  };
}

// Хук для работы с планами
export function usePlans() {
  const { state, dispatch, loadPlans } = useAppContext();

  const createPlan = async (planData: Omit<Plan, 'id'>) => {
    if (!state.user.isAuthenticated || !state.user.data) {
      return { success: false, error: 'Не авторизован' };
    }

    try {
      const response = await fetch('/api/addPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          login: state.user.data.login,
          ...planData,
        }),
      });

      if (response.ok) {
        // Optimistic update
        const newPlan = { 
          ...planData, 
          id: Date.now().toString() 
        };
        dispatch({ type: 'ADD_PLAN', payload: newPlan });
        
        // Обновляем планы для синхронизации
        setTimeout(() => loadPlans(), 500);
        
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Не удалось создать план' };
      }
    } catch (error) {
      console.error('Create plan error:', error);
      return { success: false, error: 'Ошибка сети' };
    }
  };

  const deletePlan = async (planId: string) => {
    if (!state.user.isAuthenticated || !state.user.data) {
      return { success: false, error: 'Не авторизован' };
    }

    try {
      const response = await fetch('/api/deletePlan', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          login: state.user.data.login,
          planId: planId,
        }),
      });

      if (response.ok) {
        dispatch({ type: 'DELETE_PLAN', payload: planId });
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Не удалось удалить план' };
      }
    } catch (error) {
      console.error('Delete plan error:', error);
      return { success: false, error: 'Ошибка сети' };
    }
  };

  const getActivePlans = () => {
    return state.plans.data.filter(plan => plan.isActive);
  };

  const getPlanProgress = (planId: string) => {
    const plan = state.plans.data.find(p => p.id === planId);
    if (!plan || plan.targetAmount === 0) return 0;
    return Math.min((plan.currentAmount / plan.targetAmount) * 100, 100);
  };

  return {
    plans: state.plans.data,
    loading: state.plans.loading,
    error: state.plans.error,
    createPlan,
    deletePlan,
    getActivePlans,
    getPlanProgress,
    refreshPlans: loadPlans,
  };
}

// Хук для общей статистики
export function useStatistics() {
  const { state } = useAppContext();

  const totalBalance = state.bankAccounts.data.reduce(
    (total, account) => total + (account.balance || 0), 
    0
  );

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyTransactions = state.transactions.data.filter(trans => {
    const transDate = new Date(trans.date);
    return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(trans => trans.type === 'income')
    .reduce((total, trans) => total + Math.abs(trans.amount), 0);

  const monthlyExpenses = monthlyTransactions
    .filter(trans => trans.type === 'expense')
    .reduce((total, trans) => total + Math.abs(trans.amount), 0);

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyBalance: monthlyIncome - monthlyExpenses,
    totalAccounts: state.bankAccounts.data.length,
    totalTransactions: state.transactions.data.length,
    totalPlans: state.plans.data.length,
    activePlans: state.plans.data.filter(plan => plan.isActive).length,
  };
} 