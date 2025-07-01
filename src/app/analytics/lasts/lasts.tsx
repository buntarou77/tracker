'use client';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { useState, useEffect } from 'react';
import { Line, Pie, Doughnut, Bar } from 'react-chartjs-2';
import { FiltredTransactions, filtredCategorys } from '../../utils/filtredTrans';
import { preparePieTransactions, prepareBarTransactions, getMonth, prepareMonthBarData } from '@/app/utils/createData';
import { prepareBarData, prepareLineData, preparePieData, prepareDoughnutData } from '@/app/utils/prepareData';
import { useApp } from '../../context/AppContext';
import leftArrow from '../../resources/arrow-left.svg';
import rigthArrow from '../../resources/arrow-right.svg';

interface LastsAnalyticsProps {
  lossTrans: any[];
  gainTrans: any[];
  trans: any[];
  transObj?: any;
}

export default function LastsAnalytics({ lossTrans, gainTrans, trans, transObj }: LastsAnalyticsProps) {
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
  
  const { login, activeBank, activePlansStatus, plans } = useApp();
  const [startBudget, setStartBudget] = useState(0);
  const [endBudget, setEndBudget] = useState(0);
  const [monthRes, setMonthRes] = useState(0);
  const [filteredTrans, setFilteredTrans] = useState<any[]>([]);
  const [filteredGainTrans, setFilteredGainTrans] = useState<any[]>([]);
  const [filteredLossTrans, setFilteredLossTrans] = useState<any[]>([]);
  const [month, setMonth] = useState<string>('');
  const [monthOffset, setMonthOffset] = useState(0);
  const [planProgress, setPlanProgress] = useState(0);
  const [totalPlanAmount, setTotalPlanAmount] = useState(0);
  const [expanseProgress, setExpanseProgress] = useState(0);
  const [incomeProgress, setIncomeProgress] = useState(0);
  const [moreLosses, setMoreLosses] = useState(0);
  const [moreGains, setMoreGains] = useState(0);
  const [totalLosses, setTotalLosses] = useState(0);
  const [totalGains, setTotalGains] = useState(0);
  const [prevMonthLoss, setPrevMonthLoss] = useState(0);
  const [prevMonthGain, setPrevMonthGain] = useState(0);
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  
  const isMonthLoaded = (year: number, month: number) => {
    if (!transObj || typeof transObj !== 'object') return false;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    return transObj.hasOwnProperty(monthKey) && transObj[monthKey]?.length > 0;
  };

  const loadMonth = async (monthSkip: number) => {
    if (!login || !activeBank.name || isLoadingMonth) return;
    
    setIsLoadingMonth(true);
    try {
      const response = await fetch(`/api/loadmoreTrans?login=${login}&bankName=${activeBank.name}&monthSkip=${monthSkip}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const { monthKey, transactions } = data;
        
        if (transactions && transactions.length > 0 && transObj) {
          transObj[monthKey] = transactions;
        }
      }
    } catch (error) {
      console.error('Error loading month:', error);
    } finally {
      setIsLoadingMonth(false);
    }
  };
  
  const getMonthTransactions = (year: number, month: number) => {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    if (transObj && transObj[monthKey]) {
      return transObj[monthKey];
    }
    return [];
  };

  const loadActivePlan = () => {
    if (isLoadingPlan) return;
    
    setIsLoadingPlan(true);
    
    try {
      if (!plans || plans.length === 0) {
        setActivePlan(null);
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
      setActivePlan(active || null);
      
    } catch (error) {
      console.error('Error processing active plan:', error);
      setActivePlan(null);
    } finally {
      setIsLoadingPlan(false);
    }
  };
  
  useEffect(() => {
    setPlanProgress(planProgress);
    setTotalPlanAmount(totalPlanAmount);
  }, [planProgress, totalPlanAmount]);

  useEffect(() => {
    if (login) {
      loadActivePlan();
    }
  }, [login, activePlansStatus]);
  
  useEffect(() => {
    if (trans && trans.length > 0) {
      loadMonthData(monthOffset);
      if (login) {
        loadActivePlan();
      }
    }
  }, [trans, monthOffset]);
  useEffect(() => {
    const loadPrevMonthData = async () => {
      setPrevMonthLoss(0);
      setPrevMonthGain(0);
      
      const now = new Date();
      const currentTargetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const prevTargetDate = new Date(currentTargetDate.getFullYear(), currentTargetDate.getMonth() - 1, 1);
      const prevYear = prevTargetDate.getFullYear();
      const prevMonth = prevTargetDate.getMonth() + 1; 
      
      if (!isMonthLoaded(prevYear, prevMonth) && transObj) {
        const prevMonthOffset = monthOffset + 1;
        await loadMonth(prevMonthOffset);
      }
      
      const prevMonthTransactions = getMonthTransactions(prevYear, prevMonth);
      const startDate = new Date(prevYear, prevMonth - 1, 1);
      const endDate = new Date(prevYear, prevMonth, 0);
      
      const filtredTrans = FiltredTransactions(prevMonthTransactions, 'lasts', [startDate, endDate]);
      if (filtredTrans !== 'error' && 'lossTransactions' in filtredTrans) {
        setPrevMonthLoss(filtredTrans.lossTransactions.reduce((acc: number, item: any) => acc + item.amount, 0));
        setPrevMonthGain(filtredTrans.gainTransactions.reduce((acc: number, item: any) => acc + item.amount, 0));
      } else {
        setPrevMonthLoss(0);
        setPrevMonthGain(0);
      }
    };
    
    if (trans && trans.length > 0) {
      loadPrevMonthData();
    }
  }, [trans, monthOffset, transObj]);

  const loadMonthData = async (offset: number) => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() - offset + 1;
    
    // Проверяем, загружен ли нужный месяц
    if (!isMonthLoaded(year, month) && transObj) {
      await loadMonth(offset);
    }
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Получаем транзакции за месяц
    const monthTransactions = getMonthTransactions(year, month);
    
    // Фильтруем транзакции
    const filteredData = FiltredTransactions(monthTransactions, 'lasts', [startDate, endDate]);
    if (filteredData !== 'error' && 'filteredTransactions' in filteredData) {
      setFilteredTrans(filteredData.filteredTransactions || []);
      setFilteredGainTrans(filteredData.gainTransactions || []);
      setFilteredLossTrans(filteredData.lossTransactions || []);
      setStartBudget(filteredData.startBudget || 0);
      setEndBudget(filteredData.endBudget || 0);
      setMonthRes(filteredData.resultBudget || 0);
    }
    const monthName = getMonth(`${year}-${month}-01`);
    if (monthName) {
      setMonth(monthName);
    }
  };

  const handlePreviousMonth = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (new Date().getMonth() - monthOffset === 0) {
      setMonthOffset(-1);
    }
    setMonthOffset(prev => prev + 1);
  };
  
  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    if (monthOffset > 0) {
      setMonthOffset(prev => prev - 1);
    }
  };
  
  useEffect(() => {
    setMoreLosses(totalLosses - prevMonthLoss);
    setMoreGains(totalGains - prevMonthGain);
  }, [totalLosses, totalGains, prevMonthLoss, prevMonthGain]);

  useEffect(() => {
    setTotalLosses(filteredLossTrans.reduce((acc, item) => Number(acc) + Number(item.amount || 0), 0));
    setTotalGains(filteredGainTrans.reduce((acc, item) => Number(acc) + Number(item.amount || 0), 0));
  }, [filteredLossTrans, filteredGainTrans]);

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
  const { data: lineData, options: lineOptions } = prepareLineData([gains, losses], allDates);
  const { categorys, categoryAmounts, sortCategory } = filtredCategorys(filteredTrans);
  
  const showCategory = sortCategory.slice(0, 5).map((item, index) => (
    <div key={item[0]}>
      <span className='font-[700]'>{index + 1}</span>. {item[0]} - {item[1]}
    </div>
  ));

  const gainCategorys = preparePieTransactions(filteredGainTrans).Categorys;
  const gainAmounts = preparePieTransactions(filteredGainTrans).Amounts;
  const gainDoughnutData = prepareDoughnutData(gainAmounts, gainCategorys);
  
  const lossCategorys = preparePieTransactions(filteredLossTrans).Categorys;
  const lossAmounts = preparePieTransactions(filteredLossTrans).Amounts;
  const lossDoughnutData = prepareDoughnutData(lossAmounts, lossCategorys);
  
  const categoryDoughnutData = prepareDoughnutData(categoryAmounts, categorys);
  
  useEffect(() => {
    if (activePlan && activePlan.type === 'expense') {
      setExpanseProgress((monthRes / activePlan.totalAmount) * 100);
    } else if (activePlan && activePlan.type === 'income') {
      setIncomeProgress((monthRes / activePlan.totalAmount) * 100);
    }
  }, [filteredTrans, activePlan, monthRes]);

  return (
    <div className="header bg-dark m-auto flex justify-center flex-col pl-[100px] pr-[100px]">
      <div className='w-[100%] flex justify-center'>
        <div className='flex justify-between items-center w-[500px]'>
          <button 
            onClick={handlePreviousMonth} 
            className='opacity-[0.8] hover:opacity-[1] w-[20px] h-[40px]'
            disabled={isLoadingMonth}
          >
            <img className='w-[40px] h-[40px]' src={leftArrow.src} alt="Previous month" />
          </button>
          <div className='flex flex-col items-center'>
            <p>{ isLoadingMonth ? <span className="text-sm text-gray-400 mt-1 h-[5px]">Loading...</span> : month}</p>
            
          
          </div>
          <button 
            onClick={handleNextMonth} 
            className='opacity-[0.8] hover:opacity-[1] w-[20px] h-[40px]'
            disabled={isLoadingMonth}
          >
            <img src={rigthArrow.src} alt="Next month" />
          </button>
        </div>
      </div>
      
      <div className='flex justify-between'>
      <div className=" p-4 rounded-lg shadow-md text-white w-[300px] space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-gray-400">Start Budget:</span>
        <span className="font-semibold text-blue-300">{startBudget}$</span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-gray-400">Current Budget:</span>
        <span className={`font-semibold ${endBudget > startBudget ? 'text-green-400' : 'text-red-400'}`}>
          {endBudget}$  
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-gray-400">Monthly Result:</span>
        <span className={`font-semibold ${endBudget > startBudget ? 'text-lime-300' : 'text-red-400'}`}>
          {monthRes}$
        </span>
      </div>
    </div>
                <div className='m-3'>
          <div className='min-w-[280px] bg-gray-800/40 backdrop-blur-sm p-4 rounded-lg border border-gray-600 shadow-lg'>
            {isLoadingPlan ? (
              <div className='flex items-center justify-center py-4 '>
                <span className='text-gray-400 text-xs '>Loading plan...</span>
              </div>
            ) : activePlan ? 
                <div className='w-[280px] flex flex-col items-center justify-center space-y-2'>
                  {/* Header with plan status */}
                  <div className='flex flex-row items-center space-x-2'>
                    <span className='text-white font-medium text-xs'>Plan:</span>
                    <p className={`font-bold text-sm ${activePlan.type === 'expense' ? (expanseProgress >= 0 ? 'text-emerald-400' : 'text-red-400') : (incomeProgress >= 0 ? 'text-emerald-400' : 'text-red-400')}`}>
                      {`${Math.max(0, Math.round(activePlan.type === 'expense' ? expanseProgress : incomeProgress))}%`}
                    </p>
                  </div>
                  
                  {/* Compact Progress Bar */}
                  <div className='w-full max-w-[260px] relative'>
                    {/* Background container */}
                    <div className='relative w-full h-5 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg border border-gray-500 shadow-md overflow-hidden'>
                      {/* Progress fill */}
                      <div 
                        style={{ 
                          width: `${Math.min(100, Math.max(0, Math.round(activePlan.type === 'expense' ? expanseProgress : incomeProgress)))}%` 
                        }} 
                        className={`
                          absolute top-0 left-0 h-full rounded-md transition-all duration-500 ease-out
                          ${activePlan.type === 'expense' 
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-md shadow-emerald-500/30' 
                            : 'bg-gradient-to-r from-blue-500 to-blue-400 shadow-md shadow-blue-500/30'
                          }
                        `}
                      >
                        {/* Subtle shine effect */}
                        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-md'></div>
                      </div>
                      
                      {/* Overflow indicator */}
                      {(activePlan.type === 'expense' ? expanseProgress : incomeProgress) > 100 && (
                        <div className='absolute top-0 right-0 h-full w-1 bg-red-500 rounded-r-md shadow-sm'></div>
                      )}
                    </div>
                    
                    {/* Progress text overlay */}
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <span className='text-white font-semibold text-xs drop-shadow'>
                        {Math.round(activePlan.type === 'expense' ? expanseProgress : incomeProgress)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Plan info */}
                  <div className='flex items-center space-x-1'>
                    <div className={`w-2 h-2 rounded-full ${activePlan.type === 'expense' ? 'bg-emerald-400' : 'bg-blue-400'}`}></div>
                    <span className='text-gray-300 text-xs capitalize'>
                      {activePlan.type}
                    </span>
                    <span className='text-gray-400 text-xs'>
                      ({activePlan.totalAmount}$)
                    </span>
                  </div>
                  </div> : (
                   <div className='flex items-center justify-center py-4'>
                     <span className='text-gray-400 text-xs'>No active plan</span>
                   </div>
                 )
            }
          </div>
        </div>
        <div className='flex gap-[10px] flex-col'>
        <div className='flex flex-col gap-2 text-white  p-4 rounded-lg shadow-md min-w-[280px]'>
          <div className='flex justify-between items-center '>
            <span className='text-gray-400'>Your Losses:</span>
            <span className='text-red-400 font-semibold'>{totalLosses}$</span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-gray-400'>Your Gains:</span>
            <span className='text-green-400 font-semibold'>{totalGains}$</span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-gray-400'>Gains vs prev month:</span>
            <span className={`font-semibold ${moreGains >= 0 ? 'text-lime-400' : 'text-red-400'}`}>
              {moreGains >= 0 ? '+' : ''}{moreGains}$
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-gray-400'>Losses vs prev month:</span>
            <span className={`font-semibold ${moreLosses >= 0 ? 'text-orange-400' : 'text-green-400'}`}>
              {moreLosses >= 0 ? '+' : ''}{moreLosses}$
            </span>
          </div>
        </div>
        </div>
      </div>
      
      <div className="w-full max-w-[1200px] h-[500px] m-auto border-[2px] border-[#5e5e5e] rounded-[10px]">
        <Line className="w-full max-w-[1200px] h-[500px] m-auto" options={lineOptions} data={lineData} />
      </div>
      
      <div className='w-full max-w-[1200px] h-[500px] m-auto border-[2px] border-[#5e5e5e] rounded-[10px] mt-[10px]'>
        <Bar className="w-full max-w-[1200px] h-[500px] m-auto" data={barLossData} />
      </div>
      
      <div className='w-full max-w-[1200px] h-[500px] m-auto border-[2px] border-[#5e5e5e] rounded-[10px] mt-[10px]'>
        {gainBarData.length > 0 ? (
          <Bar className="w-full max-w-[1200px] h-[500px] m-auto" data={barGainData} />
        ) : (
          <div className='text-[35px] font-[800] flex items-center justify-center h-full'>
            {`you have no gains(`}
          </div>
        )}
      </div>

      
      <div className='flex flex-col w-[1000px] pt-[50px]'>
        <div className='flex flex-row'>
          <div className='border-[2px] border-[#5e5e5e] rounded-[10px] w-[50%]'>
            <Doughnut data={categoryDoughnutData} />
          </div>
          <div className='border-[2px] border-[#5e5e5e] rounded-[10px] w-[50%]'>
            <Pie data={typeDatas} />
          </div>
        </div>
        
        <div className='flex flex-row mt-[10px] mb-[10px]'>
          <div className='border-[2px] border-[#5e5e5e] rounded-[10px] w-[50%]'>
            <Doughnut data={gainDoughnutData} />
          </div>
          <div className='border-[2px] border-[#5e5e5e] rounded-[10px] w-[50%]'>
            <Doughnut data={lossDoughnutData} />
          </div>
        </div>
      </div>
      
      <div className='justify-center flex flex-col items-left pl-[300px] pr-[300px]'>
        <div className='border-[2px] border-[#5e5e5e] rounded-[10px]'>
          <p className='text-[20px] font-[800]'>Top 5 categories per month:</p>
          <p className='text-[19px] flex items-center flex-col'>{showCategory}</p>
        </div>
      </div>
    </div>
  );
}