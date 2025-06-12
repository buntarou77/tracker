'use client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { useState, useEffect } from 'react';
import { Line, Pie, Doughnut } from 'react-chartjs-2';
import Cookies from 'js-cookie';
import { FiltredTransactions, filtredCategorys } from '../../utils/filtredTrans';
import { preparePieTransactions } from '@/app/utils/createData';
import { prepareLineData, preparePieData, prepareDoughnutData } from '@/app/utils/prepareData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DateRange {
  start: Date | null;
  end: Date | null;
}

export default function CustomAnalytics() {
  const [trans, setTrans] = useState<any[]>([]);
  const [filteredTrans, setFilteredTrans] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [startBudget, setStartBudget] = useState(0);
  const [endBudget, setEndBudget] = useState(0);
  const [periodResult, setPeriodResult] = useState(0);

  useEffect(() => {
    async function fetchTransactions() {
      const login = Cookies.get('info_token');
      try {
        const res = await fetch(`api/getTrans?login=${login}`, {
          method: 'GET'
        });
        if (res.ok) {
          const data = await res.json();
          setTrans(data.transactions || []);
        } else {
          setError('Failed to fetch transactions');
        }
      } catch (e) {
        console.error(e);
        setError('Network error occurred');
      }
    }

    fetchTransactions();
  }, []);

  useEffect(() => {
    if (dateRange.start && dateRange.end && trans.length > 0) {
      const filteredData = FiltredTransactions(trans, 'lasts', [dateRange.start, dateRange.end]);
      setFilteredTrans(filteredData.filteredTransactions);
      setStartBudget(filteredData.startBudget || 0);
      setEndBudget(filteredData.endBudget || 0);
      setPeriodResult(filteredData.resultBudget || 0);
    }
  }, [dateRange, trans]);

  const gainTrans = filteredTrans.filter((item) => item.type === 'gain');
  const lossTrans = filteredTrans.filter((item) => item.type === 'loss');

  // Prepare data using utility functions
  const allDates = Array.from(
    new Set([...gainTrans.map((t) => t.date), ...lossTrans.map((t) => t.date)])
  ).sort();

  const gains = allDates.map((date) => {
    const item = gainTrans.find((t) => t.date === date);
    return item ? item.amount : 0;
  });

  const losses = allDates.map((date) => {
    const item = lossTrans.find((t) => t.date === date);
    return item ? item.amount : 0;
  });

  const typeDatas = preparePieData([gainTrans.length, lossTrans.length], ['gains', 'losses']);
  const { data: lineData, options: lineOptions } = prepareLineData([gains, losses], allDates);

  const { categorys, categoryAmounts, sortCategory } = filtredCategorys(filteredTrans);
  const showCategory = sortCategory.slice(0, 5).map((item, index) => (
    <div key={item[0]}>
      <span className='font-[700]'>{index + 1}</span>. {item[0]} - {item[1]}$
    </div>
  ));

  const { Categorys: gainCategorys, Amounts: gainAmounts } = preparePieTransactions(gainTrans);
  const gainDoughnutData = prepareDoughnutData(gainAmounts, gainCategorys);

  const { Categorys: lossCategorys, Amounts: lossAmounts } = preparePieTransactions(lossTrans);
  const lossDoughnutData = prepareDoughnutData(lossAmounts, lossCategorys);

  const categoryDoughnutData = prepareDoughnutData(categoryAmounts, categorys);

  function handleDateSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const start = new Date(form.start.value);
    const end = new Date(form.end.value);
    
    if (start && end) {
      setDateRange({ start, end });
      setSubmitted(true);
    }
  }

  if (!submitted) {
    return (
      <form 
        className="flex gap-6 items-center bg-dark shadow-md rounded-lg px-6 py-4 justify-center" 
        onSubmit={handleDateSubmit}
      >
        <div className="flex flex-col">
          <label htmlFor="start" className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Start Date
          </label>
          <input
            type="date"
            name="start"
            id="start"
            className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-md"
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="end" className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
            End Date
          </label>
          <input
            type="date"
            name="end"
            id="end"
            className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-md"
            required
          />
        </div>

        <button
          type="submit"
          className="mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md"
        >
          Search
        </button>
      </form>
    );
  }

  if (submitted && filteredTrans.length === 0) {
    return (
      <div className="flex gap-6 items-center bg-dark shadow-md rounded-lg px-6 py-4 justify-center">
        No transactions found for the selected date range
      </div>
    );
  }

  return (
    <div className="header bg-dark m-auto flex justify-center flex-col pl-[100px] pr-[100px]">
      <div>
        <p className='opacity-[0.8]'>{`Starting Budget: ${startBudget}$`}</p>
        <p className={`${endBudget > startBudget ? 'text-[green]' : 'text-[red]'} opacity-[0.8]`}>
          {`Current Budget: ${endBudget}$`}
        </p>
        <p className={`${endBudget > startBudget ? 'text-[#bdffab]' : 'text-[red]'} opacity-[0.8]`}>
          <span className='text-[white]'>Period Result:</span> {`${periodResult}$`}
        </p>
      </div>

      <div className="w-full max-w-[1200px] h-[500px] m-auto border-[2px] border-[#5e5e5e] rounded-[10px]">
        <Line className="w-full max-w-[1200px] h-[500px] m-auto" options={lineOptions} data={lineData} />
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
          <p className='text-[20px] font-[800]'>Top 5 categories for period:</p>
          <p className='text-[19px] flex items-center flex-col'>{showCategory}</p>
        </div>
      </div>
    </div>
  );
}