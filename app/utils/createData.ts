const prepareBarTransactions = (data: any[], yearData = '2025')=>{
    const monthsGainAmounts: Record<string, number> = {};
    for (let i = 0; i < data.length; i++) {
      const { amount, date } = data[i];
      const month = date.split('-')[1];
      const year = date.split('-')[0];
      if(year === yearData){
        switch (month){
          case '01':
            monthsGainAmounts['January'] = (monthsGainAmounts['January'] || 0) + amount;
            break;
          case '02':
            monthsGainAmounts['February'] = (monthsGainAmounts['February'] || 0) + amount;
            break;
          case '03':
            monthsGainAmounts['March'] = (monthsGainAmounts['March'] || 0) + amount;
            break;
          case '04':
            monthsGainAmounts['April'] = (monthsGainAmounts['April'] || 0) + amount;
            break;
          case '05':
            monthsGainAmounts['May'] = (monthsGainAmounts['May'] || 0) + amount;
            break;
          case '06':
            monthsGainAmounts['June'] = (monthsGainAmounts['June'] || 0) + amount;
            break;
          case '07':
            monthsGainAmounts['July'] = (monthsGainAmounts['July'] || 0) + amount;
            break;
          case '08':
            monthsGainAmounts['August'] = (monthsGainAmounts['August'] || 0) + amount;
            break;
          case '09':
            monthsGainAmounts['September'] = (monthsGainAmounts['September'] || 0) + amount;
            break;
          case '10':
            monthsGainAmounts['October'] = (monthsGainAmounts['October'] || 0) + amount;
            break;
          case '11':
            monthsGainAmounts['November'] = (monthsGainAmounts['November'] || 0) + amount;
            break;
          case '12':
            monthsGainAmounts['December'] = (monthsGainAmounts['December'] || 0) + amount;
            break;
          default:
    
        }
      }
    }
    return{
        label: Object.keys(monthsGainAmounts),
        data: Object.values(monthsGainAmounts),
    }
}
const prepareMonthBarData= (data: any[])=>{
    const monthsGainAmounts: Record<number, number> = {};

    for (let i = 0; i < data.length; i++) {
      const { amount, date , numeralAmount} = data[i];
      const day = new Date(date).getDate();
      monthsGainAmounts[day] = (monthsGainAmounts[day] || 0) + amount || numeralAmount;
    }
    return{
        label: Object.keys(monthsGainAmounts),
        data: Object.values(monthsGainAmounts),
    }

}
const preparePieTransactions = (data: any[])=>{
        const gainCategorySums: Record<string, number> = {};
    data.forEach(({ category, amount }: { category: string; amount: number }) => {
      gainCategorySums[category] = (gainCategorySums[category] || 0) + amount;
    });
    const Categorys = Object.keys(gainCategorySums);   
    const Amounts = Object.values(gainCategorySums);
    return {Categorys, Amounts}
}
const getMonth = (monthIndex: number)=>{
  const months = [
    'January',
    'February', 
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  
  return months[monthIndex] || 'Invalid month';
}
export {preparePieTransactions,getMonth, prepareBarTransactions, prepareMonthBarData}