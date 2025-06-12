

const FiltredTransactions = (transactions, method, payload = [])=>{
    if(method === 'global' && transactions.length > 0){
        const endBudget = transactions[transactions.length - 1].lastBudget
        const startBudget = transactions[0].newBalance
        const resultBudget = endBudget - startBudget
        const gainTransactions = transactions.filter((item) => item.type === 'gain');
        const lossTransactions = transactions.filter((item) => item.type === 'loss');
        return {
            startBudget,
            endBudget,
            resultBudget,
            lossTransactions,
            gainTransactions
        }
    }
        if(transactions.length > 0 ){    
        const startDate = payload[0]
        const endDate = payload[1]
        const filteredTransactions = transactions.filter(item => {
        const itemDate = new Date(item.date);
        return !isNaN(itemDate) && itemDate >= startDate && itemDate <= endDate;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
        const startBudget = filteredTransactions[filteredTransactions.length - 1].newBalance
        const endBudget = filteredTransactions[0].newBalance
        const resultBudget = endBudget - startBudget
        const gainTransactions = filteredTransactions.filter((item) => item.type === 'gain');
        const lossTransactions = filteredTransactions.filter((item) => item.type === 'loss');
        return {
            filteredTransactions,
            startBudget,
            endBudget,
            resultBudget,
            lossTransactions,
            gainTransactions
        }
    }else{
        console.error('add transactions');
        return 'error'
    }
}
const filtredCategorys = (transactions )=>{
     const categorySums = {};
  
    for (let i = 0; i < transactions.length; i++) {
      const { category, amount } = transactions[i];
      
      if (categorySums[category]) {
        categorySums[category] += amount;
      } else {
        categorySums[category] = amount;
      }
    }
    const sortCategory = Object.entries(categorySums).sort((a, b) => b[1] - a[1]);
    const categorys = Object.keys(categorySums);        
    const categoryAmounts = Object.values(categorySums); 
    return {categorys, categoryAmounts, sortCategory}
}
export {filtredCategorys, FiltredTransactions}
