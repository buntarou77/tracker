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
  ArcElement,
  BarElement
} from 'chart.js';
import { useState, useEffect } from 'react';
import { Line, Pie, Doughnut, Bar } from 'react-chartjs-2';
import Cookies from 'js-cookie';
import { FiltredTransactions, filtredCategorys } from '../../utils/filtredTrans';
import { preparePieTransactions, prepareBarTransactions } from '@/app/utils/createData';
import { prepareBarData, prepareLineData, preparePieData, prepareDoughnutData } from '@/app/utils/prepareData';

export default function YearAnalytics() {
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

  const [trans, setTrans] = useState<any[]>([]);
  const [filteredTrans, setFilteredTrans] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [submited, setSubmited] = useState(false);
  const [submitedYear, setSubmitedYear] = useState<string>('');
  const [startBudget, setStartBudget] = useState(0);
  const [endBudget, setEndBudget] = useState(0);
  const [yearRes, setYearRes] = useState(0);

  useEffect(() => {
    async function getTrans() {
      const login = Cookies.get('info_token');
      try {
        const res = await fetch(`api/getTrans?login=${login}`, {
          method: 'GET'
        });
        if (res.ok) {
          const data = await res.json();
          setTrans(data.transactions || []);
        } else {
          setError('Something went wrong');
        }
      } catch (e) {
  
        setError('Failed to fetch transactions');
      }
    }

    getTrans();
  }, []);

  useEffect(() => {
    if (submitedYear && trans.length > 0) {
      const startYear = new Date(`${submitedYear}-01-01`);
      const endYear = new Date(`${submitedYear}-12-31`);
      
      const filteredData = FiltredTransactions(trans, 'lasts', [startYear, endYear]);
      setFilteredTrans(filteredData.filteredTransactions);
      setStartBudget(filteredData.startBudget || 0);
      setEndBudget(filteredData.endBudget || 0);
      setYearRes(filteredData.resultBudget || 0);
    }
  }, [submitedYear, trans]);

  const gainTrans = filteredTrans.filter((item) => item.type === 'gain');
  const lossTrans = filteredTrans.filter((item) => item.type === 'loss');

  const lossBarLabels = prepareBarTransactions(lossTrans, submitedYear).label;
  const lossBarData = prepareBarTransactions(lossTrans, submitedYear).data;
  const barLossData = prepareBarData(lossBarData, lossBarLabels);

  const gainBarLabels = prepareBarTransactions(gainTrans, submitedYear).label;
  const gainBarData = prepareBarTransactions(gainTrans, submitedYear).data;
  const barGainData = prepareBarData(gainBarData, gainBarLabels);

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

  function handleYearSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const year = (form.elements.namedItem('year') as HTMLSelectElement).value;
    setSubmitedYear(year);
    setSubmited(true);
  }

  if (!submited) {
    return (
      <form 
        className="flex gap-6 items-center bg-dark shadow-md rounded-lg px-6 py-4 justify-center" 
        onSubmit={handleYearSubmit}
      >
        <div className="flex flex-col">
          <label htmlFor="year" className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Year
          </label>
          <select
            id="year"
            name="year"
            className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-md"
            defaultValue={new Date().getFullYear()}
          >
              <option key={2026} value={2026}>
              {2026}
            </option>
            {Array.from({ length: 25 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
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

  if (submited && filteredTrans.length === 0) {
    return (
      <div className="flex gap-6 items-center bg-dark shadow-md rounded-lg px-6 py-4 justify-center">
        No transactions found for the selected year
      </div>
    );
  }

  return (
    <div className="header bg-dark m-auto flex justify-center flex-col pl-[100px] pr-[100px]">
      <div>
        <p className='opacity-[0.8]'>{`Your start Budget: ${startBudget}$`}</p>
        <p className={`${endBudget > startBudget ? 'text-[green]' : 'text-[red]'} opacity-[0.8]`}>
          {`Your budget now: ${endBudget}$`}
        </p>
        <p className={`${endBudget > startBudget ? 'text-[#bdffab]' : 'text-[red]'} opacity-[0.8]`}>
          <span className='text-[white]'>Result:</span> {`${yearRes}$`}
        </p>
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
            No gains data available
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
          <p className='text-[20px] font-[800]'>Top 5 categories this year:</p>
          <p className='text-[19px] flex items-center flex-col'>{showCategory}</p>
        </div>
      </div>
    </div>
  );
}