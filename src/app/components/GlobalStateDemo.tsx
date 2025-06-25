'use client';

import React, { useState } from 'react';
import { useAppContext } from '../context/BalanceContext';

export default function GlobalStateDemo() {
  const { state, dispatch } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);

  // Вычисляемые значения
  const totalBalance = state.bankAccounts.data.reduce(
    (total, account) => total + (account.balance || 0), 
    0
  );

  const monthlyTransactions = state.transactions.data.filter(trans => {
    const transDate = new Date(trans.date);
    const now = new Date();
    return transDate.getMonth() === now.getMonth() && transDate.getFullYear() === now.getFullYear();
  });

  const monthlyIncome = monthlyTransactions
    .filter(trans => trans.type === 'income')
    .reduce((total, trans) => total + Math.abs(trans.amount), 0);

  const monthlyExpenses = monthlyTransactions
    .filter(trans => trans.type === 'expense')
    .reduce((total, trans) => total + Math.abs(trans.amount), 0);

  // Функция для создания тестового счета
  const handleCreateTestAccount = async () => {
    if (!state.user.isAuthenticated || !state.user.data) {
      alert('Необходимо авторизоваться');
      return;
    }

    try {
      const response = await fetch('/api/addNewAccountRedis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          login: state.user.data.login,
          bankName: `Тестовый счет ${Date.now()}`,
          balance: Math.floor(Math.random() * 50000) + 10000,
        }),
      });

      if (response.ok) {
        const newAccount = {
          name: `Тестовый счет ${Date.now()}`,
          balance: Math.floor(Math.random() * 50000) + 10000,
          id: Date.now().toString()
        };
        dispatch({ type: 'ADD_BANK_ACCOUNT', payload: newAccount });
        alert('Тестовый счет создан!');
      } else {
        alert('Ошибка создания счета');
      }
    } catch (error) {
      console.error('Error creating test account:', error);
      alert('Ошибка сети');
    }
  };

  // Функция для создания тестовой транзакции
  const handleCreateTestTransaction = async () => {
    if (!state.user.isAuthenticated || !state.user.data) {
      alert('Необходимо авторизоваться');
      return;
    }

    if (state.bankAccounts.data.length === 0) {
      alert('Сначала создайте банковский счет');
      return;
    }

    const randomAccount = state.bankAccounts.data[Math.floor(Math.random() * state.bankAccounts.data.length)];
    const isExpense = Math.random() > 0.5;
    const amount = isExpense ? -(Math.floor(Math.random() * 5000) + 100) : Math.floor(Math.random() * 10000) + 500;

    try {
      const response = await fetch('/api/addTrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          login: state.user.data.login,
          amount: amount,
          description: isExpense ? 'Тестовый расход' : 'Тестовый доход',
          date: new Date().toISOString(),
          bankName: randomAccount.name,
        }),
      });

      if (response.ok) {
        const newTransaction = {
          amount: amount,
          description: isExpense ? 'Тестовый расход' : 'Тестовый доход',
          date: new Date().toISOString(),
          type: isExpense ? 'expense' as const : 'income' as const,
          bankAccount: randomAccount.name,
          id: Date.now().toString()
        };
        dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
        alert('Тестовая транзакция создана!');
      } else {
        alert('Ошибка создания транзакции');
      }
    } catch (error) {
      console.error('Error creating test transaction:', error);
      alert('Ошибка сети');
    }
  };

  if (!state.user.isAuthenticated) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <p>🔐 Авторизуйтесь для использования глобального состояния</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">📊 Глобальное состояние</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {isExpanded ? 'Скрыть' : 'Показать детали'}
        </button>
      </div>

      {/* Основная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-100 p-4 rounded-lg text-center">
          <h3 className="font-semibold text-blue-800">Общий баланс</h3>
          <p className="text-2xl font-bold text-blue-600">
            ₽{state.bankAccounts.loading ? '...' : totalBalance.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-green-100 p-4 rounded-lg text-center">
          <h3 className="font-semibold text-green-800">Доходы (месяц)</h3>
          <p className="text-2xl font-bold text-green-600">
            ₽{monthlyIncome.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-red-100 p-4 rounded-lg text-center">
          <h3 className="font-semibold text-red-800">Расходы (месяц)</h3>
          <p className="text-2xl font-bold text-red-600">
            ₽{monthlyExpenses.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-purple-100 p-4 rounded-lg text-center">
          <h3 className="font-semibold text-purple-800">Счетов</h3>
          <p className="text-2xl font-bold text-purple-600">
            {state.bankAccounts.data.length}
          </p>
        </div>
      </div>

      {/* Кнопки для тестирования */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={handleCreateTestAccount}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          disabled={state.bankAccounts.loading}
        >
          ➕ Создать тестовый счет
        </button>
        
        <button
          onClick={handleCreateTestTransaction}
          className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
          disabled={state.transactions.loading || state.bankAccounts.data.length === 0}
        >
          💸 Создать тестовую транзакцию
        </button>
      </div>

      {/* Детальная информация */}
      {isExpanded && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Банковские счета */}
            <div>
              <h3 className="text-lg font-semibold mb-3">🏦 Банковские счета</h3>
              {state.bankAccounts.loading ? (
                <p className="text-gray-500">Загрузка...</p>
              ) : state.bankAccounts.data.length === 0 ? (
                <p className="text-gray-500">Нет счетов</p>
              ) : (
                <div className="space-y-2">
                  {state.bankAccounts.data.map((account, index) => (
                    <div key={index} className="bg-gray-100 p-3 rounded flex justify-between">
                      <span className="font-medium">{account.name}</span>
                      <span className="text-green-600 font-bold">
                        ₽{account.balance?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Последние транзакции */}
            <div>
              <h3 className="text-lg font-semibold mb-3">📝 Последние транзакции</h3>
              {state.transactions.loading ? (
                <p className="text-gray-500">Загрузка...</p>
              ) : state.transactions.data.length === 0 ? (
                <p className="text-gray-500">Нет транзакций</p>
              ) : (
                <div className="space-y-2">
                  {state.transactions.data.slice(-5).map((transaction, index) => (
                    <div key={index} className="bg-gray-100 p-3 rounded flex justify-between">
                      <div>
                        <span className="font-medium">{transaction.description}</span>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : ''}₽{Math.abs(transaction.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Состояние загрузки и ошибки */}
          <div className="mt-4 space-y-2">
            {(state.bankAccounts.loading || state.transactions.loading || state.plans.loading) && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
                <p>⏳ Загрузка данных...</p>
              </div>
            )}
            
            {(state.bankAccounts.error || state.transactions.error || state.plans.error) && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                <p>❌ Ошибка: {state.bankAccounts.error || state.transactions.error || state.plans.error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 