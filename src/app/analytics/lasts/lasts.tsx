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
  lastsPlan?: any;
}

export default function LastsAnalytics({ lossTrans, gainTrans, trans, transObj, lastsPlan }: LastsAnalyticsProps) {
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
  
  const { login, activeBank } = useApp();
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
  
  // Функция для проверки, загружен ли месяц
  const isMonthLoaded = (year: number, month: number) => {
    if (!transObj || typeof transObj !== 'object') return false;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    return transObj.hasOwnProperty(monthKey) && transObj[monthKey]?.length > 0;
  };
  
  // Функция для загрузки месяца
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
          // Обновляем объект транзакций
          transObj[monthKey] = transactions;
        }
      }
    } catch (error) {
      console.error('Error loading month:', error);
    } finally {
      setIsLoadingMonth(false);
    }
  };
  
  // Функция для получения транзакций за месяц
  const getMonthTransactions = (year: number, month: number) => {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    if (transObj && transObj[monthKey]) {
      return transObj[monthKey];
    }
    return [];
  };
  
  useEffect(() => {
    setPlanProgress(planProgress);
    setTotalPlanAmount(totalPlanAmount);
  }, [planProgress, totalPlanAmount]);
  
  useEffect(() => {
    if (trans && trans.length > 0) {
      loadMonthData(monthOffset);
    }
  }, [trans, monthOffset]);
  
  useEffect(() => {
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth() - monthOffset - 1, 1);
    const endDate = new Date(new Date().getFullYear(), new Date().getMonth() - monthOffset, 0);
    const filtredTrans = FiltredTransactions(trans, 'month', undefined);
    if (filtredTrans !== 'error' && 'lossTransactions' in filtredTrans) {
      setPrevMonthLoss(filtredTrans.lossTransactions.reduce((acc: number, item: any) => acc + item.amount, 0));
      setPrevMonthGain(filtredTrans.gainTransactions.reduce((acc: number, item: any) => acc + item.amount, 0));
    }
  }, [trans, monthOffset]);

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
    if (lastsPlan && lastsPlan.type === 'expense') {
      setExpanseProgress((monthRes / lastsPlan.totalAmount) * 100);
    } else if (lastsPlan && lastsPlan.type === 'income') {
      setIncomeProgress((monthRes / lastsPlan.totalAmount) * 100);
    }
  }, [filteredTrans, lastsPlan, monthRes]);

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
            <p>{month}</p>
            {isLoadingMonth && (
              <span className="text-sm text-gray-400 mt-1">Загрузка...</span>
            )}
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
        <div className='m-5'>
          <div className='w-[300px] h-[40px] flex items-start justify-center !items-center'>
            {
              lastsPlan.type ? 
                <div className='w-[400px]  h-[20px] flex flex-col items-center justify-center'>
                <div className='flex flex-row'>
                <span className='text-[white] font-[600] '>plan Status:</span>
                <p className={` font-[600] ${lastsPlan.type === 'expense' ? (expanseProgress >= 0 ? 'text-green-500' : 'text-red-500') : (incomeProgress >= 0 ? 'text-green-500' : 'text-red-500')}`}>
                  {`${Math.max(0, Math.round(lastsPlan.type === 'expense' ? expanseProgress : incomeProgress))}%`}
                </p>
                </div>
                <div  className='flex flex-row max-w-[400px] '>
                <div style={{ 
                  width: `${Math.max(0, Math.round(lastsPlan.type === 'expense' ? expanseProgress : incomeProgress)) * 2.5}px` 
                }} className={ ` ${ lastsPlan.type === 'expense' && lastsPlan.totalAmount < Number(moreGains) ? 'rounded-md' : 'rounded-tl-md'} rounded-bl-md   bg-[green] h-[20px]`}></div>
                <div style={{ 
                  width: `${
                    lastsPlan.type === 'expense' && Number(expanseProgress) > 100
                      ? 0 
                    : Math.round(100 - expanseProgress) * 2.5}px` 
                }} className={`${ lastsPlan.type === 'expense' && lastsPlan.totalAmount < Number(moreGains) ? 'rounded-md' : 'rounded-br-md' } rounded-tr-md  bg-[#4f1e61] h-[20px]`}></div>
                </div>
              </div> : null
              
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
            <span className='text-gray-400'>Gains ↑ vs last year:</span>
            <span className='text-lime-400 font-semibold'>+{moreGains}$</span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-gray-400'>Losses ↑ vs last year:</span>
            <span className='text-orange-400 font-semibold'>+{moreLosses}$</span>
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