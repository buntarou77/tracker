const FiltredTransactions = (transactions: any[], payload: any[] = []) => {
    if (transactions.length > 0) {
        const startDate = payload[0];
        const endDate = payload[1];
        const filteredTransactions = transactions.filter((item: any) => {
            const itemDate = new Date(item.date);
            return !isNaN(itemDate as any) && itemDate >= startDate && itemDate <= endDate;
        }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (filteredTransactions.length === 0) {
            return {
                frequencyHours: Array(24).fill(0),
                filteredTransactions,
                startBudget: 0,
                endBudget: 0,
                resultBudget: 0,
                lossTransactions: [],
                gainTransactions: []
            }
        }
        const startBudget = filteredTransactions[filteredTransactions.length - 1].balanceStatus;
        const last = filteredTransactions[0];
        const endBudget = last.balanceStatus + (last.type === 'gain' ? last.amount : -last.amount);
        const resultBudget = endBudget - startBudget;
        const gainTransactions = filteredTransactions.filter((item: any) => item.type === 'gain');
        const lossTransactions = filteredTransactions.filter((item: any) => item.type === 'loss');
        const frequencyHours = Array(24).fill(0);

        filteredTransactions.forEach((item: any) => {
            const fullTime = new Date(item.date);
            const time = fullTime.getHours();
            const indexHour = Number(time);
            frequencyHours[indexHour] += 1;
        });
        
        return {
            frequencyHours,
            filteredTransactions,
            startBudget,
            endBudget,
            resultBudget,
            lossTransactions,
            gainTransactions
        }
    } else {
        console.error('add transactions');
        return 'error';
    }
}
const filtredCategorys = (transactions: { category: string; amount: number }[]) => {
    const categorySums: { [key: string]: number } = {};

    for (let i = 0; i < transactions.length; i++) {
        const { category, amount } = transactions[i];
        if (categorySums[category]) {
            categorySums[category] += amount;
        } else {
            categorySums[category] = amount;
        }
    }
    const categorysItems: { [key: string]: any[] } = {};
    for(let i = 0; i < transactions.length; i++){
        if(categorysItems[transactions[i].category]){
            categorysItems[transactions[i].category].push(transactions[i])
        }else{
            categorysItems[transactions[i].category] = [transactions[i]]
        }
    }
    const sortCategory = Object.entries(categorySums).sort((a, b) => b[1] - a[1]);
    const categorys = Object.keys(categorySums);
    const categoryAmounts = Object.values(categorySums);
    return { categorys, categoryAmounts, sortCategory, categorysItems};
}
export {filtredCategorys, FiltredTransactions}
