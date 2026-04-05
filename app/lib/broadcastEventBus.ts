import { TransactionType } from '../types/shared/transactions';
import { useBankTransaction } from '../context/BankTransactionContext';
import { usePlan } from '../context/PlanContext';
import logout from '../services/logout';
import { useAuthContext } from '../context/AuthContext';
export default function broadcastEventBus(
  event: { type: string; payload: any }
) {
  const {
    trans,
    setTrans,
    setAnalyticTransactions,
    analyticTransactions,
    setBalance,
    balance,
    activeBank,
    setActiveBank,
    banks,
    setBanks,
    setExchangeRates,
    currency,
    setCurrency,
  } = useBankTransaction();

  const {
    plans,
    setPlans,
    activePlans,
    setActivePlans,
    activeMonthPlan,
    setActiveMonthPlan,
    activePlansStatus,
    setActivePlansStatus,
    storagePlans,
    setStoragePlans,
  } = usePlan();

  const { setLogin } = useAuthContext();
  switch (event.type) {
    case 'ADD_TRANSACTION': {
      const newTransaction: TransactionType = event.payload;

      const newBalance =
        newTransaction.type === 'gain'
          ? balance + newTransaction.amount
          : balance - newTransaction.amount;

      setBalance(newBalance);

      let updatedTrans: any[];
      if (trans.length > 0) {
        const insertIndex = trans.findIndex(
          (item: TransactionType) =>
            +new Date(item.date) < +new Date(newTransaction.date)
        );

        if (insertIndex === -1) {
          updatedTrans = [...trans, newTransaction];
        } else {
          updatedTrans = [
            ...trans.slice(0, insertIndex),
            newTransaction,
            ...trans.slice(insertIndex),
          ];
        }
        setTrans(updatedTrans);
      } else {
        setTrans([newTransaction]);
      }

      const analyticKey = `${new Date(newTransaction.date).getFullYear()}-${
        new Date(newTransaction.date).getMonth() + 1
      }`;

      const hasCurrentMonth = Object.keys(analyticTransactions).includes(
        analyticKey
      );

      if (Object.keys(analyticTransactions).length > 0 && hasCurrentMonth) {
        setAnalyticTransactions({
          ...analyticTransactions,
          [analyticKey]: [
            ...(analyticTransactions[analyticKey] || []),
            newTransaction,
          ],
        });
      } else {
        setAnalyticTransactions({
          ...analyticTransactions,
          [analyticKey]: [newTransaction],
        });
      }

      break;
    }

    case 'DELETE_TRANSACTION': {
      const transactionId: string = event.payload;

      const transactionToDelete = trans.find(t => t.id === transactionId);

      if (!transactionToDelete) {
        break;
      }

      const updatedTrans = trans.filter(t => t.id !== transactionId);
      setTrans(updatedTrans);

      const newBalance =
        transactionToDelete.type === 'gain'
          ? balance - transactionToDelete.amount
          : balance + transactionToDelete.amount;

      setBalance(newBalance);

      const transactionDate = new Date(transactionToDelete.date);
      const analyticKey = `${transactionDate.getFullYear()}-${
        transactionDate.getMonth() + 1
      }`;

      if (analyticTransactions[analyticKey]) {
        const updatedMonth = analyticTransactions[analyticKey].filter(
          t => t.id !== transactionId
        );

        if (updatedMonth.length === 0) {
          const updatedAnalytics = { ...analyticTransactions };
          delete updatedAnalytics[analyticKey];
          setAnalyticTransactions(updatedAnalytics);
        } else {
          setAnalyticTransactions({
            ...analyticTransactions,
            [analyticKey]: updatedMonth,
          });
        }
      }

      break;
    }

    case 'SWITCH_BANK': {
      const bank = event.payload;

      setActiveBank({
        name: bank.name,
        id: bank.id,
      });

      const bankCurrency = bank.currency || 'USD';
      setCurrency(bankCurrency);

      break;
    }

    case 'ADD_BANK': {
      const newBank = event.payload;

      const updatedBanks = [...banks, newBank];
      setBanks(updatedBanks);

      break;
    }

    case 'DELETE_BANK': {
      const bankId: string = event.payload;

      const updatedBanks = banks.filter(bank => bank.id !== bankId);
      setBanks(updatedBanks);

      if (activeBank.id === bankId) {
        if (updatedBanks.length > 0) {
          const firstBank = updatedBanks[0];
          setActiveBank({
            name: firstBank.name,
            id: firstBank.id,
          });
          setCurrency(firstBank.currency || 'USD');
        } else {
          setActiveBank({ name: '', id: '' });
          setCurrency('USD');
        }
      }

      break;
    }

    case 'CHANGE_CURRENCY': {
      const newCurrency: string = event.payload;
      setCurrency(newCurrency);

      break;
    }

    case 'SYNC_TRANSACTIONS': {
      const newTransactions = event.payload;
      setTrans(newTransactions);

      break;
    }

    case 'SYNC_BALANCE': {
      const newBalance = event.payload;
      setBalance(newBalance);

      break;
    }

    case 'SYNC_BANKS': {
      const newBanks = event.payload;
      setBanks(newBanks);

      break;
    }

    case 'ADD_PLAN': {
      const newPlan = event.payload;
      const updatedPlans = [...plans, newPlan];
      setPlans(updatedPlans);

      break;
    }

    case 'DELETE_PLAN': {
      const planId: string = event.payload;

      const planToDelete = plans.find(plan => plan.id === planId || plan._id === planId);

      if (!planToDelete) {
        break;
      }

      const updatedPlans = plans.filter(
        plan => plan.id !== planId && plan._id !== planId
      );
      setPlans(updatedPlans);

      const updatedActivePlans = activePlans.filter(
        plan => plan.id !== planId && plan._id !== planId
      );
      setActivePlans(updatedActivePlans);

      const updatedStoragePlans = storagePlans.filter(
        plan => plan.id !== planId && plan._id !== planId
      );
      setStoragePlans(updatedStoragePlans);

      const frequency = planToDelete.frequency;
      const updatedActivePlansStatus = { ...activePlansStatus };

      if (updatedActivePlansStatus[frequency]) {
        updatedActivePlansStatus[frequency] = {
          status: false,
          id: 0,
        };
      }

      setActivePlansStatus(updatedActivePlansStatus);

      if (activeMonthPlan && (activeMonthPlan.id === planId || activeMonthPlan._id === planId)) {
        setActiveMonthPlan(null);
      }
      break;
    }

    case 'UPDATE_PLAN': {
      const updatedPlan = event.payload;
      const planId = updatedPlan.id || updatedPlan._id;

      const updatedPlans = plans.map(plan => 
        (plan.id === planId || plan._id === planId) ? updatedPlan : plan
      );
      setPlans(updatedPlans);

      const updatedActivePlans = activePlans.map(plan => 
        (plan.id === planId || plan._id === planId) ? updatedPlan : plan
      );
      setActivePlans(updatedActivePlans);

      const updatedStoragePlans = storagePlans.map(plan => 
        (plan.id === planId || plan._id === planId) ? updatedPlan : plan
      );
      setStoragePlans(updatedStoragePlans);

      if (activeMonthPlan && (activeMonthPlan.id === planId || activeMonthPlan._id === planId)) {
        setActiveMonthPlan(updatedPlan);
      }
      break;
    }

    case 'ACTIVATE_PLAN': {
      const planId: string = event.payload;

      const planToActivate = plans.find(plan => plan.id === planId || plan._id === planId);

      if (!planToActivate) {
        break;
      }

      const isAlreadyActive = activePlans.some(
        plan => plan.id === planId || plan._id === planId
      );

      if (!isAlreadyActive) {
        setActivePlans([...activePlans, planToActivate]);
      }

      const frequency = planToActivate.frequency;
      const updatedActivePlansStatus = {
        ...activePlansStatus,
        [frequency]: {
          status: true,
          id: planToActivate._id || planToActivate.id,
        },
      };

      setActivePlansStatus(updatedActivePlansStatus);

      if (frequency === 'monthly') {
        setActiveMonthPlan(planToActivate);
      }

      const activePlansIds = activePlans.map(p => p.id || p._id);
      if (!activePlansIds.includes(planId)) {
        activePlansIds.push(planId);
      }
      localStorage.setItem('activePlansIds', JSON.stringify(activePlansIds));
      break;
    }

    case 'DEACTIVATE_PLAN': {
      const planId: string = event.payload;

      const planToDeactivate = plans.find(plan => plan.id === planId || plan._id === planId);

      if (!planToDeactivate) {
        break;
      }

      const updatedActivePlans = activePlans.filter(
        plan => plan.id !== planId && plan._id !== planId
      );
      setActivePlans(updatedActivePlans);

      const frequency = planToDeactivate.frequency;
      const updatedActivePlansStatus = {
        ...activePlansStatus,
        [frequency]: {
          status: false,
          id: 0,
        },
      };

      setActivePlansStatus(updatedActivePlansStatus);

      if (activeMonthPlan && (activeMonthPlan.id === planId || activeMonthPlan._id === planId)) {
        setActiveMonthPlan(null);
      }

      const activePlansIds = activePlans
        .map(p => p.id || p._id)
        .filter(id => id !== planId);
      localStorage.setItem('activePlansIds', JSON.stringify(activePlansIds));
      break;
    }

    case 'CHANGE_ACTIVE_MONTH_PLAN': {
      const planId: string = event.payload;

      const newMonthPlan = plans.find(plan => plan.id === planId || plan._id === planId);

      if (!newMonthPlan) {
        setActiveMonthPlan(null);
        break;
      }

      setActiveMonthPlan(newMonthPlan);

      const updatedActivePlansStatus = {
        ...activePlansStatus,
        monthly: {
          status: true,
          id: newMonthPlan._id || newMonthPlan.id,
        },
      };

      setActivePlansStatus(updatedActivePlansStatus);
      break;
    }

    case 'SYNC_PLANS': {
      const newPlans = event.payload;
      setPlans(newPlans);

      break;
    }

    case 'SYNC_ACTIVE_PLANS': {
      const newActivePlans = event.payload;
      setActivePlans(newActivePlans);

      break;
    }

    case 'SYNC_ACTIVE_PLANS_STATUS': {
      const newStatus = event.payload;
      setActivePlansStatus(newStatus);

      break;
    }

    case 'SYNC_STORAGE_PLANS': {
      setStoragePlans(event.payload);
      break;
    }

    case 'SYNC_ANALYTICS': {
      setAnalyticTransactions(event.payload);
      break;
    }

    case 'SYNC_ACTIVE_MONTH_PLAN': {
      const p = event.payload;
      if (p == null) {
        setActiveMonthPlan(null);
        break;
      }
      if (typeof p === 'object') {
        setActiveMonthPlan(p);
        const freq = (p as { frequency?: string }).frequency;
        if (freq && activePlansStatus[freq as keyof typeof activePlansStatus]) {
          setActivePlansStatus({
            ...activePlansStatus,
            [freq]: {
              status: true,
              id: (p as { _id?: string; id?: string })._id || (p as { id?: string }).id,
            },
          });
        }
      }
      break;
    }

    case 'SYNC_EXCHANGE_RATES': {
      setExchangeRates(event.payload);
      break;
    }

    case 'LOGOUT':{
      logout();
      break;
    }
    case 'LOGIN': {
      const login = event.payload.login;
      setLogin(login);
      break;
    }

    default:
      console.warn('Unknown event type:', event.type);
  }
}