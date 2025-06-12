'use client';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement} from 'chart.js';
  import { useState, useEffect } from 'react';
  import { Line, Pie, Doughnut, Bar} from 'react-chartjs-2';
  import Cookies from 'js-cookie';
  import {FiltredTransactions, filtredCategorys} from '../../utils/filtredTrans';
  import {preparePieTransactions, prepareBarTransactions} from '@/app/utils/createData';
  import {prepareBarData, prepareLineData, preparePieData, prepareDoughnutData} from '@/app/utils/prepareData';

interface GlobalAnalyticsProps {
  gainTrans: any[];
  lossTrans: any[];
}
  export default function GlobalsAnalytics({lossTrans , gainTrans, trans}: GlobalAnalyticsProps){
    ChartJS.register(CategoryScale, LinearScale, PointElement, ArcElement, LineElement, Title, Tooltip, Legend, BarElement);
    const [startBudget, setStartBudget] = useState(0);
    const [endBudget, setEndBudget] = useState(0);
    const [monthRes, setMonthRes] = useState(0);
    useEffect(()=>{
      if(trans){
      const info = FiltredTransactions(trans, 'global')
      setStartBudget(info.startBudget)
      setEndBudget(info.endBudget)
      setMonthRes(info.resultBudget)

    }
    },[])

    const lossBarLabels = prepareBarTransactions(lossTrans).label
    const lossBarData = prepareBarTransactions(lossTrans).data
    const barLossData = prepareBarData(lossBarData, lossBarLabels)
    const gainBarLabels = prepareBarTransactions(gainTrans).label
    const gainBarData = prepareBarTransactions(gainTrans).data
    const barGainData = prepareBarData(gainBarData, gainBarLabels)

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
    const typeDatas = preparePieData([gainTrans.length, lossTrans.length], ['gains', 'losses'])
    const data = prepareLineData([gains, losses], allDates).data
    const options = prepareLineData([gains, losses], allDates).options
    const categorys = filtredCategorys(trans).categorys;     
    const categoryAmounts = filtredCategorys(trans).categoryAmounts; 
    const sortCategory = filtredCategorys(trans).sortCategory
    const showCategory = sortCategory.slice(0, 5).map((item, index) => {
      let number = 1
      return (
        <div
        key={item}>
          <span className='font-[700] '>{index + 1}</span>.{item[0]}-{item[1]}
        </div>
      )
    });
    const gainCategorys = preparePieTransactions(gainTrans).Categorys
    const gainAmounts = preparePieTransactions(gainTrans).Amounts
    const gainDoughuntData = prepareDoughnutData(gainAmounts, gainCategorys)
    const lossCategorys = preparePieTransactions(lossTrans).Categorys 
    const lossAmounts = preparePieTransactions(lossTrans).Amounts
    const lossDoughuntData = prepareDoughnutData(lossAmounts, lossCategorys)
    const data3 = prepareDoughnutData(categoryAmounts, categorys)

    return (
      
      <div className="header bg-dark m-auto flex justify-center flex-col pl-[100px] pr-[100px]">
       
        <div>

          <p className='opacity-[0.8]'>{`Your start Budget:${startBudget}$`}</p>
          <p className={`${endBudget > startBudget ? 'text-[green]': '[text-red]'} opacity-[0.8]`}>{`Your budget now:${endBudget}$`}</p>
          <p className={`${endBudget > startBudget ? 'text-[#bdffab]': 'text-[red]'} opacity-[0.8]`}><span className='text-[white]'>Result:</span>{`${monthRes}$`}</p>
        </div>
        <div className="w-full max-w-[1200px] h-[500px] m-auto border-[2px] border-[#5e5e5e] rounded-[10px] ">
          <Line className="w-full max-w-[1200px] h-[500px] m-auto" options={options} data={data} />
        </div>
        <div className='w-full max-w-[1200px] h-[500px] m-auto border-[2px] border-[#5e5e5e] rounded-[10px] mt-[10px]'>
           <Bar className="w-full max-w-[1200px] h-[500px] m-auto" data={barLossData}></Bar> 
        </div>
        <div className='w-full max-w-[1200px] h-[500px] m-auto border-[2px] border-[#5e5e5e] rounded-[10px] mt-[10px]'>
           <Bar className="w-full max-w-[1200px] h-[500px] m-auto" data={barGainData}></Bar> 
        </div>
        <div className='flex flex-col  w-[1000px] pt-[50px]'>
          <div className='flex flex-row'>
          <div className='border-[2px] border-[#5e5e5e] rounded-[10px] w-[50%]'>
          <Doughnut data={data3}></Doughnut>
          </div>
          <div className=' border-[2px] border-[#5e5e5e] rounded-[10px] w-[50%]'>
            <Pie className='' data={typeDatas}></Pie>
          </div>
          </div>
          <div className='flex flex-row mt-[10px] mb-[10px]'>
          <div className=' border-[2px] border-[#5e5e5e] rounded-[10px] w-[50%]'>
            <Doughnut className='' data={gainDoughuntData}></Doughnut> 
          </div>
          <div className=' border-[2px] border-[#5e5e5e] rounded-[10px] w-[50%]'>
            <Doughnut className='' data={lossDoughuntData}></Doughnut>
          </div>
          </div>
        </div>
        <div className='justify-center flex flex-col items-left pl-[300px] pr-[300px]'>
          <div className='border-[2px] border-[#5e5e5e] rounded-[10px] '>
          <p className='text-[20px] font-[800]'>Top 5 categories per month:</p>
            <p className='text-[19px] flex items-center flex-col'>{showCategory}</p>   
            </div>    
        </div>
      </div>
    );
}