import YearAnalyticsClient from './YearAnalyticsClient';
import { cookies } from 'next/headers';

async function getTransactions() {
  const login = cookies().get('info_token')?.value;
  const res = await fetch(`${process.env.API_URL}/transactions?login=${login}`);
  return res.json();
}

export default async function YearAnalyticsPage() {
  const initialData = await getTransactions();
  
  return <YearAnalyticsClient initialData={initialData} />;
}