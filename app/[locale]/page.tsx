'use client';
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useBankTransaction } from "../context/BankTransactionContext";
import { authFetch } from "../services/authFetch";
import { useError } from "../context/ErrorContext";
import { useUI } from "../context/UIContext";

export default function Main() {
  const t = useTranslations('Index');
  const { addError } = useError();
  const [showModal, setShowModal] = useState(false)
  const { analyticTransactions, setAnalyticTransactions, activeBank, balance, currency } = useBankTransaction();
  const {setModal} = useUI();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    type: 'loss'
  });
  useEffect(()=>{
    function closeModal(){
      setShowModal(false)
    }
    const payload = {closeModal}
    if(showModal){
      setModal({type: 'addTransaction', payload})
    }
  }, [showModal])

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const prevMonthDate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const prevMonthKey = prevMonthDate.toISOString().slice(0, 7);

  async function fetchMonthData(monthKey) {
    const [year, month] = monthKey.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    if (!activeBank?.id) return [];

    const response = await authFetch(
      `/api/transactions?bankId=${activeBank.id}&from=${startDate.toISOString()}&to=${endDate.toISOString()}`,
      {}
    );
    if (!response.ok) {
      addError({
        theme: 'redDark',
        name: 'loadErrorTitle',
        desc: 'loadErrorDesc',
      });
      return [];
    }
    const json = await response.json();
    return json?.data || [];  // извлекаем массив из data
  }

  async function loadAllData() {
    const [currentData, prevData] = await Promise.all([
      fetchMonthData(currentMonthKey),
      fetchMonthData(prevMonthKey)
    ]);

    setAnalyticTransactions(prev => ({
      ...prev,
      [currentMonthKey]: currentData,
      [prevMonthKey]: prevData
    }));
  }



  useEffect(() => {
    loadAllData();
  }, [activeBank]);

  const currentMonthTx = analyticTransactions[currentMonthKey] || [];
  const prevMonthTx = analyticTransactions[prevMonthKey] || [];

  const currentGains = currentMonthTx.filter(tx => tx.type === 'gain').reduce((sum, tx) => sum + tx.amount, 0);
  const currentLosses = currentMonthTx.filter(tx => tx.type === 'loss').reduce((sum, tx) => sum + tx.amount, 0);
  const prevGains = prevMonthTx.filter(tx => tx.type === 'gain').reduce((sum, tx) => sum + tx.amount, 0);
  const prevLosses = prevMonthTx.filter(tx => tx.type === 'loss').reduce((sum, tx) => sum + tx.amount, 0);

  const currentCount = currentMonthTx.length;
  const prevCount = prevMonthTx.length;

  const lastFiveTxs = [...currentMonthTx]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newTransaction.amount || isNaN(parseFloat(newTransaction.amount))) return;

    const payload = {
      bankId: activeBank.id,
      amount: parseFloat(newTransaction.amount),
      category: newTransaction.category,
      date: newTransaction.date,
      type: newTransaction.type
    };

    const response = await authFetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      addError({
        theme: 'redDark',
        name: 'addErrorTitle',
        desc: 'addErrorDesc',
      });
      return;
    }

    setShowAddModal(false);
    setNewTransaction({ amount: '', category: 'food', date: new Date().toISOString().split('T')[0], type: 'loss' });
    loadAllData();
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();
  const formatCurrency = (amount) => `${amount.toFixed(2)} ${currency || ''}`;

  const categoryOptions = ['food', 'housing', 'transport', 'entertainment', 'salary', 'investment', 'other'];

  const expenseCategoryTotals: Record<string, number> = {};
  currentMonthTx
    .filter(tx => tx.type === 'loss')
    .forEach(tx => {
      expenseCategoryTotals[tx.category] = (expenseCategoryTotals[tx.category] || 0) + tx.amount;
    });

  const expenseCategoryPercentages = Object.entries(expenseCategoryTotals)
    .map(([category, amount]) => ({
      name: category,
      amount,
      percent: currentLosses > 0 ? (amount / currentLosses) * 100 : 0,
    }))
    .sort((a, b) => b.percent - a.percent);
return (
  <div className="min-h-screen bg-[#050816] text-white overflow-x-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_35%)] pointer-events-none" />

    <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-6">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101827] to-[#0b1220] p-8 shadow-2xl backdrop-blur-xl">

        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-gray-400">
                Active account
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight">
              {activeBank?.name || t('noBank')}
            </h1>

            <div className="flex flex-wrap gap-6 text-sm text-gray-400">

              <div className="space-y-1">
                <p>{t('balance')}</p>
                <p className="text-2xl font-semibold text-white">
                  {formatCurrency(balance)}
                </p>
              </div>

              <div className="space-y-1">
                <p>{t('currency')}</p>
                <p className="text-xl font-semibold text-blue-300">
                  {currency}
                </p>
              </div>

            </div>
          </div>

          {/* QUICK STATUS */}
          <div className="flex flex-col gap-3 min-w-[240px]">

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 backdrop-blur-md">
              <p className="text-sm text-emerald-300">
                Monthly income
              </p>
              <p className="text-2xl font-bold text-emerald-400">
                +{formatCurrency(currentGains)}
              </p>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 backdrop-blur-md">
              <p className="text-sm text-red-300">
                Monthly expenses
              </p>
              <p className="text-2xl font-bold text-red-400">
                -{formatCurrency(currentLosses)}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT SIDE */}
        <div className="xl:col-span-2 space-y-6">

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* CURRENT */}
            <div className="group rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-xl hover:border-blue-400/30 transition-all duration-300 hover:-translate-y-1">

              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-400">
                    {t('currentMonth')}
                  </p>
                  <h2 className="text-2xl font-bold mt-1">
                    Overview
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <div className="w-3 h-3 rounded-full bg-blue-400" />
                </div>
              </div>

              <div className="space-y-4">

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">
                    {t('transactionsCount')}
                  </span>

                  <span className="text-xl font-semibold text-white">
                    {currentCount}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">
                    {t('gains')}
                  </span>

                  <span className="text-xl font-semibold text-emerald-400">
                    +{formatCurrency(currentGains)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">
                    {t('losses')}
                  </span>

                  <span className="text-xl font-semibold text-red-400">
                    -{formatCurrency(currentLosses)}
                  </span>
                </div>

              </div>
            </div>

            {/* PREVIOUS */}
            <div className="group rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-xl hover:border-purple-400/30 transition-all duration-300 hover:-translate-y-1">

              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-400">
                    {t('previousMonth')}
                  </p>
                  <h2 className="text-2xl font-bold mt-1">
                    Analytics
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <div className="w-3 h-3 rounded-full bg-purple-400" />
                </div>
              </div>

              <div className="space-y-4">

                <div className="flex justify-between">
                  <span className="text-gray-400">
                    {t('transactionsCount')}
                  </span>

                  <span className="font-semibold text-white">
                    {prevCount}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">
                    {t('gains')}
                  </span>

                  <span className="font-semibold text-emerald-400">
                    +{formatCurrency(prevGains)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">
                    {t('losses')}
                  </span>

                  <span className="font-semibold text-red-400">
                    -{formatCurrency(prevLosses)}
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* COMPARISON */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#111827] to-[#0f172a] p-6 shadow-xl backdrop-blur-xl">

            <div className="flex items-center justify-between mb-6">

              <div>
                <p className="text-sm text-gray-400">
                  {t('monthlyComparison')}
                </p>

                <h2 className="text-2xl font-bold mt-1">
                  Financial changes
                </h2>
              </div>

              <div className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
                Live analytics
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div className="rounded-2xl bg-white/[0.03] p-4 border border-white/5">
                <p className="text-gray-400 text-sm mb-2">
                  {t('transactionsDelta')}
                </p>

                <p className="text-2xl font-bold text-blue-300">
                  {currentCount - prevCount >= 0 ? '+' : ''}
                  {currentCount - prevCount}
                </p>
              </div>

              <div className="rounded-2xl bg-white/[0.03] p-4 border border-white/5">
                <p className="text-gray-400 text-sm mb-2">
                  {t('gainsVsPrev')}
                </p>

                <p className="text-2xl font-bold text-emerald-400">
                  {currentGains - prevGains >= 0 ? '+' : ''}
                  {formatCurrency(currentGains - prevGains)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/[0.03] p-4 border border-white/5">
                <p className="text-gray-400 text-sm mb-2">
                  {t('lossesVsPrev')}
                </p>

                <p className="text-2xl font-bold text-orange-300">
                  {currentLosses - prevLosses >= 0 ? '+' : ''}
                  {formatCurrency(currentLosses - prevLosses)}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">

          {/* BREAKDOWN */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-xl">

            <div className="mb-6">
              <p className="text-sm text-gray-400">
                Spending categories
              </p>

              <h2 className="text-2xl font-bold mt-1">
                {t('expenseBreakdown')}
              </h2>
            </div>

            {currentLosses > 0 ? (
              <div className="space-y-4">

                {expenseCategoryPercentages.map((cat) => (
                  <div key={cat.name}>

                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300 capitalize">
                        {cat.name}
                      </span>

                      <span className="text-gray-400">
                        {cat.percent.toFixed(1)}%
                      </span>
                    </div>

                    <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 shadow-lg shadow-red-500/20"
                        style={{ width: `${cat.percent}%` }}
                      />
                    </div>

                  </div>
                ))}

              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('noExpensesThisMonth')}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* TRANSACTIONS */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#101827] to-[#0b1220] p-6 shadow-2xl backdrop-blur-xl">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <div>
            <p className="text-sm text-gray-400">
              Activity
            </p>

            <h2 className="text-3xl font-bold mt-1">
              {t('lastTransactions')}
            </h2>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="group bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all duration-200 text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-blue-500/20"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>

            {t('addTransaction')}
          </button>
        </div>

        {lastFiveTxs.length > 0 ? (
          <div className="space-y-3">

            {lastFiveTxs.map((tx, idx) => (
              <div
                key={tx.id || tx._id || idx}
                className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-300"
              >

                <div className="flex items-center gap-4">

                  <div className={`w-3 h-3 rounded-full shadow-lg ${tx.type === 'gain'
                    ? 'bg-emerald-400 shadow-emerald-400/40'
                    : 'bg-red-400 shadow-red-400/40'
                    }`}
                  />

                  <div>
                    <p className="font-semibold capitalize text-white">
                      {tx.category}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(tx.date)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-lg font-bold ${tx.type === 'gain'
                    ? 'text-emerald-400'
                    : 'text-red-400'
                    }`}
                  >
                    {tx.type === 'gain' ? '+' : '-'}
                    {formatCurrency(Math.abs(tx.amount))}
                  </p>
                </div>

              </div>
            ))}

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center">

            <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>

            <p className="text-lg text-gray-300">
              {t('noTransactions')}
            </p>

            <p className="text-sm text-gray-500 mt-2">
              Start by adding your first transaction
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);
}