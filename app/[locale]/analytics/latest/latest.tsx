'use client';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { Line, Pie, Doughnut, Bar } from 'react-chartjs-2';
import { filtredCategorys } from '../../../utils/filtredTrans';
import { preparePieTransactions, getMonth, prepareMonthBarData } from '@/app/utils/createData';
import { prepareBarData, prepareLineData, preparePieData, prepareDoughnutData } from '@/app/utils/prepareData';
import { useBankTransaction } from '@/app/context/BankTransactionContext';
import leftArrow from '../../../../public/arrow-left.svg';
import rigthArrow from '../../../../public/arrow-right.svg';
import { usePlan } from '@/app/context/PlanContext';
import { useAuthContext } from '@/app/context/AuthContext';
import { useError } from '@/app/context/ErrorContext';
import { getCurrencySymbol } from '@/app/lib/symbols';
import getMonthName from '@/app/utils/getMonthName';
import { TransactionType } from '@/app/types/shared/transactions';
import { useTranslations } from 'next-intl';
import { useUI } from '@/app/context/UIContext';
import { sendEvent } from '@/app/services/broadcastChannel';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
);

export default memo(function LastsAnalytics() {
  const t = useTranslations('lastsAnalytics');
  const err = useTranslations('lastsAnalyticsErrors');
  
  const {setModal} = useUI();
  const { analyticTransactions, setAnalyticTransactions, activeBank, banks, trans } = useBankTransaction();
  const { setActiveMonthPlan, activeMonthPlan, activePlansStatus, setActivePlansStatus, plans, setPlans } = usePlan();
  const { login } = useAuthContext();
  const { addError } = useError();
  const { balance } = useBankTransaction();

  const [startBudget, setStartBudget] = useState(0);
  const [endBudget, setEndBudget] = useState(0);
  const [monthRes, setMonthRes] = useState(0);
  const [filteredTrans, setFilteredTrans] = useState<any[]>([]);
  const [filteredGainTrans, setFilteredGainTrans] = useState<any[]>([]);
  const [filteredLossTrans, setFilteredLossTrans] = useState<any[]>([]);
  const [periodInfo, setPeriodInfo] = useState<{ year: string; month: string }>({ year: '', month: '' });
  const [monthOffset, setMonthOffset] = useState(0);
  const [expenseProgress, setExpenseProgress] = useState(0);
  const [incomeProgress, setIncomeProgress] = useState(0);
  const [moreLosses, setMoreLosses] = useState(0);
  const [moreGains, setMoreGains] = useState(0);
  const [totalLosses, setTotalLosses] = useState(0);
  const [totalGains, setTotalGains] = useState(0);
  const [prevMonthLoss, setPrevMonthLoss] = useState(0);
  const [prevMonthGain, setPrevMonthGain] = useState(0);
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTransactions, setModalTransactions] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadMonth = async (offset: number) => {
    if (!activeBank?.id) return;
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    setIsLoadingMonth(true);
    const isMonthTransactionsOperations = trans.some((item)=> new Date(item.date) < startDate)
    const key = `${startDate.getFullYear()}-${endDate.getMonth() + 1}`
    if(isMonthTransactionsOperations){
      const filteredData = trans.filter(item=> new Date(item.date) > startDate && new Date(item.date) < endDate);
      const nextAnalytics = { ...analyticTransactions, [key]: filteredData };
      setAnalyticTransactions(nextAnalytics);
      sendEvent({ type: 'SYNC_ANALYTICS', payload: nextAnalytics });
      setIsLoadingMonth(false);
      return;
    }
    try {
      const response = await fetch(
        `/api/transactions?bankId=${activeBank.id}&from=${startDate.toISOString()}&to=${endDate.toISOString()}`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        addError({
          theme: 'redDark',
          name: err('loadErrorTitle'),
          desc: err('loadErrorDesc'),
          stateChangeFunc: () => { },
          interactiveFunc: () => loadMonth(offset),
          interactiveName: err('retry')
        });
        return;
      }

      const data = await response.json();
      setAnalyticTransactions((prev: Record<string, any[]>) => {
        const updated = { ...prev, [key]: data.data };
        queueMicrotask(() =>
          sendEvent({ type: 'SYNC_ANALYTICS', payload: updated })
        );
        return updated;
      });
    } catch (error) {
      addError({
        theme: 'redDark',
        name: err('networkErrorTitle'),
        desc: err('networkErrorDesc'),
        stateChangeFunc: () => { },
        interactiveFunc: () => loadMonth(offset),
        interactiveName: err('retry')
      });
    } finally {
      setIsLoadingMonth(false);
    }
  };

  const getMonthTransactions = (year: number, month: number): TransactionType[] =>
    analyticTransactions[`${year}-${month}`] || [];

  const isMonthLoaded = (year: number, month: number): boolean => {
    const key = `${year}-${month}`;
    return !!analyticTransactions[key] 
  };

  const loadMonthData = async (offset: number) => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    if (!isMonthLoaded(year, month)) {
      await loadMonth(offset);
    }
    const monthTransactions = getMonthTransactions(year, month);

    const gainTrans = monthTransactions.filter((t: any) => t.type === 'gain');
    const lossTrans = monthTransactions.filter((t: any) => t.type === 'loss');

    setFilteredTrans(monthTransactions);
    setFilteredGainTrans(gainTrans);
    setFilteredLossTrans(lossTrans);

    const totalGains = gainTrans.reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    const totalLosses = lossTrans.reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    const monthResult = totalGains - totalLosses;

    const startBudgetValue = monthTransactions.reduce((acc, item) => item.type === 'loss' ? acc + item.amount : acc - item.amount, balance)
    setStartBudget(startBudgetValue);
    setEndBudget(startBudgetValue + monthResult);
    setMonthRes(monthResult);

    setPeriodInfo({year: year.toString(), month: getMonthName(month - 1)});
  };

  const loadActivePlan = () => {
    if (isLoadingPlan) return;

    setIsLoadingPlan(true);

    try {
      if (!plans || plans.length === 0) {
        setActiveMonthPlan(null);
        sendEvent({ type: 'SYNC_ACTIVE_MONTH_PLAN', payload: null });
        return;
      }

      let activePlanId = null;

      for (const period of ['daily', 'weekly', 'monthly', 'yearly']) {
        if (activePlansStatus[period]?.status === true) {
          activePlanId = activePlansStatus[period].id;
          break;
        }
      }

      const active = activePlanId ? plans.find((plan: any) => plan.id === activePlanId) : null;
      setActiveMonthPlan(active || null);
      sendEvent({ type: 'SYNC_ACTIVE_MONTH_PLAN', payload: active || null });

    } catch (error) {
      setActiveMonthPlan(null);
      sendEvent({ type: 'SYNC_ACTIVE_MONTH_PLAN', payload: null });
    } finally {
      setIsLoadingPlan(false);
    }
  };

  useEffect(() => {
    if (login) {
      loadActivePlan();
    }
  }, [login, activePlansStatus]);

  useEffect(() => {
    loadMonthData(monthOffset);
  }, [monthOffset, activeBank, analyticTransactions]);

  useEffect(() => {
    if (periodInfo.month === '') {
      setPeriodInfo({year: new Date().getFullYear().toString(), month: getMonth(new Date().getMonth()) || ''});
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadPrevMonthData = async () => {
      setPrevMonthLoss(0);
      setPrevMonthGain(0);

      const now = new Date();
      const currentTargetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const prevTargetDate = new Date(currentTargetDate.getFullYear(), currentTargetDate.getMonth() - 1, 1);
      const prevYear = prevTargetDate.getFullYear();
      const prevMonth = prevTargetDate.getMonth() + 1;

      if (!isMonthLoaded(prevYear, prevMonth)) {
        const prevMonthOffset = monthOffset + 1;
        await loadMonth(prevMonthOffset);
      }

      const prevMonthTransactions = getMonthTransactions(prevYear, prevMonth);

      const prevGainTrans = prevMonthTransactions.filter((t: any) => t.type === 'gain');
      const prevLossTrans = prevMonthTransactions.filter((t: any) => t.type === 'loss');

      setPrevMonthLoss(prevLossTrans.reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0));
      setPrevMonthGain(prevGainTrans.reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0));
    };

    if (analyticTransactions && Object.keys(analyticTransactions).length > 0) {
      loadPrevMonthData();
    }
  }, [analyticTransactions, monthOffset]);

  useEffect(() => {
    setMoreLosses(totalLosses - prevMonthLoss);
    setMoreGains(totalGains - prevMonthGain);
  }, [totalLosses, totalGains, prevMonthLoss, prevMonthGain]);

  useEffect(() => {
    setTotalLosses(filteredLossTrans.reduce((acc, item) => Number(acc) + Number(item.amount || 0), 0));
    setTotalGains(filteredGainTrans.reduce((acc, item) => Number(acc) + Number(item.amount || 0), 0));
  }, [filteredLossTrans, filteredGainTrans]);

  useEffect(() => {
    if (activeMonthPlan && activeMonthPlan.type === 'expense') {
      setExpenseProgress((monthRes / activeMonthPlan.amount) * 100);
    } else if (activeMonthPlan && activeMonthPlan.type === 'income') {
      setIncomeProgress((monthRes / activeMonthPlan.amount) * 100);
    }
  }, [filteredTrans, activeMonthPlan, monthRes]);

  const handlePreviousMonth = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setMonthOffset(prev => prev + 1);
  };

  const handleNextMonth = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if(monthOffset - 1 < 0) return;
    setMonthOffset(prev => prev - 1);
  };

  const showCategoryTransactions = (categoryName: string): void => {
    const categoryTrans = filteredTrans.filter((t: any) => t.category === categoryName);
    setModal({type: 'transactionsData', payload: {transactions: categoryTrans, modalTitle: categoryName}});
  };

  const showTypeTransactions = (type: string): void => {
    const typeTrans = type === 'gains' ? filteredGainTrans : filteredLossTrans;
    setModal({type: 'transactionsData', payload: {transactions: typeTrans, modalTitle: type === 'gains' ? 'Gains' : 'Losses'}});
  };

  const lossBarLabels = prepareMonthBarData(filteredLossTrans).label;
  const lossBarData = prepareMonthBarData(filteredLossTrans).data;
  const barLossData = prepareBarData(lossBarData, lossBarLabels);

  const gainBarLabels = prepareMonthBarData(filteredGainTrans).label;
  const gainBarData = prepareMonthBarData(filteredGainTrans).data;
  const barGainData = prepareBarData(gainBarData, gainBarLabels);

  const allDates = Array.from(
    new Set([...filteredGainTrans.map((t) => t.date), ...filteredLossTrans.map((t) => t.date)])
  ).sort();

  const gains = allDates.map((date) => {
    const item = filteredGainTrans.find((t) => t.date === date);
    return item ? item.amount : 0;
  });

  const losses = allDates.map((date) => {
    const item = filteredLossTrans.find((t) => t.date === date);
    return item ? item.amount : 0;
  });

  const typeDatas = preparePieData([filteredGainTrans.length, filteredLossTrans.length], ['gains', 'losses']);
  const { data: lineData, options: lineOptions } = prepareLineData(
    [gains, losses],
    allDates.map((date) => new Date(date).getDate().toString())
  );

  const { categorys, categoryAmounts, sortCategory } = filtredCategorys(filteredTrans);
  const categorysArray = categorys as string[];
  const categoryAmountsArray = categoryAmounts as number[];

  const showCategory = sortCategory.slice(0, 5).map((item: [string, number], index: number) => (
    <div key={item[0]}>
      <span className='font-[700]'>{index + 1}</span>. {item[0]} - {item[1]}
    </div>
  ));

  const gainCategorys = preparePieTransactions(filteredGainTrans).Categorys as string[];
  const gainAmounts = preparePieTransactions(filteredGainTrans).Amounts as number[];
  const gainDoughnutData = prepareDoughnutData(gainAmounts, gainCategorys);

  const lossCategorys = preparePieTransactions(filteredLossTrans).Categorys as string[];
  const lossAmounts = preparePieTransactions(filteredLossTrans).Amounts as number[];
  const lossDoughnutData = prepareDoughnutData(lossAmounts, lossCategorys);
  const categoryDoughnutData = prepareDoughnutData(categoryAmountsArray, categorysArray);

  const currencySymbol = getCurrencySymbol(activeBank?.currency as any);
  const displayCurrency = currencySymbol || activeBank?.currency;

  const planCurrencySymbol = getCurrencySymbol(activeMonthPlan?.currency as any);
  const planDisplayCurrency = planCurrencySymbol || activeMonthPlan?.currency;

  return (
    <div className="header bg-dark m-auto flex justify-center flex-col pl-[100px] pr-[100px]">
      <div className='w-[100%] flex justify-center'>
        <div className='flex justify-between items-center w-[500px]'>
          <button
            onClick={handlePreviousMonth}
            className='opacity-[0.8] hover:opacity-[1] w-[20px] h-[40px]'
            disabled={isLoadingMonth}
          >
            <img className='w-[40px] h-[40px]' src={leftArrow.src} alt={t('loading')} />
          </button>
          <div className='flex flex-col items-center'>
            <div>
              {isLoadingMonth ? (
                <span className="text-sm text-gray-400 mt-1 h-[5px]">{t('loading')}</span>
              ) : (
                <div className={'flex flex-col'}>
                  <p className={'opacity-50 flex justify-center items-center'}>{periodInfo.year}</p>
                  <p className={'flex justify-center items-center opacity-80'}>{periodInfo.month}</p>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleNextMonth}
            className='opacity-[0.8] hover:opacity-[1] w-[20px] h-[40px]'
            disabled={isLoadingMonth}
          >
            <img src={rigthArrow.src} alt={t('loading')} />
          </button>
        </div>
      </div>

      <div className='flex justify-between'>
        <div className=" p-4 rounded-lg shadow-md text-white w-[300px] space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">{t('startBudget')}</span>
            <span className="font-semibold text-blue-300">{startBudget.toFixed(2)}{displayCurrency}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">{t('currentBudget')}</span>
            <span className={`font-semibold ${endBudget > startBudget ? 'text-green-400' : 'text-red-400'}`}>
              {endBudget.toFixed(2)}{displayCurrency}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">{t('monthlyResult')}</span>
            <span className={`font-semibold ${endBudget > startBudget ? 'text-lime-300' : 'text-red-400'}`}>
              {monthRes.toFixed(2)}{displayCurrency}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">{t('transactionsCount')}</span>
            <span className={`font-semibold  text-lime-300 `}>
              {filteredTrans.length}
            </span>
          </div>
        </div>
        <div className='m-3'>
          <div className='min-w-[280px] bg-gray-800/40 backdrop-blur-sm p-4 rounded-lg border border-gray-600 shadow-lg'>
            {isLoadingPlan ? (
              <div className='flex items-center justify-center py-4 '>
                <span className='text-gray-400 text-xs '>{t('loadingPlan')}</span>
              </div>
            ) : activeMonthPlan ?
              <div className='w-[280px] flex flex-col items-center justify-center space-y-2'>
                <div className='flex flex-row items-center space-x-2'>
                  <span className='text-white font-medium text-xs'>{t('plan')}</span>
                  <p className={`font-bold text-sm ${activeMonthPlan.type === 'expense' ? (expenseProgress >= 0 ? 'text-emerald-400' : 'text-red-400') : (incomeProgress >= 0 ? 'text-emerald-400' : 'text-red-400')}`}>
                    {`${Math.max(0, Math.round(activeMonthPlan.type === 'expense' ? expenseProgress : incomeProgress))}%`}
                  </p>
                </div>

                <div className=' max-w-[260px] relative'>
                  <div className='relative w-full h-5 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg border border-gray-500 shadow-md overflow-hidden'>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, Math.round(activeMonthPlan.type === 'expense' ? expenseProgress : incomeProgress)))}%`
                      }}
                      className={`
                        absolute top-0 left-0 h-full rounded-md transition-all duration-500 ease-out
                        ${activeMonthPlan.type === 'expense'
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-md shadow-emerald-500/30'
                          : 'bg-gradient-to-r from-blue-500 to-blue-400 shadow-md shadow-blue-500/30'
                        }
                      `}
                    >
                      <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-md'></div>
                    </div>

                    {(activeMonthPlan.type === 'expense' ? expenseProgress : incomeProgress) > 100 && (
                      <div className='absolute top-0 right-0 h-full w-1 bg-red-500 rounded-r-md shadow-sm'></div>
                    )}
                  </div>

                  <div className='absolute inset-0 flex items-center justify-center'>
                    <span className='text-white font-semibold text-xs drop-shadow'>
                      {Math.round(activeMonthPlan.type === 'expense' ? expenseProgress : incomeProgress)}%
                    </span>
                  </div>
                </div>

                <div className='flex items-center space-x-1'>
                  <div className={`w-2 h-2 rounded-full ${activeMonthPlan.type === 'expense' ? 'bg-emerald-400' : 'bg-blue-400'}`}></div>
                  <span className='text-gray-300 text-xs capitalize'>
                    {activeMonthPlan.type}
                  </span>
                  <span className='text-gray-400 text-xs'>
                    ({activeMonthPlan.amount}{planDisplayCurrency})
                  </span>
                </div>
              </div> : (
                <div className='flex items-center justify-center py-4'>
                  <span className='text-gray-400 text-xs'>{t('noActivePlan')}</span>
                </div>
              )
            }
          </div>
        </div>

        <div className='flex gap-[10px] flex-col'>
          <div className='flex flex-col gap-2 text-white  p-4 rounded-lg shadow-md min-w-[280px]'>
            <div className='flex justify-between items-center '>
              <span className='text-gray-400'>{t('yourLosses')}</span>
              <span className='text-red-400 font-semibold'>{totalLosses}{displayCurrency}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-400'>{t('yourGains')}</span>
              <span className='text-green-400 font-semibold'>{totalGains}{displayCurrency}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-400'>{t('gainsVsPrev')}</span>
              <span className={`font-semibold ${moreGains >= 0 ? 'text-lime-400' : 'text-red-400'}`}>
                {moreGains >= 0 ? '+' : ''}{moreGains}{displayCurrency}
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-400'>{t('lossesVsPrev')}</span>
              <span className={`font-semibold ${moreLosses >= 0 ? 'text-orange-400' : 'text-green-400'}`}>
                {moreLosses >= 0 ? '+' : ''}{moreLosses}{displayCurrency}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px] h-[500px] m-auto border-[2px] border-[#5e5e5e] rounded-[10px]">
        {lineData?.datasets?.[0]?.data?.length > 0 ? (
          <Line
            className="w-full max-w-[1200px] h-[500px] m-auto"
            options={lineOptions}
            data={lineData}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 14l3-3 4 4 5-5"/>
              </svg>
            </div>

            <p className="text-gray-400 text-sm font-medium">
              {t('noChartData')}
            </p>

            <p className="text-gray-500 text-xs mt-1">
              {t('addTransactionsToSeeStats')}
            </p>
          </div>
        )}
      </div>  

      <div className='w-full max-w-[1200px] h-[500px] m-auto border-[2px] border-[#5e5e5e] rounded-[10px] mt-[10px]'>
        {barLossData?.datasets?.[0]?.data?.length > 0 ? (
          <Bar
            className="w-full max-w-[1200px] h-[500px] m-auto"
            data={barLossData}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mb-4 border border-red-700/30">
              <svg className="w-8 h-8 text-red-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h6M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v4"/>
              </svg>
            </div>

            <p className="text-red-300/80 text-sm font-medium">
              {t('noExpenseChart')}
            </p>

            <p className="text-red-400/60 text-xs mt-1">
              {t('addLossTransactions')}
            </p>
          </div>
        )}
      </div>
        
      <div className='w-full max-w-[1200px] h-[500px] m-auto border-[2px] border-[#5e5e5e] rounded-[10px] mt-[10px]'>
        {gainBarData.length > 0 ? (
          <Bar
            className="w-full max-w-[1200px] h-[500px] m-auto"
            data={barGainData}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            
            <div className="w-16 h-16 rounded-full bg-green-900/30 flex items-center justify-center mb-4 border border-green-700/30">
              <svg
                className="w-8 h-8 text-green-400/70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 17l6-6 4 4 8-8"
                />
              </svg>
            </div>

            <p className="text-green-300/90 text-sm font-semibold">
              {t('noGainsFallback')}
            </p>

            <p className="text-green-400/60 text-xs mt-1">
              {t('addGainTransactions')}
            </p>

          </div>
        )}
      </div>

      <div className='flex flex-col w-[1200px] pt-[50px] gap-[20px]'>
        <div className='flex flex-row gap-[20px] w-[90%] bg-gray-800/60 backdrop-blur-sm border border-gray-600 rounded-xl shadow-lg p-4'>
          <div className='bg-gray-900/50 rounded-lg w-[50%] h-[400px] flex items-center justify-center border border-gray-700/50'>
            {categorysArray.length > 0 ? (
              <Doughnut
                style={{ width: '100%' }}
                data={categoryDoughnutData}
                options={{
                  plugins: {
                    legend: {
                      labels: {
                        font: {
                          size: 10
                        },
                        color: '#e5e7eb'
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className='flex flex-col items-center justify-center text-center p-8'>
                <div className='w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mb-4'>
                  <svg className='w-8 h-8 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                  </svg>
                </div>
                <p className='text-gray-400 text-sm font-medium'>{t('noCategoryData')}</p>
                <p className='text-gray-500 text-xs mt-1'>{t('addTransactionsToSeeStats')}</p>
              </div>
            )}
          </div>
          <div className='w-[50%] p-4'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
              <h3 className='text-white text-lg font-bold'>{t('categoriesHeading')}</h3>
            </div>
            {categorysArray.length > 0 ? (
              <div className='grid grid-cols-2 gap-2 max-h-[350px] w-[100%] overflow-y-auto'>
                {categorysArray.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => showCategoryTransactions(category)}
                    className='bg-gray-700/80 hover:bg-gray-600/90 text-white p-2 rounded-lg text-sm transition-all duration-200 text-left border border-gray-600/50 hover:border-gray-500'
                  >
                    {category}: {categoryAmountsArray[index]}{displayCurrency}
                  </button>
                ))}
              </div>
            ) : (
              <div className='flex items-center justify-center h-[350px] text-gray-500 text-sm'>
                {t('noCategories')}
              </div>
            )}
          </div>
        </div>

        <div className='flex flex-row gap-[20px] w-[90%] bg-gray-800/60 backdrop-blur-sm border border-gray-600 rounded-xl shadow-lg p-4'>
          <div className='bg-gray-900/50 rounded-lg w-[50%] h-[400px] flex items-center justify-center border border-gray-700/50'>
            {filteredGainTrans.length > 0 || filteredLossTrans.length > 0 ? (
              <Pie
                style={{ width: '100%' }}
                data={typeDatas}
                options={{
                  plugins: {
                    legend: {
                      labels: {
                        font: {
                          size: 10
                        },
                        color: '#e5e7eb'
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className='flex flex-col items-center justify-center text-center p-8'>
                <div className='w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mb-4'>
                  <svg className='w-8 h-8 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                  </svg>
                </div>
                <p className='text-gray-400 text-sm font-medium'>{t('modal.noTransactions')}</p>
                <p className='text-gray-500 text-xs mt-1'>{t('addTransactionsToSeeStats')}</p>
              </div>
            )}
          </div>
          <div className='w-[50%] p-4'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
              <h3 className='text-white text-lg font-bold'>{t('transactionTypesHeading')}</h3>
            </div>
            <div className='flex flex-col gap-2'>
              <button
                onClick={() => showTypeTransactions('gains')}
                className='bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 hover:from-emerald-600 hover:to-emerald-500 text-white p-3 rounded-lg transition-all duration-200 text-left border border-emerald-500/30 hover:border-emerald-400/50 shadow-md hover:shadow-emerald-500/20'
              >
                <div className='flex items-center justify-between'>
                  <span className='font-semibold'>{t('gainsButton')}</span>
                  <span className='text-emerald-100'>{filteredGainTrans.length} {t('transactionsCount')?.split(' ')[0]}</span>
                </div>
                <div className='text-emerald-200 text-sm mt-1'>{totalGains}{displayCurrency}</div>
              </button>
              <button
                onClick={() => showTypeTransactions('losses')}
                className='bg-gradient-to-r from-orange-600/80 to-red-500/80 hover:from-orange-600 hover:to-red-500 text-white p-3 rounded-lg transition-all duration-200 text-left border border-red-500/30 hover:border-red-400/50 shadow-md hover:shadow-red-500/20'
              >
                <div className='flex items-center justify-between'>
                  <span className='font-semibold'>{t('lossesButton')}</span>
                  <span className='text-red-100'>{filteredLossTrans.length} {t('transactionsCount')?.split(' ')[0]}</span>
                </div>
                <div className='text-red-200 text-sm mt-1'>{totalLosses}{displayCurrency}</div>
              </button>
            </div>
          </div>
        </div>

        <div className='flex flex-row gap-[20px] w-[90%] bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 backdrop-blur-sm border border-emerald-600/30 rounded-xl shadow-lg p-4'>
          <div className='bg-gray-900/50 rounded-lg w-[50%] h-[400px] flex items-center justify-center border border-emerald-700/30'>
            {gainCategorys.length > 0 ? (
              <Doughnut
                style={{ width: '100%' }}
                data={gainDoughnutData}
                options={{
                  plugins: {
                    legend: {
                      labels: {
                        font: {
                          size: 10
                        },
                        color: '#e5e7eb'
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className='flex flex-col items-center justify-center text-center p-8'>
                <div className='w-16 h-16 rounded-full bg-emerald-900/30 flex items-center justify-center mb-4 border border-emerald-700/30'>
                  <svg className='w-8 h-8 text-emerald-500/50' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <p className='text-emerald-300/80 text-sm font-medium'>{t('noIncomeYet')}</p>
                <p className='text-emerald-400/60 text-xs mt-1'>{t('addGainTransactions')}</p>
              </div>
            )}
          </div>
          <div className='w-[50%] p-4'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-2 h-2 bg-emerald-500 rounded-full'></div>
              <h3 className='text-white text-lg font-bold'>{t('gainCategoriesHeading')}</h3>
            </div>
            {gainCategorys.length > 0 ? (
              <div className='grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto'>
                {gainCategorys.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => showCategoryTransactions(category)}
                    className='bg-emerald-700/60 hover:bg-emerald-600/70 text-white p-2 rounded-lg text-sm transition-all duration-200 text-left border border-emerald-500/30 hover:border-emerald-400/50'
                  >
                    {category}: {gainAmounts[index]}{displayCurrency}
                  </button>
                ))}
              </div>
            ) : (
              <div className='flex items-center justify-center h-[350px] text-emerald-400/60 text-sm'>
                {t('noIncomeCategories')}
              </div>
            )}
          </div>
        </div>

        <div className='flex flex-row gap-[20px] w-[90%] bg-gradient-to-br from-orange-900/20 to-red-800/10 backdrop-blur-sm border border-red-600/30 rounded-xl shadow-lg p-4'>
          <div className='bg-gray-900/50 rounded-lg w-[50%] h-[400px] flex items-center justify-center border border-red-700/30'>
            {lossCategorys.length > 0 ? (
              <Doughnut
                style={{ width: '100%' }}
                data={lossDoughnutData}
                options={{
                  plugins: {
                    legend: {
                      labels: {
                        font: {
                          size: 10
                        },
                        color: '#e5e7eb'
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className='flex flex-col items-center justify-center text-center p-8'>
                <div className='w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mb-4 border border-red-700/30'>
                  <svg className='w-8 h-8 text-red-500/50' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' />
                  </svg>
                </div>
                <p className='text-red-300/80 text-sm font-medium'>{t('noExpensesYet')}</p>
                <p className='text-red-400/60 text-xs mt-1'>{t('addLossTransactions')}</p>
              </div>
            )}
          </div>
          <div className='w-[50%] p-4'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-2 h-2 bg-red-500 rounded-full'></div>
              <h3 className='text-white text-lg font-bold'>{t('lossCategoriesHeading')}</h3>
            </div>
            {lossCategorys.length > 0 ? (
              <div className='grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto'>
                {lossCategorys.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => showCategoryTransactions(category)}
                    className='bg-red-700/60 hover:bg-red-600/70 text-white p-2 rounded-lg text-sm transition-all duration-200 text-left border border-red-500/30 hover:border-red-400/50'
                  >
                    {category}: {lossAmounts[index]}{displayCurrency}
                  </button>
                ))}
              </div>
            ) : (
              <div className='flex items-center justify-center h-[350px] text-red-400/60 text-sm'>
                {t('noExpenseCategories')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-white">{t('top5Categories')}</h3>
          </div>
          <div className="space-y-2">
            {showCategory}
          </div>
        </div>
      </div>
    </div>
  );
});
