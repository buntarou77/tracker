// Экспорт основного контекста
export { useAppContext, AppProvider } from '../context/BalanceContext';

// Экспорт существующего хука авторизации
export { useAuth } from './useAuth';

// Простые хуки для быстрого доступа к данным
export const useGlobalUser = () => {
  const { useAppContext } = require('../context/BalanceContext');
  const { state } = useAppContext();
  return {
    user: state.user.data,
    isAuthenticated: state.user.isAuthenticated,
    loading: state.user.loading,
    error: state.user.error,
  };
};

export const useGlobalBankAccounts = () => {
  const { useAppContext } = require('../context/BalanceContext');
  const { state } = useAppContext();
  
  const totalBalance = state.bankAccounts.data.reduce(
    (total: number, account: any) => total + (account.balance || 0), 
    0
  );
  
  return {
    accounts: state.bankAccounts.data,
    loading: state.bankAccounts.loading,
    error: state.bankAccounts.error,
    totalBalance,
  };
};

export const useGlobalTransactions = () => {
  const { useAppContext } = require('../context/BalanceContext');
  const { state } = useAppContext();
  
  return {
    transactions: state.transactions.data,
    loading: state.transactions.loading,
    error: state.transactions.error,
  };
};

export const useGlobalStatistics = () => {
  const { useAppContext } = require('../context/BalanceContext');
  const { state } = useAppContext();
  
  const totalBalance = state.bankAccounts.data.reduce(
    (total: number, account: any) => total + (account.balance || 0), 
    0
  );
  
  return {
    totalBalance,
    totalAccounts: state.bankAccounts.data.length,
    totalTransactions: state.transactions.data.length,
    totalPlans: state.plans.data.length,
  };
}; 