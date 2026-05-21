'use client'
import { useCallback, useEffect, useState, useRef } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { useBankTransaction } from '../../context/BankTransactionContext';
import { useUI } from '../../context/UIContext';
import { useError } from '../../context/ErrorContext';
import { TransactionType } from '../../types/shared/transactions'
import Cookies from 'js-cookie';
import BankAccount from '../../components/BankAccount';
import { useTranslations } from 'next-intl';
import { sendEvent } from '../../services/broadcastChannel';
import { authFetch } from '../../services/authFetch';
import { NextResponse } from 'next/server';

interface transaction {
    amount: number, 
    id: number,
    bankId: string,
    category: string,
    date: Date,
    createdAt: Date,
    type: 'loss' | 'gain',
}

export default function Operations() {
    const t = useTranslations('operations');
    const e = useTranslations('errors');
    const { trans, setTrans, balance, setBalance, activeBank, currency, hasMore, nextCursor, setNextCursor, setHasMore, banks, analyticTransactions, setAnalyticTransactions } = useBankTransaction();
    const [show, setShow] = useState<boolean>(false);
    const [shouldAnimate, setShouldAnimate] = useState<boolean>(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [transactionType, setTransactionType] = useState<'loss' | 'gain'>('loss');
    const [canUseCachedTransactions, setCanUseCachedTransactions] = useState<boolean>(Object.keys(analyticTransactions).length > 0);
    const [monthSkip, setMonthSkip] = useState<number>(1);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const { login } = useAuthContext();
    const { setIsAccountsVisible, setAddBankAccountForm, setModal } = useUI();
    const { addError } = useError();

    async function addTransactionOrchestrator(
        transaction: TransactionType
    ) {
        try {
            if (!activeBank.id) {
                addError({
                    theme: 'redDark',
                    name: e('noBankAccount.name'),
                    desc: e('noBankAccount.desc'),
                    stateChangeFunc: () => {},
                    interactiveFunc: createBankAccountError,
                    interactiveName: e('noBankAccount.interactiveName')
                });
    
                return;
            }
    
            const response = await requestAddTransaction(
                transaction,
                activeBank.id
            );
    
            if (response.ok) {
                await handleAddTransactionSuccess(
                    response,
                    transaction
                );
    
                return;
            }
    
            handleAddTransactionError(transaction);
    
        } catch {
            handleAddTransactionNetworkError(transaction);
        }
    }

    async function requestAddTransaction(
        transaction: TransactionType,
        bankId: string
    ) {
        return authFetch('/api/addTrans', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...transaction,
                bankId
            })
        });
    }

    async function handleAddTransactionSuccess(
        response: Response,
        transaction: TransactionType
    ) {
        const data = await response.json();
    
        const singleTransaction = data.data;
    
        // balance
        const newBalance =
            transaction.type === 'gain'
                ? Number(balance) + Number(transaction.amount)
                : Number(balance) - Number(transaction.amount);
    
        setBalance(newBalance);
    
        // cookies
        const balanceToken =
            Cookies.get(`bank_account_${login}`) || '0';
    
        Cookies.set(
            `bank_account_${login}`,
            String(newBalance)
        );
    
        // transactions
        setTrans(prev => [...prev, singleTransaction]);
    
        // analytics
        const analyticKey = `${
            new Date(singleTransaction.date).getFullYear()
        }-${
            new Date(singleTransaction.date).getMonth() + 1
        }`;
    
        setAnalyticTransactions(prev => ({
            ...prev,
            [analyticKey]: [
                ...(prev[analyticKey] || []),
                singleTransaction
            ]
        }));
    
        // sync
        sendEvent({
            type: 'ADD_TRANSACTION',
            payload: singleTransaction
        });
    
        // success ui
        addError({
            theme: 'greenDark',
            name: e('success.name'),
            desc: e('success.desc'),
            stateChangeFunc: () => {},
            interactiveFunc: () => {},
            interactiveName: ''
        });
    }

    function handleAddTransactionError(
        transaction: TransactionType
    ) {
        addError({
            theme: 'redDark',
            name: e('addError.name'),
            desc: e('addError.desc'),
            stateChangeFunc: () => {},
            interactiveFunc: () =>
                addTransactionOrchestrator(transaction),
            interactiveName: e('addError.interactiveName')
        });
    }

    function handleAddTransactionNetworkError(
        transaction: TransactionType
    ) {
        addError({
            theme: 'redDark',
            name: e('networkError.name'),
            desc: e('networkError.desc'),
            stateChangeFunc: () => {},
            interactiveFunc: () =>
                addTransactionOrchestrator(transaction),
            interactiveName: e('networkError.interactiveName')
        });
    }

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

    useEffect(()=>{
        async function getTrans(){
          if(activeBank.name === '') return 
          const activeBankData = Cookies.get('activeBank')
          let activeBankId 
          if(!activeBankData) {
            activeBankId = banks[0].id
          }else{
            activeBankId = JSON.parse(activeBankData)
          }
          if(canUseCachedTransactions){
            const res =  getCashedTransactions(nextCursor, 20)
            if(res.data.length > 0){
                setTrans(res.data)
                console.log(`next cursor: ${res.cursor}  operations 221`)
                setNextCursor(res.cursor)
                // Send event for transactions sync from cache
                sendEvent({ type: 'SYNC_TRANSACTIONS', payload: res.data });
            }else{
                setCanUseCachedTransactions(res.data.length < 20)
            }
            setHasMore(true)
            return 
          }
          const response = await authFetch(`/api/getTrans?bankId=${activeBank.id}`, {
            method: 'GET'
          })
          if(response.ok){
            const responseData = await response.json()
            setTrans(responseData.data);
            setHasMore(responseData.meta.hasMore)
            console.log(`setnextCursor: ${responseData.meta.cursor}  operations 228`)
            setNextCursor(responseData.meta.cursor)
            // Send event for transactions sync from API
            sendEvent({ type: 'SYNC_TRANSACTIONS', payload: responseData.data });
          }
        }
        getTrans()
      },[activeBank])

      useEffect(()=>{
        function closeModal(){
            setShow(false)
        }
        if(show){
        setModal({type: 'addTransaction', payload: {closeModal, addTransactionOrchestrator}})
        }
      }, [show])

    function getCashedTransactions(cursor: string ,limit: number = 20): {hesNext: boolean, cursor: string, data: any[]} {
        let limitLeft = limit + 1
        const cursorDate = new Date(cursor)
        let offset = 0
        const resultArray = []
        while(limitLeft > 0){
            const targetDate = new Date(cursorDate.getFullYear(), cursorDate.getMonth() - offset)
            let cursorKey = `${targetDate.getFullYear()}-${targetDate.getMonth() + 1 > 10 ? targetDate.getMonth() + 1 : '0' + (targetDate.getMonth() + 1)}` 
            console.log(cursorKey)
            console.log(analyticTransactions[cursorKey])
            if(!analyticTransactions[cursorKey]) break
            for(let item of analyticTransactions[cursorKey]){
                limitLeft--
                resultArray.push(item)
            }
            offset++
        }
        const preparedData = resultArray.sort((a: TransactionType, b: TransactionType)=> +new Date(a.date) - +new Date(b.date))
        const res = {
            cursor: `${preparedData[0]?.date}` || '',
            hesNext: preparedData.length > 20,
            data: preparedData.length === 21 ? preparedData.slice(19, 20) : preparedData
        }
        return res
    }

    const handleToggle = useCallback(() => {
        setShow(prev => !prev);
        setShouldAnimate(prev => !prev);
    }, []);

    const delTransaction = async (id: any, amount: any, type: any, date: any) => { 
        try {
            const data = JSON.stringify({
                transactionId: id,
                amount,
                type,
                date,
                login,
                balance,
                bankId: activeBank.id,
                includeUpdatedBank: true
            });
            const response = await authFetch(`/api/delTrans`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: data
            });
            if(response.ok){
                const newBalance = type === 'loss' 
                  ? Number(balance) + Number(amount)
                  : Number(balance) - Number(amount);
                  
                setBalance(newBalance);

                setTrans(prev => prev.filter(trans => trans.id !== id));
                
                sendEvent({ type: 'DELETE_TRANSACTION', payload: id });

                addError({
                    theme: 'greenDark',
                    name: e('deleteSuccess.name'),
                    desc: e('deleteSuccess.desc'),
                    stateChangeFunc: () => {},
                    interactiveFunc: () => {},
                    interactiveName: ''
                });
            } else {
                addError({
                    theme: 'redDark',
                    name: e('deleteError.name'),
                    desc: e('deleteError.desc'),
                    stateChangeFunc: () => {},
                    interactiveFunc: () => delTransaction(id, amount, type, date),
                    interactiveName: e('deleteError.interactiveName')
                });
            }
        } catch(error) {
            addError({
                theme: 'redDark',
                name: e('deleteNetworkError.name'),
                desc: e('deleteNetworkError.desc'),
                stateChangeFunc: () => {},
                interactiveFunc: () => delTransaction(id, amount, type, date),
                interactiveName: e('deleteNetworkError.interactiveName')
            });
        }
    };

    const loadMoreTransactions = async () => {
        if (!login || !activeBank.name || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const nextSkip = monthSkip + 1;
            if(activeBank.id === '' ) {
                addError({
                    theme: 'orangeDark',
                    name: e('noBankSelected.name'),
                    desc: e('noBankSelected.desc'),
                    stateChangeFunc: () => {},
                    interactiveFunc: () => {},
                    interactiveName: e('noBankSelected.interactiveName')
                });
                return;
            }

            const response = await authFetch(`/api/getTrans?bankId=${activeBank.id}&cursor=${nextCursor}`);

            if (response.ok) {
                const data = await response.json();
                const updatedTransactions = [...trans, ...data.data];
                setTrans(updatedTransactions);
                setMonthSkip(nextSkip);
                setHasMore(data.meta.hasMore)
                console.log(`setNExtCursor ${data.meta.cursor} operations 358`)
                setNextCursor(data.meta.cursor)
                
                // Send event for transactions sync
                sendEvent({ type: 'SYNC_TRANSACTIONS', payload: updatedTransactions });
            } else {
                addError({
                    theme: 'redDark',
                    name: e('loadMoreError.name'),
                    desc: e('loadMoreError.desc'),
                    stateChangeFunc: () => {},
                    interactiveFunc: () => loadMoreTransactions(),
                    interactiveName: e('loadMoreError.interactiveName')
                });
            }
        } catch (error) {
            addError({
                theme: 'redDark',
                name: e('loadMoreNetworkError.name'),
                desc: e('loadMoreNetworkError.desc'),
                stateChangeFunc: () => {},
                interactiveFunc: () => loadMoreTransactions(),
                interactiveName: e('loadMoreNetworkError.interactiveName')
            });
        } finally {
            setIsLoadingMore(false);
        }
    };

    const formatMonthYear = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        const monthNames = t.raw('monthNames') as string[];
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
        const key = `categoryIcons.${category}`;
        return t.has(key) ? t(key) : '📦';
    };

    function createBankAccountError(){
        setIsAccountsVisible(true);
        setAddBankAccountForm(true);
    }

    const renderTransactionsByMonth = () => {
        if (!trans || typeof trans !== 'object' || !trans.length) {
            return (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-gray-400 text-lg">{t('noTransactions')}</p>
                    <p className="text-gray-500 text-sm mt-2">{t('startAdding')}</p>
                </div>
            );
        }
        const monthTransactionsData: Record<string, transaction[]> = {};
        for(let i = 0; i < trans.length ;i++){
            const date = new Date(trans[i].date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if(monthTransactionsData[key]){
                monthTransactionsData[key] = [...monthTransactionsData[key], trans[i]];
            }else{
                monthTransactionsData[key] = [trans[i]];
            }
        }

        if (Object.keys(monthTransactionsData).length === 0) {
            return (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-gray-400 text-lg">{t('noTransactions')}</p>
                    <p className="text-gray-500 text-sm mt-2">{t('startAdding')}</p>
                </div>
            );
        }

        return Object.keys(monthTransactionsData)
            .sort()
            .reverse()
            .map(monthKey => {
            const monthTransactions: any[] = monthTransactionsData[monthKey];
            if (!monthTransactions || monthTransactions.length === 0) return null;
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
                                                        {item.type === 'gain' ? `💰 ${t('income')}` : `💸 ${t('expense')}`}
                                                    </span>
                                                </div>
                                                <div className="text-gray-300 capitalize font-medium">
                                                    {item?.category?.replace('_', ' ')}
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
                                            title={t('deleteTransaction')}
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
                                    <span>{t('addTransaction')}</span>
                                </button>
                            </div>

                            {renderTransactionsByMonth()}

                            {hasMore &&  (
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
                                                {t('loading')}
                                            </span>
                                        ) : (
                                            t('loadMore')
                                        )}
                                    </button>
                                </div>
                            )}

                            {!hasMore && (
                                <div className="text-center mt-8">
                                    <p className="text-gray-400">{t('allTransactionsLoaded')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-bold text-white mb-4">📊 {t('quickStats')}</h3>
                            <div className="space-y-4">
                                <div className="bg-gray-700 rounded-lg p-4">
                                    <div className="text-sm text-gray-400">{t('resultPer', { count: trans.length })}</div>
                                    <div className="text-2xl font-bold text-white">
                                        {trans.length ? trans.reduce((sum: number, trans: transaction) => trans.type === 'loss' ? sum - trans.amount: sum + trans.amount , 0).toFixed(2) : 0} {banks.find((item)=>item.id === activeBank.id)?.currency}
                                    </div>
                                </div>
                                <div className="bg-gray-700 rounded-lg p-4">
                                    <div className="text-sm text-gray-400">{t('activeBank')}</div>
                                    <div className="text-lg font-semibold text-blue-400">
                                        {activeBank.name || t('noBankSelected')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}