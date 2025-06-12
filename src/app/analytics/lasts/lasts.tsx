'use client';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { useState, useEffect, use } from 'react';
import { Line, Pie, Doughnut, Bar } from 'react-chartjs-2';
import { FiltredTransactions, filtredCategorys } from '../../utils/filtredTrans';
import { preparePieTransactions, prepareBarTransactions, getMonth, prepareMonthBarData } from '@/app/utils/createData';
import { prepareBarData, prepareLineData, preparePieData, prepareDoughnutData } from '@/app/utils/prepareData';
import leftArrow from '../../resources/arrow-left.svg';
import rigthArrow from '../../resources/arrow-right.svg';

interface LastsAnalyticsProps {
  lossTrans: any[];
  gainTrans: any[];
  trans: any[];
  planProgress: number;
  totalPlanAmount: number;
}

export default function LastsAnalytics({ lossTrans, gainTrans, trans, lastsPlan }: LastsAnalyticsProps) {
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

  useEffect(()=>{
    setPlanProgress(planProgress)
    setTotalPlanAmount(totalPlanAmount)
  },[planProgress, totalPlanAmount])
  useEffect(() => {
    if (trans && trans.length > 0) {
      loadMonthData(monthOffset);
    }
  }, [trans, monthOffset]);
  useEffect(()=>{
  const startDate = new Date(new Date().getFullYear(), new Date().getMonth() - monthOffset - 1, 1);
  const endDate = new Date(new Date().getFullYear(), new Date().getMonth() - monthOffset, 0);
  
  const filtredTrans = FiltredTransactions(trans, 'lasts', [startDate, endDate])

  setPrevMonthLoss(filtredTrans.lossTransactions.reduce((acc, item) => acc + item.amount, 0))
  setPrevMonthGain(filtredTrans.gainTransactions.reduce((acc, item) => acc + item.amount, 0))
  }, [trans, monthOffset])

  const loadMonthData = (offset: number) => {

    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth(), 1);
    console.log('offset:' + offset)
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth()  - offset, 1);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() - offset + 1, 1); 
    const filteredData = FiltredTransactions(trans, 'lasts', [startDate, endDate]);
    console.log(filteredData)
    setFilteredTrans(filteredData.filteredTransactions);
    setFilteredGainTrans(filteredData.gainTransactions);
    setFilteredLossTrans(filteredData.lossTransactions);
    setStartBudget(filteredData.startBudget);
    setEndBudget(filteredData.endBudget);
    setMonthRes(filteredData.resultBudget);
    setMonth(getMonth(`${targetDate.getFullYear()}-${targetDate.getMonth() - offset + 1}-01`));
  };

  const handlePreviousMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    if(new Date().getMonth() - monthOffset === 0){
      setMonthOffset(-1)
    }
    setMonthOffset(prev => prev + 1); 
  };
  
  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log(monthOffset)
    if (monthOffset > 0) {

      setMonthOffset(prev => prev - 1); 
    }
  };
  useEffect(()=>{
    setMoreLosses(totalLosses - prevMonthLoss)
    setMoreGains(totalGains - prevMonthGain)
  },[totalLosses, totalGains, prevMonthLoss, prevMonthGain])

  useEffect(()=>{
    setTotalLosses(filteredLossTrans.reduce((acc, item) => acc + item.amount, 0))
    setTotalGains(filteredGainTrans.reduce((acc, item) => acc + item.amount, 0))
  },[filteredLossTrans, filteredGainTrans, ])

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
  useEffect(()=>{
    if(lastsPlan.type === 'expense'){
        setExpanseProgress((monthRes / lastsPlan.totalAmount) * 100)
    }else{
      setIncomeProgress((monthRes / lastsPlan.totalAmount) * 100)
    }
  },[filteredTrans])
  return (
    <div className="header bg-dark m-auto flex justify-center flex-col pl-[100px] pr-[100px]">
      <div className='w-[100%] flex justify-center'>
        <div className='flex justify-between items-center w-[500px]'>
          <button 
            onClick={handlePreviousMonth} 
            className='opacity-[0.8] hover:opacity-[1] w-[20px] h-[40px]'
          >
            <img className='w-[40px] h-[40px]' src={leftArrow.src} alt="Previous month" />
          </button>
          <p>{month}</p>
          <button 
            onClick={handleNextMonth} 
            className='opacity-[0.8] hover:opacity-[1] w-[20px] h-[40px]'
          >
            <img src={rigthArrow.src} alt="Next month" />
          </button>
        </div>
      </div>
      
      <div className='flex justify-between'>
        <div>


        <p className='opacity-[0.8]'>{`Your start Budget:${startBudget}$`}</p>
        <p className={`${endBudget > startBudget ? 'text-[green]' : 'text-[red]'} opacity-[0.8]`}>
          {`Your budget now:${endBudget}$`}
        </p>
        <p className={`${endBudget > startBudget ? 'text-[#bdffab]' : 'text-[red]'} opacity-[0.8]`}>
          <span className='text-[white]'>Result:</span>{`${monthRes}$`}
        </p>
        </div> 
        <div className='m-5'>
          <div className='w-[300px] h-[40px] flex items-start justify-center !items-center'>
            {
              lastsPlan.type ? 
                <div className='w-[400px]  h-[20px] flex flex-col items-center justify-center'>
                <div className='flex flex-row'>
                <span className='text-[white] font-[600] '>plan Status:</span>
                <p className={` font-[600] text-[${Number(lastsPlan.type === 'expense' ? expanseProgress : incomeProgress).toFixed(0) >= 0 ? 'green' : 'red'}]`}>{`${(Number(lastsPlan.type === 'expense' ? expanseProgress : incomeProgress).toFixed(0) < 0 ? 0 : Number(lastsPlan.type === 'expense' ? expanseProgress : incomeProgress).toFixed(0))}%`} </p>
                </div>
                <div  className='flex flex-row max-w-[400px] '>
                <div style={{ width: `${(Number(lastsPlan.type === 'expense' ? expanseProgress : incomeProgress).toFixed(0) < 0 ? 0 : Number(lastsPlan.type === 'expense' ? expanseProgress : incomeProgress).toFixed(0) * 2.5)}px` }} className={ ` ${ lastsPlan.type === 'expense' && lastsPlan.totalAmount < Number(moreGains) ? 'rounded-md' : 'rounded-tl-md'} rounded-bl-md   bg-[green] h-[20px]`}></div>
                <div style={{ 
                  width: `${
                    lastsPlan.type === 'expense' && Number(expanseProgress) > 100
                      ? 0 
                    : Number(100 - expanseProgress).toFixed(0) * 2.5}px` 
                }} className={`${ lastsPlan.type === 'expense' && lastsPlan.totalAmount < Number(moreGains) ? 'rounded-md' : 'rounded-br-md' } rounded-tr-md  bg-[#4f1e61] h-[20px]`}></div>
                </div>
              </div> : null
              
            }

          </div>
        </div>
        <div className='flex gap-[10px] flex-col'>
          <p>{`Your Losses:${totalLosses}$`}</p>
          <p>{`Your Gains:${totalGains}$`}</p>
          <p>{`Gains more than last year by: ${moreGains}$`}</p>
          <p>{`Losses more than last year by: ${moreLosses}$`}</p>
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