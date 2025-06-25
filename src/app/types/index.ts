export interface User {
  id: number;
  login: string;
  email: string;
}

export interface BankAccount {
  id?: string;
  name: string;
  balance: number;
}

export interface Transaction {
  id?: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  bankAccount?: string;
}

export interface Plan {
  id?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  isActive: boolean;
}

export interface AppState {
  // Пользователь
  user: {
    data: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
  };
  
  // Банковские счета
  bankAccounts: {
    data: BankAccount[];
    loading: boolean;
    error: string | null;
  };
  
  // Транзакции
  transactions: {
    data: Transaction[];
    loading: boolean;
    error: string | null;
  };
  
  // Планы
  plans: {
    data: Plan[];
    loading: boolean;
    error: string | null;
  };
  
  // UI состояние
  ui: {
    sidebarOpen: boolean;
    activeView: string;
  };
}

export type AppAction = 
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_USER_LOADING'; payload: boolean }
  | { type: 'SET_USER_ERROR'; payload: string | null }
  | { type: 'LOGOUT_USER' }
  
  | { type: 'SET_BANK_ACCOUNTS_LOADING'; payload: boolean }
  | { type: 'SET_BANK_ACCOUNTS_SUCCESS'; payload: BankAccount[] }
  | { type: 'SET_BANK_ACCOUNTS_ERROR'; payload: string | null }
  | { type: 'ADD_BANK_ACCOUNT'; payload: BankAccount }
  | { type: 'DELETE_BANK_ACCOUNT'; payload: string }
  | { type: 'UPDATE_BANK_ACCOUNT'; payload: BankAccount }
  
  | { type: 'SET_TRANSACTIONS_LOADING'; payload: boolean }
  | { type: 'SET_TRANSACTIONS_SUCCESS'; payload: Transaction[] }
  | { type: 'SET_TRANSACTIONS_ERROR'; payload: string | null }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  
  | { type: 'SET_PLANS_LOADING'; payload: boolean }
  | { type: 'SET_PLANS_SUCCESS'; payload: Plan[] }
  | { type: 'SET_PLANS_ERROR'; payload: string | null }
  | { type: 'ADD_PLAN'; payload: Plan }
  | { type: 'DELETE_PLAN'; payload: string }
  | { type: 'UPDATE_PLAN'; payload: Plan }
  
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_ACTIVE_VIEW'; payload: string }; 