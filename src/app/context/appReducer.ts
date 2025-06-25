import { AppState, AppAction } from '../types';

export const initialState: AppState = {
  user: {
    data: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  bankAccounts: {
    data: [],
    loading: false,
    error: null,
  },
  transactions: {
    data: [],
    loading: false,
    error: null,
  },
  plans: {
    data: [],
    loading: false,
    error: null,
  },
  ui: {
    sidebarOpen: false,
    activeView: 'dashboard',
  },
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // User actions
    case 'SET_USER':
      return {
        ...state,
        user: {
          ...state.user,
          data: action.payload,
          isAuthenticated: !!action.payload,
          loading: false,
          error: null,
        },
      };
    
    case 'SET_USER_LOADING':
      return {
        ...state,
        user: { ...state.user, loading: action.payload },
      };
    
    case 'SET_USER_ERROR':
      return {
        ...state,
        user: { ...state.user, error: action.payload, loading: false },
      };
    
    case 'LOGOUT_USER':
      return {
        ...initialState,
        ui: state.ui, // Сохраняем UI состояние
      };

    // Bank Accounts actions
    case 'SET_BANK_ACCOUNTS_LOADING':
      return {
        ...state,
        bankAccounts: { ...state.bankAccounts, loading: action.payload },
      };
    
    case 'SET_BANK_ACCOUNTS_SUCCESS':
      return {
        ...state,
        bankAccounts: {
          data: action.payload,
          loading: false,
          error: null,
        },
      };
    
    case 'SET_BANK_ACCOUNTS_ERROR':
      return {
        ...state,
        bankAccounts: {
          ...state.bankAccounts,
          error: action.payload,
          loading: false,
        },
      };
    
    case 'ADD_BANK_ACCOUNT':
      return {
        ...state,
        bankAccounts: {
          ...state.bankAccounts,
          data: [...state.bankAccounts.data, action.payload],
        },
      };
    
    case 'DELETE_BANK_ACCOUNT':
      return {
        ...state,
        bankAccounts: {
          ...state.bankAccounts,
          data: state.bankAccounts.data.filter(account => account.name !== action.payload),
        },
      };
    
    case 'UPDATE_BANK_ACCOUNT':
      return {
        ...state,
        bankAccounts: {
          ...state.bankAccounts,
          data: state.bankAccounts.data.map(account =>
            account.name === action.payload.name ? action.payload : account
          ),
        },
      };

    // Transactions actions
    case 'SET_TRANSACTIONS_LOADING':
      return {
        ...state,
        transactions: { ...state.transactions, loading: action.payload },
      };
    
    case 'SET_TRANSACTIONS_SUCCESS':
      return {
        ...state,
        transactions: {
          data: action.payload,
          loading: false,
          error: null,
        },
      };
    
    case 'SET_TRANSACTIONS_ERROR':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          error: action.payload,
          loading: false,
        },
      };
    
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          data: [...state.transactions.data, action.payload],
        },
      };
    
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          data: state.transactions.data.filter(trans => trans.id !== action.payload),
        },
      };

    // Plans actions
    case 'SET_PLANS_LOADING':
      return {
        ...state,
        plans: { ...state.plans, loading: action.payload },
      };
    
    case 'SET_PLANS_SUCCESS':
      return {
        ...state,
        plans: {
          data: action.payload,
          loading: false,
          error: null,
        },
      };
    
    case 'SET_PLANS_ERROR':
      return {
        ...state,
        plans: {
          ...state.plans,
          error: action.payload,
          loading: false,
        },
      };
    
    case 'ADD_PLAN':
      return {
        ...state,
        plans: {
          ...state.plans,
          data: [...state.plans.data, action.payload],
        },
      };
    
    case 'DELETE_PLAN':
      return {
        ...state,
        plans: {
          ...state.plans,
          data: state.plans.data.filter(plan => plan.id !== action.payload),
        },
      };
    
    case 'UPDATE_PLAN':
      return {
        ...state,
        plans: {
          ...state.plans,
          data: state.plans.data.map(plan =>
            plan.id === action.payload.id ? action.payload : plan
          ),
        },
      };

    // UI actions
    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        ui: { ...state.ui, sidebarOpen: action.payload },
      };
    
    case 'SET_ACTIVE_VIEW':
      return {
        ...state,
        ui: { ...state.ui, activeView: action.payload },
      };

    default:
      return state;
  }
} 