'use client'
import { useCallback, useEffect, useState, useRef } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useBankTransaction } from '../context/BankTransactionContext';
import Cookies from 'js-cookie';

export default function Operations() {
    const [show, setShow] = useState<boolean>(false);
    const [shouldAnimate, setShouldAnimate] = useState<boolean>(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [transactionType, setTransactionType] = useState<'loss' | 'gain'>('loss');
    const [monthSkip, setMonthSkip] = useState<number>(1);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [hasMoreTransactions, setHasMoreTransactions] = useState<boolean>(true);
    const { login } = useAuthContext();
    const { trans, setTrans, balance, setBalance, activeBank, currency } = useBankTransaction();
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (show && formRef.current && !formRef.current.contains(event.target as Node)) {
                setShow(false);
                setShouldAnimate(false);
            }
        };
        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [show]);
    
    const addTransaction = async (amount: any, category: any, date: any, type: any) => {
        try {
            const response = await fetch('/api/addTransRedis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    category,
                    date,
                    login,
                    balanceStatus: balance || 0,
                    type,
                    bankName: activeBank.name
                })
            });
    
            if (response.ok) {
                if(type === 'gain'){
                    setBalance(Number(balance) + Number(amount));
                    const balanceToken = Cookies.get(`bank_account_${login}`) || '0';
                    Cookies.set(`bank_account_${login}`, String(Number(balanceToken) + Number(amount)));
                } else {
                    setBalance(Number(balance) - Number(amount));
                    const balanceToken = Cookies.get(`bank_account_${login}`) || '0';
                    Cookies.set(`bank_account_${login}`, String(Number(balanceToken) - Number(amount)));
                }
    
                const transResponse = await fetch(`/api/getTransRedis?login=${login}&bankName=${activeBank.name}`);
                if (transResponse.ok) {
                    const data = await transResponse.json();
                    setTrans(data.value);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };
    
    const handleToggle = useCallback(() => {
        setShow(prev => !prev);
        setShouldAnimate(prev => !prev);
    }, []);
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const amount = formData.get('amount');
        const category = formData.get('category');
        const date = formData.get('date');
      
        if (amount && category && date && login) {
            addTransaction(amount, category, date, transactionType);
            setShow(false);
            setShouldAnimate(false);
        }
    };
    
    const delTransaction = async (id: any, amount: any, type: any, date: any) => { 
        try {
            const info = `${login}:${id}:${amount}:${balance}:${type}:${date}:${activeBank.name}`;
            const response = await fetch(`api/delTrans?info=${info}`, {
                method: 'DELETE'
            });
            
            if(response.ok){
                if(type === 'loss'){
                    setBalance(Number(balance) + Number(amount));
                } else {
                    setBalance(Number(balance) - Number(amount));
                }
                
                const updatedTrans: any = { ...trans };
                Object.keys(updatedTrans).forEach(monthKey => {
                    updatedTrans[monthKey] = updatedTrans[monthKey].filter((item: any) => item.id !== id);
                });
                setTrans(updatedTrans);
            }
        } catch(e) {
        }
    };
    
    const loadMoreTransactions = async () => {
        if (!login || !activeBank.name || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const nextSkip = monthSkip + 1;
            
            const response = await fetch(`/api/loadmoreTrans?login=${login}&bankName=${activeBank.name}&monthSkip=${nextSkip}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                const { monthKey, transactions } = data;
                
                if (transactions && transactions.length > 0) {
                    const updatedTrans: any = { ...trans };
                    updatedTrans[monthKey] = transactions;
                    setTrans(updatedTrans);
                    
                    setMonthSkip(nextSkip);
                } else {
                    setHasMoreTransactions(false);
                }
            } else if (response.status === 401) {
                // Токен истек
            }
        } catch (error) {
            console.error('Error loading more transactions:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };
    
    const formatMonthYear = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        }).format(num);
    };

    const getCurrencySymbol = () => {
        switch(currency) {
            case 'RUB': return '₽';
            case 'USD': return '$';
            case 'EUR': return '€';
            default: return currency;
        }
    };

    const getCategoryIcon = (category: string) => {
        const icons: { [key: string]: string } = {
            housing: '🏠',
            utilities: '💡',
            food: '🍽️',
            transport: '🚗',
            health: '🏥',
            clothing: '👕',
            personal_care: '🧴',
            entertainment: '🎬',
            travel: '✈️',
            hobbies: '🎨',
            communication: '📱',
            subscriptions: '📺',
            savings: '💳',
            investments: '📈',
            insurance: '🛡️',
            family: '👨‍👩‍👧‍👦',
            gifts: '🎁',
            charity: '❤️',
            education: '📚',
            taxes: '📋',
            other: '📦'
        };
        return icons[category] || '📦';
    };

    const renderTransactionsByMonth = () => {
        if (!trans || typeof trans !== 'object') {
            return (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-gray-400 text-lg">No transactions yet</p>
                    <p className="text-gray-500 text-sm mt-2">Start by adding your first transaction</p>
                </div>
            );
        }
        
        const sortedMonths = Object.keys(trans).sort((a, b) => b.localeCompare(a));
        if (sortedMonths.length === 0) {
            return (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-gray-400 text-lg">No transactions yet</p>
                    <p className="text-gray-500 text-sm mt-2">Start by adding your first transaction</p>
                </div>
            );
        }
        
        return sortedMonths.map(monthKey => {
            const monthTransactions = (trans as any)[monthKey];
            if (!monthTransactions || monthTransactions.length === 0) return null;
            
            const monthTotal = monthTransactions.reduce((sum: number, item: any) => {
                const amount = Number(item.numeralAmount || item.amount);
                return item.type === 'gain' ? sum + amount : sum - amount;
            }, 0);
            
            return (
                <div key={monthKey} className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">
                        📅 {formatMonthYear(monthKey)}
                    </h3>
                    
                    <div className="space-y-3">
                        {monthTransactions
                            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((item: any, index: number) => (
                                <div
                                    key={item.id || index}
                                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="text-2xl">
                                                {getCategoryIcon(item.category)}
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`text-lg font-bold ${
                                                        item.type === 'gain' ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                        {item.type === 'gain' ? '+' : '-'}{formatNumber(Number(item.numeralAmount || item.amount))} {getCurrencySymbol()}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        item.type === 'gain' 
                                                            ? 'bg-green-900 text-green-300' 
                                                            : 'bg-red-900 text-red-300'
                                                    }`}>
                                                        {item.type === 'gain' ? '💰 Income' : '💸 Expense'}
                                                    </span>
                                                </div>
                                                <div className="text-gray-300 capitalize font-medium">
                                                    {item.category.replace('_', ' ')}
                                                </div>
                                                <div className="text-gray-400 text-sm">
                                                    {new Date(item.date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => delTransaction(item.id, Number(item.numeralAmount || item.amount), item.type, item.date)}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete transaction"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            );
        });
    };
    
    return (
        <div className="min-h-screen bg-gray-900 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <div className="lg:col-span-3">
                        <div className="bg-gray-800 rounded-lg p-6">
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={handleToggle}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>Add Transaction</span>
                                </button>
                            </div>
                            
                            {renderTransactionsByMonth()}
                            
                            {trans && Object.keys(trans).length > 0 && hasMoreTransactions && (
                                <div className="flex justify-center mt-8">
                                    <button
                                        onClick={loadMoreTransactions}
                                        disabled={isLoadingMore}
                                        className={`px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 ${
                                            isLoadingMore 
                                                ? 'opacity-50 cursor-not-allowed' 
                                                : 'hover:shadow-lg'
                                        }`}
                                    >
                                        {isLoadingMore ? (
                                            <span className="flex items-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Loading...
                                            </span>
                                        ) : (
                                            'Load More Transactions'
                                        )}
                                    </button>
                                </div>
                            )}
                            
                            {trans && Object.keys(trans).length > 0 && !hasMoreTransactions && (
                                <div className="text-center mt-8">
                                    <p className="text-gray-400">All transactions loaded</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-bold text-white mb-4">📊 Quick Stats</h3>
                            <div className="space-y-4">
                                <div className="bg-gray-700 rounded-lg p-4">
                                    <div className="text-sm text-gray-400">Total Transactions</div>
                                    <div className="text-2xl font-bold text-white">
                                        {trans ? Object.values(trans).reduce((sum: number, monthTrans: any) => sum + monthTrans.length, 0) : 0}
                                    </div>
                                </div>
                                <div className="bg-gray-700 rounded-lg p-4">
                                    <div className="text-sm text-gray-400">Active Bank</div>
                                    <div className="text-lg font-semibold text-blue-400">
                                        {activeBank.name || 'No bank selected'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {show && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <form
                            ref={formRef}
                            onSubmit={handleSubmit}
                            className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Add Transaction</h3>
                                <button
                                    type="button"
                                    onClick={() => setShow(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Type</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setTransactionType('loss')}
                                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                                transactionType === 'loss'
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            💸 Expense
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTransactionType('gain')}
                                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                                transactionType === 'gain'
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            💰 Income
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="amount"
                                            placeholder="Enter amount..."
                                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                            step="0.01"
                                            min="0"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <span className="text-gray-400">{getCurrencySymbol()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                                    <select
                                        name="category"
                                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="housing">🏠 Housing</option>
                                        <option value="utilities">💡 Utilities</option>
                                        <option value="food">🍽️ Food</option>
                                        <option value="transport">🚗 Transport</option>
                                        <option value="health">🏥 Health</option>
                                        <option value="clothing">👕 Clothing</option>
                                        <option value="personal_care">🧴 Personal Care</option>
                                        <option value="entertainment">🎬 Entertainment</option>
                                        <option value="travel">✈️ Travel</option>
                                        <option value="hobbies">🎨 Hobbies</option>
                                        <option value="communication">📱 Communication</option>
                                        <option value="subscriptions">📺 Subscriptions</option>
                                        <option value="savings">💳 Savings</option>
                                        <option value="investments">📈 Investments</option>
                                        <option value="insurance">🛡️ Insurance</option>
                                        <option value="family">👨‍👩‍👧‍👦 Family</option>
                                        <option value="gifts">🎁 Gifts</option>
                                        <option value="charity">❤️ Charity</option>
                                        <option value="education">📚 Education</option>
                                        <option value="taxes">📋 Taxes</option>
                                        <option value="other">📦 Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                                >
                                    Add Transaction
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}