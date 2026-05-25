'use client';

interface CacheConfig {
  key: string;
  ttl: number;
}

interface CacheData<T> {
  data: T;
  timestamp: number;
}

const CACHE_CONFIGS = {
  AUTH: {
    key: 'auth_cache',
    ttl: 24 * 60 * 60 * 1000,
  },

  BANKS: {
    key: 'banks_cache',
    ttl: 7 * 24 * 60 * 60 * 1000,
  },

  ACTIVE_BANK: {
    key: 'active_bank_cache',
    ttl: 30 * 24 * 60 * 60 * 1000,
  },

  TRANSACTIONS: {
    key: 'transactions_cache',
    ttl: 2 * 24 * 60 * 60 * 1000,
  },

  BALANCE: {
    key: 'balance_cache',
    ttl: 60 * 60 * 1000,
  },

  CURRENCY: {
    key: 'currency_cache',
    ttl: 7 * 24 * 60 * 60 * 1000,
  },

  EXCHANGE_RATES: {
    key: 'exchange_rates_cache',
    ttl: 60 * 60 * 1000,
  },

  ANALYTIC_TRANSACTIONS: {
    key: 'analytic_transactions_cache',
    ttl: 7 * 24 * 60 * 60 * 1000,
  },

  PLANS: {
    key: 'plans_cache',
    ttl: 5 * 24 * 60 * 60 * 1000,
  },

  ACTIVE_PLANS: {
    key: 'active_plans_cache',
    ttl: 5 * 24 * 60 * 60 * 1000,
  },

  ACTIVE_PLANS_STATUS: {
    key: 'active_plans_status_cache',
    ttl: 5 * 24 * 60 * 60 * 1000,
  },

  ACTIVE_MONTH_PLAN: {
    key: 'active_month_plan_cache',
    ttl: 24 * 60 * 60 * 1000,
  },
} as const;

export class CacheService {
  static get<T>(config: CacheConfig): T | null {
    try {
      if (typeof window === 'undefined') return null;

      const cached = localStorage.getItem(config.key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached) as CacheData<T>;
      const isExpired = Date.now() - timestamp > config.ttl;

      if (isExpired) {
        localStorage.removeItem(config.key);
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  static set<T>(config: CacheConfig, data: T): void {
    try {
      if (typeof window === 'undefined') return;

      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(config.key, JSON.stringify(cacheData));
    } catch (error) {
    }
  }

  static isTTLExpired(config: CacheConfig): boolean {
    try {
      if (typeof window === 'undefined') return true;

      const cached = localStorage.getItem(config.key);
      if (!cached) return true;

      const { timestamp } = JSON.parse(cached) as CacheData<any>;
      const isExpired = Date.now() - timestamp > config.ttl;

      return isExpired;
    } catch (error) {
      return true;
    }
  }

  static clear(config: CacheConfig): void {
    try {
      if (typeof window === 'undefined') return;

      localStorage.removeItem(config.key);
    } catch (error) {
    }
  }

  static clearAll(configs: Record<string, CacheConfig>): void {
    try {
      if (typeof window === 'undefined') return;

      Object.values(configs).forEach(config => {
        this.clear(config);
      });
    } catch (error) {
    }
  }

  static getTimeLeft(config: CacheConfig): number | null {
    try {
      if (typeof window === 'undefined') return null;

      const cached = localStorage.getItem(config.key);
      if (!cached) return null;

      const { timestamp } = JSON.parse(cached) as CacheData<any>;
      const remaining = config.ttl - (Date.now() - timestamp);

      return remaining > 0 ? remaining : null;
    } catch (error) {
      return null;
    }
  }

  static getExpiryTime(config: CacheConfig): Date | null {
    try {
      if (typeof window === 'undefined') return null;

      const cached = localStorage.getItem(config.key);
      if (!cached) return null;

      const { timestamp } = JSON.parse(cached);
      return new Date(timestamp + config.ttl);
    } catch (error) {
      return null;
    }
  }

  static exists(config: CacheConfig): boolean {
    try {
      if (typeof window === 'undefined') return false;

      const cached = localStorage.getItem(config.key);
      if (!cached) return false;

      const { timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > config.ttl;

      return !isExpired;
    } catch (error) {
      return false;
    }
  }

  static getAll(): Record<string, any> {
    try {
      if (typeof window === 'undefined') return {};

      const result: Record<string, any> = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('_cache')) {
          const value = localStorage.getItem(key);
          if (value) {
            result[key] = JSON.parse(value);
          }
        }
      }

      return result;
    } catch (error) {
      return {};
    }
  }

  static printDebugInfo(): void {
  }
}

export { CACHE_CONFIGS };