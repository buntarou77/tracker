'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Динамический импорт тяжёлых графиков
const LineChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { 
  ssr: false,
  loading: () => <div className="h-[500px] bg-gray-100 animate-pulse" />
});

const PieChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), { 
  ssr: false 
});
const DoughuntChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { 
  ssr: false 
});
const BarChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { 
  ssr: false 
});


export default function YearAnalyticsClient({ initialData }) {
    const [trans, setTrans] = useState(initialData.transactions || []);
    const [submited, setSubmited] = useState(false);
    const [submitedYear, setSubmitedYear] = useState<string>('');
    const [startBudget, setStartBudget] = useState(0);
    const [endBudget, setEndBudget] = useState(0);
    const [monthRes, setMonthRes] = useState(0);
}