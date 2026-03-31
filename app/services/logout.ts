import { useBankTransaction } from "../context/BankTransactionContext"
import { usePlan } from "../context/PlanContext"
import { useUI } from "../context/UIContext"
import { useAuthContext } from "../context/AuthContext"
import { useAuth } from "../hooks/useAuth"
import { useError } from "../context/ErrorContext"
import Cookies from "js-cookie"
const logout = async() =>{
    const {setTrans, setAnalyticTransactions, setBanks, setActiveBank, setBalance, setCurrency} = useBankTransaction()
    const {setPlans, setActivePlans, setActiveMonthPlan, setActivePlansStatus, setStoragePlans} = usePlan()
    const {setLogin} = useAuthContext()
    const {setModal} = useUI()
    const {setErrors} = useError();
    const logoutResponse = await fetch('api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    if (logoutResponse.ok) {
      const res = await fetch('api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) {
        return false
      } else {
        setPlans([]);
        setActivePlans([]);
        setStoragePlans([]);
        setActiveMonthPlan(null);
        setActivePlansStatus({
        daily: { status: false, id: 0 },
        weekly: { status: false, id: 0 },
        monthly: { status: false, id: 0 },
        yearly: { status: false, id: 0 }
        });
        setTrans({})
        setBanks([])
        setActiveBank({ name: '', id: '' })
        setAnalyticTransactions({})
        setBalance(0)
        setCurrency('RUB')
        setLogin('')
        Cookies.remove('ActiveBankId')
        localStorage.removeItem('favoriteRates')
        localStorage.removeItem('conversionHistory')
        localStorage.removeItem('activePlans')
        localStorage.removeItem('activePlansIds')
        localStorage.removeItem('banks_cache')
        Cookies.remove('info_token')
        Cookies.remove('Currency')
        Cookies.remove('accessToken')
        Cookies.remove('refreshToken')
        useAuth()
        setModal({type: '', payload: null})
        setErrors([])
        return true
      }
    } else {
      return false
    }
    
}
export default logout