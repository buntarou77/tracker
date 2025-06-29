'use client'
import { useCallback, useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Cookies from 'js-cookie';

export default function Operations() {
    const [show, setShow] = useState<boolean>(false);
    const [shouldAnimate, setShouldAnimate] = useState<boolean>(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [transactionType, setTransactionType] = useState<'loss' | 'gain'>('loss');
    const [monthSkip, setMonthSkip] = useState<number>(1);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [hasMoreTransactions, setHasMoreTransactions] = useState<boolean>(true);
    const { trans, setTrans, balance, setBalance, activeBank, login, currency} = useApp();
    
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
            const response = await fetch('/api/addTrans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    category,
                    date,
                    login,
                    balance: balance || 0,
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
        }
    };
    
    const delTransaction = async (id: any, amount: any, type: any, date: any) => { 
        try {
            const info = `${login}:${id}:${amount}:${balance}:${type}:${date}:${activeBank.name}`;
            const response = await fetch(`api/delTransRedis?info=${info}`, {
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
            console.log(e);
        }
    };
    
    const loadMoreTransactions = async () => {
        console.log('start load')
        if (!login || !activeBank.name || isLoadingMore) return;
        console.log('start load 2')
        setIsLoadingMore(true);
        try {
            const nextSkip = monthSkip + 1;
            
            
            const response = await fetch(`/api/loadmoreTrans?login=${login}&bankName=${activeBank.name}&monthSkip=${nextSkip}`, {
                credentials: 'include' // Важно для передачи cookies с токенами
            });
            console.log('start load 3')
            if (response.ok) {

                const data = await response.json();
                const { monthKey, transactions } = data;
                
                if (transactions && transactions.length > 0) {
                    console.log('start load 4')
                    const updatedTrans: any = { ...trans };
                    updatedTrans[monthKey] = transactions;
                    console.log(updatedTrans)
                    setTrans(updatedTrans);
                    
                    setMonthSkip(nextSkip);
                } else {
                    setHasMoreTransactions(false);
                }
            } else if (response.status === 401) {
                // Токен истек, можно показать сообщение или перенаправить
                console.log('Authentication required');
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

    const renderTransactionsByMonth = () => {
        if (!trans || typeof trans !== 'object') {
            return <p className='flex flex-col items-center'>You haven't added any transactions yet</p>;
        }
        
        const sortedMonths = Object.keys(trans).sort((a, b) => b.localeCompare(a));
        if (sortedMonths.length === 0) {
            return <p className='flex flex-col items-center'>You haven't added any transactions yet</p>;
        }
        
        return sortedMonths.map(monthKey => {
            const monthTransactions = (trans as any)[monthKey];
            if (!monthTransactions || monthTransactions.length === 0) return null;
            
            return (
                <div key={monthKey} className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 border-b border-gray-600 pb-2">
                        {formatMonthYear(monthKey)}
                    </h3>
                    {monthTransactions
                        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((item: any, index: number) => (
                            <div
                                key={item.id || index}
                                className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-[8px] p-[12px] mb-[10px] border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                        {item.numeralAmount || item.amount} {currency === "RUB" ? "₽" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency}
                                    </span>
                                </div>
                                <div className="flex flex-col text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Category:</span>
                                    <span className="capitalize text-gray-800 dark:text-gray-200">{item.category}</span>
                                </div>
                                <div className="flex flex-col text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Type:</span>
                                    <span className={`${item.type === 'gain' ? '!text-[green]' : '!text-[gray]'}`}>
                                        {item.type === 'gain' ? 'Income' : 'Expense'}
                                    </span>
                                </div>
                                <div className="flex flex-col text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Date:</span>
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {new Date(item.date).toLocaleDateString('en-US')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => delTransaction(item.id, Number(item.numeralAmount || item.amount), item.type, item.date)}
                                    className="ml-4 px-[10px] py-[5px] text-red-500 border border-red-500 rounded-[6px] cursor-pointer hover:bg-[orange] hover:text-white text-sm transition"
                                >
                                    Delete
                                </button>
                            </div>
                        ))
                    }
                </div>
            );
        });
    };
    
    return (
        <div className="w-[1200px] m-auto p-[40px] input">
            <div className="flex flex-col items-center text-center space-y-[10px] mb-[40px]">
                <h2 className="text-[24px] font-bold text-white">
                    Welcome to your personal finance tracker!
                </h2>
                <h3 className="text-[16px] text-gray-300">
                    Start adding financial transactions and track your budget distribution.
                </h3>
            </div>
            <div className="w-full border border-white rounded-[5px] p-[20px] bg-[#1e1e1e] shadow-[0_0_20px_rgba(255,255,255,0.1)] relative">
                <div className="mb-[20px] flex flex-row gap-[20px]">
                    <button
                        onClick={handleToggle}
                        className="h-[40px] w-[40px] flex items-center justify-center text-[24px] font-bold bg-[#0a0a0a] text-[white] border-2 border-[#777777] rounded-[10px] hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-shadow duration-300 cursor-pointer"
                    >
                        +
                    </button>
                    <p className="text-white">
                        Your balance: {balance} {currency === "RUB" ? "₽" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency}
                    </p>
                    <form
                        ref={formRef}
                        onSubmit={handleSubmit}
                        className={`absolute top-[30px] left-[60px] flex flex-col items-center space-y-[16px] p-[28px] bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-sm transition-all duration-500 min-w-[320px] ${
                            show ? 'flex opacity-100 scale-100' : 'hidden opacity-0 scale-95'
                        } ${shouldAnimate ? 'fadeIn' : ''}`}>
                        {/* Заголовок формы */}
                        <div className="w-full text-center mb-2">
                            <h3 className="text-xl font-semibold text-white mb-1">Добавить транзакцию</h3>
                            <div className="h-[2px] w-16 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full"></div>
                        </div>

                        {/* Тип транзакции */}
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-300 mb-3">Тип транзакции</label>
                            <div className="flex gap-2 p-1 bg-gray-700/50 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setTransactionType('loss')}
                                    className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                                        transactionType === 'loss'
                                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                                    }`}
                                >
                                    💸 Расход
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTransactionType('gain')}
                                    className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                                        transactionType === 'gain'
                                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                                    }`}
                                >
                                    💰 Доход
                                </button>
                            </div>
                        </div>

                        {/* Сумма */}
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Сумма</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="amount"
                                    placeholder="Введите сумму..."
                                    className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    required
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <span className="text-gray-400 text-sm">{currency === "RUB" ? "₽" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency}</span>
                                </div>
                            </div>
                        </div>

                        {/* Категория */}
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Категория</label>
                            <select
                                name="category"
                                id="category"
                                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 cursor-pointer"
                            >
                                <option value="housing" className="bg-gray-800">🏠 Жилье</option>
                                <option value="utilities" className="bg-gray-800">💡 Коммунальные услуги</option>
                                <option value="food" className="bg-gray-800">🍽️ Еда</option>
                                <option value="transport" className="bg-gray-800">🚗 Транспорт</option>
                                <option value="health" className="bg-gray-800">🏥 Здоровье</option>
                                <option value="clothing" className="bg-gray-800">👕 Одежда</option>
                                <option value="personal_care" className="bg-gray-800">🧴 Личная гигиена</option>
                                <option value="entertainment" className="bg-gray-800">🎬 Развлечения</option>
                                <option value="travel" className="bg-gray-800">✈️ Путешествия</option>
                                <option value="hobbies" className="bg-gray-800">🎨 Хобби</option>
                                <option value="communication" className="bg-gray-800">📱 Связь/Интернет</option>
                                <option value="subscriptions" className="bg-gray-800">📺 Подписки</option>
                                <option value="savings" className="bg-gray-800">💳 Сбережения</option>
                                <option value="investments" className="bg-gray-800">📈 Инвестиции</option>
                                <option value="insurance" className="bg-gray-800">🛡️ Страхование</option>
                                <option value="family" className="bg-gray-800">👨‍👩‍👧‍👦 Семья</option>
                                <option value="gifts" className="bg-gray-800">🎁 Подарки</option>
                                <option value="charity" className="bg-gray-800">❤️ Благотворительность</option>
                                <option value="education" className="bg-gray-800">📚 Образование</option>
                                <option value="taxes" className="bg-gray-800">📋 Налоги</option>
                                <option value="other" className="bg-gray-800">📦 Другое</option>
                            </select>
                        </div>

                        {/* Дата */}
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Дата</label>
                            <input
                                type="date"
                                name="date"
                                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>

                        {/* Кнопка отправки */}
                        <button
                            type="submit"
                            className="w-full p-3 mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                             Добавить транзакцию
                        </button>
                    </form>
                </div>
                <div className="mt-[30px] border-1 border-[#6e6e6e] p-[10px] rounded-[10px] gap-[2px] flex flex-col">
                    {renderTransactionsByMonth()}
                    
                    {trans && Object.keys(trans).length > 0 && hasMoreTransactions && (
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={loadMoreTransactions}
                                disabled={isLoadingMore}
                                className={`px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium transition-all duration-200 ${
                                    isLoadingMore 
                                        ? 'opacity-50 cursor-not-allowed' 
                                        : 'hover:bg-indigo-700 hover:shadow-lg'
                                }`}
                            >
                                {isLoadingMore ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Loading...
                                    </span>
                                ) : (
                                    'Load More Transactions'
                                )}
                            </button>
                        </div>
                    )}
                    
                    {trans && Object.keys(trans).length > 0 && !hasMoreTransactions && (
                        <div className="flex justify-center mt-6">
                            <p className="text-gray-400 text-sm">All transactions loaded</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}