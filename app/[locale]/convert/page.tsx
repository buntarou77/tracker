'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useBankTransaction } from '../../context/BankTransactionContext';
import { useAuth } from '../../hooks/useAuth';
import { sendEvent } from '../../services/broadcastChannel';
import { authFetch } from '../../services/authFetch';

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
}

interface ConversionHistory {
  id: string;
  from: string;
  to: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  timestamp: string;
}

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' }
];

const exchangeRateCache: Record<string, { rates: Record<string, number>; timestamp: number }> = {};

const fetchExchangeRates = async (baseCurrency: string): Promise<{ rates: Record<string, number>, nextTimeUpdate?: string } | null> => {
  try {
    const cached = exchangeRateCache[baseCurrency];
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
      return { rates: cached.rates };
    }

    console.log('[convert/page] ExchangeRates: запрос начат, base currency:', baseCurrency);
    const response = await authFetch(`/api/getExchangeRate?base=${baseCurrency}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[convert/page] ExchangeRates: ответ получен', data);

    if (data.result === 'success') {
      exchangeRateCache[baseCurrency] = {
        rates: data.rates,
        timestamp: Date.now()
      };
      return { rates: data.rates, nextTimeUpdate: data.time_next_update_utc };
    } else {
      throw new Error(`API error: ${data['error-type']}`);
    }
  } catch (error) {
    return null;
  }
};

export default function ConvertPage() {
  const t = useTranslations('convert'); 
  const err = useTranslations('convertErrors');

  const { currency, balance, exchangeRates, setExchangeRates, activeBank } = useBankTransaction();
  const { user } = useAuth();
  const isInitializedRef = useRef(false)
  const [fromCurrency, setFromCurrency] = useState(currency);
  const [toCurrency, setToCurrency] = useState('EUR');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [conversionHistory, setConversionHistory] = useState<ConversionHistory[]>([]);
  const [favoriteRates, setFavoriteRates] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [nextTimeUpdateRates, setNextTimeUpdateRates] = useState<string>('')

  const [budgetPercentage, setBudgetPercentage] = useState(50);
  const [budgetFromCurrency, setBudgetFromCurrency] = useState(currency || 'USD');
  const [budgetToCurrency, setBudgetToCurrency] = useState('EUR');
  const [budgetExchangeRate, setBudgetExchangeRate] = useState<number>(0);

  const calculateRate = (from: string, to: string): number => {
    if (exchangeRates[from]?.[to]) {
      return exchangeRates[from][to];
    }
    
    const baseCurrency = Object.keys(exchangeRates)[0];
    if (baseCurrency && exchangeRates[baseCurrency]?.[from] && exchangeRates[baseCurrency]?.[to]) {
      return exchangeRates[baseCurrency][to] / exchangeRates[baseCurrency][from];
    }
    
    return 0;
  };

  useEffect(()=>{
    if(!isInitializedRef.current && currency){
      setFromCurrency(currency)
      isInitializedRef.current = true
    }
  }, [currency])

  useEffect(()=>{
    console.log('START WATCH FROM CURRENCY: ' + fromCurrency)
  }, [fromCurrency])
  useEffect(()=>{
        console.log('START WATCH CURRENCY: ' + currency)
  }, [currency])
  useEffect(() => {
    const savedHistory = localStorage.getItem('conversionHistory'); 
    if (savedHistory) {
      setConversionHistory(JSON.parse(savedHistory));
    }

    const savedFavorites = localStorage.getItem('favoriteRates');
    if (savedFavorites) {
      setFavoriteRates(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    console.log(9)
    console.log(currency)
    console.log(fromCurrency, toCurrency)
    if (fromCurrency && toCurrency) {
      console.log(1)
      const getRate = async () => {
        setIsLoadingRates(true);
        
        if (exchangeRates[fromCurrency]?.[toCurrency]) {
          console.log('USING CACHE');
          setExchangeRate(exchangeRates[fromCurrency][toCurrency]);
          setIsLoadingRates(false);
          return;
        }
        
        const newExchangeRate = calculateRate(fromCurrency, toCurrency);
        if (newExchangeRate > 0) {
          setExchangeRate(newExchangeRate);
          const updatedRates = {
            ...exchangeRates,
            [fromCurrency]: {
              ...exchangeRates[fromCurrency],
              [toCurrency]: newExchangeRate
            }
          };
          setExchangeRates(updatedRates);
          sendEvent({ type: 'SYNC_EXCHANGE_RATES', payload: updatedRates });
        }
        
        setLastUpdated(new Date().toLocaleString('en-US'));
        setIsLoadingRates(false);
      };

      getRate();
    }
  }, [fromCurrency, toCurrency, exchangeRates]);

  useEffect(() => {
    if (budgetFromCurrency && budgetToCurrency) {
      const rate = calculateRate(budgetFromCurrency, budgetToCurrency);
      if (rate > 0) {
        setBudgetExchangeRate(rate);
      }
    }
  }, [budgetFromCurrency, budgetToCurrency, exchangeRates]);

  useEffect(() => {
    if (currency) {
      setBudgetFromCurrency(currency);
    }
  }, [currency]);

  useEffect(() => {
    if(!currency){
      return 
    }
    const preloadRates = async () => {
      if(!exchangeRates[currency]){
        const result = await fetchExchangeRates(currency);
        if (result) {
          const updatedRates = {
            ...exchangeRates,
            [currency]: result.rates
          };
          setExchangeRates(updatedRates);
          sendEvent({ type: 'SYNC_EXCHANGE_RATES', payload: updatedRates });
          setNextTimeUpdateRates(result.nextTimeUpdate || '')
        }
      }
    }
    preloadRates();
  }, [currency]);
  
  useEffect(() => {
    if (fromAmount && exchangeRate) {
      const amount = parseFloat(fromAmount);
      if (!isNaN(amount)) {
        const converted = (amount * exchangeRate).toFixed(6);
        setToAmount(converted);
      }
    } else {
      setToAmount('');
    }
  }, [fromAmount, exchangeRate]);

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
  };

  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    if (value && exchangeRate) {
      const amount = parseFloat(value);
      if (!isNaN(amount)) {
        const converted = (amount / exchangeRate).toFixed(6);
        setFromAmount(converted);
      }
    }
  };

  const swapCurrencies = () => {
    const tempCurrency = fromCurrency;
    const tempAmount = fromAmount;
    console.log(toCurrency)
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const addToHistory = () => {
    if (!fromAmount || !toAmount) return;

    const conversion: ConversionHistory = {
      id: Date.now().toString(),
      from: fromCurrency,
      to: toCurrency,
      fromAmount: parseFloat(fromAmount),
      toAmount: parseFloat(toAmount),
      rate: exchangeRate,
      timestamp: new Date().toISOString()
    };

    const newHistory = [conversion, ...conversionHistory.slice(0, 9)];
    setConversionHistory(newHistory);
    localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
  };

  const toggleFavoriteRate = (pair: string) => {
    const newFavorites = favoriteRates.includes(pair)
      ? favoriteRates.filter(f => f !== pair)
      : [...favoriteRates, pair];
    
    setFavoriteRates(newFavorites);
    localStorage.setItem('favoriteRates', JSON.stringify(newFavorites));
  };

  const clearHistory = () => {
    setConversionHistory([]);
    localStorage.removeItem('conversionHistory');
  };

  const getCurrentCurrencyInfo = (code: string) => {
    return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 6 
    }).format(num);
  };

  const getBudgetAmount = () => {
    return (balance * budgetPercentage) / 100;
  };

  const getConvertedBudgetAmount = () => {
    return getBudgetAmount() * budgetExchangeRate;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
            <p className="text-gray-400">{t('subtitle')}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">{t('yourBalance')}</div>
            <div className="text-xl font-bold text-green-400">
              {formatNumber(balance)} {currency}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-r from-purple-800 to-blue-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-6">{t('budgetConverter')}</h2>
              <p className="text-gray-300 text-sm mb-4">{t('budgetDescription')}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('budgetPercentage', { percentage: budgetPercentage })}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={budgetPercentage}
                    onChange={(e) => setBudgetPercentage(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('convertTo')}</label>
                  <select
                    value={budgetToCurrency}
                    onChange={(e) => setBudgetToCurrency(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {CURRENCIES.filter(curr => curr.code !== budgetFromCurrency).map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.flag} {curr.code} - {curr.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-400">{t('amountToConvert')}</div>
                    <div className="text-xl font-bold text-white">
                      {formatNumber(getBudgetAmount())} {budgetFromCurrency}
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-purple-400 text-2xl">→</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">{t('convertedAmount')}</div>
                    <div className="text-xl font-bold text-purple-400">
                      {formatNumber(getConvertedBudgetAmount())} {budgetToCurrency}
                    </div>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <div className="text-sm text-gray-400">
                    {isLoadingRates ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400"></div>
                        <span>{t('loadingExchangeRate')}</span>
                      </div>
                    ) : (
                      t('exchangeRateValue', {
                        from: budgetFromCurrency,
                        rate: formatNumber(budgetExchangeRate),
                        to: budgetToCurrency
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-6">{t('currencyConverter')}</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('from')}</label>
                <div className="flex gap-4">
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.flag} {curr.code} - {curr.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => handleFromAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <button
                  onClick={swapCurrencies}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors"
                  title={t('swapCurrencies')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('to')}</label>
                <div className="flex gap-4">
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.flag} {curr.code} - {curr.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={toAmount}
                    onChange={(e) => handleToAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-400">{t('exchangeRate')}</div>
                    <div className="text-lg font-semibold text-white">
                      {isLoadingRates ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                          <span>{t('loadingRates')}</span>
                        </div>
                      ) : (
                        t('exchangeRateValue', {
                          from: fromCurrency,
                          rate: formatNumber(exchangeRate),
                          to: toCurrency
                        })
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{t('updated')}</div>
                    <div className="text-sm text-gray-300">
                      {isLoadingRates ? t('updating') : lastUpdated}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => toggleFavoriteRate(`${fromCurrency}/${toCurrency}`)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      favoriteRates.includes(`${fromCurrency}/${toCurrency}`)
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {favoriteRates.includes(`${fromCurrency}/${toCurrency}`) ? t('favorited') : t('addToFavorites')}
                  </button>
                  <button
                    onClick={async () => {
                      if(new Date() < new Date(nextTimeUpdateRates)){
                        alert(err('ratesActual'));
                        return;
                      } else {
                        setIsLoadingRates(true);
                        delete exchangeRateCache[fromCurrency];
                        const result = await fetchExchangeRates(fromCurrency);
                        if (result && result.rates[toCurrency]) {
                          setExchangeRate(result.rates[toCurrency]);
                          const updatedRates = {
                            ...exchangeRates,
                            [fromCurrency]: result.rates
                          };
                          setExchangeRates(updatedRates);
                          sendEvent({ type: 'SYNC_EXCHANGE_RATES', payload: updatedRates });
                          setLastUpdated(new Date().toLocaleString('en-US'));
                          if (result.nextTimeUpdate) {
                            setNextTimeUpdateRates(result.nextTimeUpdate);
                          }
                        }
                        setIsLoadingRates(false);
                      }
                    }}
                    disabled={isLoadingRates}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                  >
                    {isLoadingRates ? '🔄' : `🔄 ${t('refresh')}`}
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={addToHistory}
                  disabled={!fromAmount || !toAmount}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {t('saveToHistory')}
                </button>
                <button
                  onClick={() => {
                    setFromAmount('');
                    setToAmount('');
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {t('clear')}
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">{t('popularExchangeRates')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['USD/EUR', 'USD/RUB', 'EUR/RUB', 'GBP/USD', 'USD/JPY', 'EUR/GBP'].map((pair) => {
                  const [from, to] = pair.split('/');
                  const fromInfo = getCurrentCurrencyInfo(from);
                  const toInfo = getCurrentCurrencyInfo(to);
                  const rate = calculateRate(from, to);
                  
                  return (
                    <div
                      key={pair}
                      onClick={() => {
                        setFromCurrency(from);
                        setToCurrency(to);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-white font-medium">
                            {fromInfo.flag} {from} → {toInfo.flag} {to}
                          </div>
                          <div className="text-xl font-bold text-blue-400">
                            {rate === 0 && isLoadingRates ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                            ) : rate === 0 ? (
                              t('loading')
                            ) : (
                              formatNumber(rate)
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">{t('per1', { from })}</div>
                          <div className="text-sm font-medium text-green-400">
                            +0.12%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {favoriteRates.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">{t('favoriteRates')}</h3>
                <div className="space-y-3">
                  {favoriteRates.map((pair) => {
                    const [from, to] = pair.split('/');
                    const rate = calculateRate(from, to) || 0;
                    const fromInfo = getCurrentCurrencyInfo(from);
                    const toInfo = getCurrentCurrencyInfo(to);
                    
                    return (
                      <div
                        key={pair}
                        onClick={() => {
                          setFromCurrency(from);
                          setToCurrency(to);
                        }}
                        className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-white text-sm">
                            {fromInfo.flag} {from}/{to} {toInfo.flag}
                          </div>
                          <div className="text-blue-400 font-semibold">
                            {rate === 0 ? t('loading') : formatNumber(rate)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">{t('conversionHistory')}</h3>
                {conversionHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    {t('clearHistory')}
                  </button>
                )}
              </div>
              
              {conversionHistory.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {conversionHistory.map((conversion) => {
                    const fromInfo = getCurrentCurrencyInfo(conversion.from);
                    const toInfo = getCurrentCurrencyInfo(conversion.to);
                    const date = new Date(conversion.timestamp).toLocaleDateString('en-US');
                    const time = new Date(conversion.timestamp).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                    
                    return (
                      <div key={conversion.id} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-white text-sm">
                            {fromInfo.flag} {formatNumber(conversion.fromAmount)} {conversion.from}
                          </div>
                          <div className="text-xs text-gray-400">
                            {date} {time}
                          </div>
                        </div>
                        <div className="text-center text-gray-400 text-xs mb-2">↓</div>
                        <div className="flex justify-between items-center">
                          <div className="text-blue-400 text-sm">
                            {toInfo.flag} {formatNumber(conversion.toAmount)} {conversion.to}
                          </div>
                          <div className="text-xs text-gray-400">
                            @ {formatNumber(conversion.rate)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-sm">{t('historyEmpty')}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('historyEmptyHint')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}