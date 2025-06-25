const prepareBarTransactions = (data, yearData = '2025')=>{
    const monthsGainAmounts = {};
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
            console.log('Неправильный месяц');
        }
      }
    }
    return{
        label: Object.keys(monthsGainAmounts),
        data: Object.values(monthsGainAmounts),
    }
}
const prepareMonthBarData= (data)=>{
    const monthsGainAmounts = {};

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
const preparePieTransactions = (data)=>{
        const gainCategorySums = {};
    data.forEach(({ category, amount }) => {
      gainCategorySums[category] = (gainCategorySums[category] || 0) + amount;
    });
    const Categorys = Object.keys(gainCategorySums);   
    const Amounts = Object.values(gainCategorySums);
    return {Categorys, Amounts}
}
const getMonth = (dateStr)=>{
  const month = dateStr.split('-')[1];
  switch (month) {
    case '1':
      return 'January';
    case '2':
      return 'February';
    case '3':
      return 'March';
    case '4':
      return 'April';
    case '5':
      return 'May';
    case '6':
      return 'June';
    case '7':
      return 'July';
    case '8':
      return 'August';
    case '9':
      return 'September';
    case '10':
      return 'October';
    case '11':
      return 'November';
    case '12':
      return 'December';
  }
}
export {preparePieTransactions,getMonth, prepareBarTransactions, prepareMonthBarData}