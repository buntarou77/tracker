'use client'
import { useCallback, useEffect, useState, useRef } from 'react';
import { useAuth } from "../hooks/useAuth";
import Cookies from 'js-cookie';

export default function Operations() {
    const [items, setItems] = useState<any[]>([]);
    const [login, setLogin] = useState<string>('');
    const [show, setShow] = useState<boolean>(false);
    const [shouldAnimate, setShouldAnimate] = useState<boolean>(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [balance, setBalance] = useState<{}>();
    const [loadingCurrency, setLoadingCurrency] = useState<string>('');
    const [transactionType, setTransactionType] = useState<'loss' | 'gain'>('loss');
    const auth = useAuth();
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (show && formRef.current && !formRef.current.contains(event.target as Node)) {
                setShow(false);
                setShouldAnimate(false);
            }
        };
        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [show]);
    useEffect(() => {
        const token = Cookies.get('info_token');
        const activeBank = JSON.parse(Cookies.get('ActiveBank'))
        console.log(activeBank)
        setLogin(token || '');
        async function getRedis(){
          try{
            const res = await fetch(`api/getTransRedis?login=${token}&bankName=${activeBank.name}`, {
              method: 'GET'
            })
            if(res.ok){
              const data = await res.json();
              const upatedTransactions = [Object.values(data.value).flat()]
              console.log(upatedTransactions[0].length)
              setItems(upatedTransactions[0])
            }
          }catch(e){
            console.log(e)
          }finally{
            setLoadingCurrency('') 
          }
        }
        if (token) {
          getRedis()
        }
        async function getBalance() {
          setLoadingCurrency('loading')
          try{
            const bankCookies = Cookies.get('ActiveBank')
            const bank = JSON.parse(bankCookies)
           const response = await fetch(`/api/getBalanceRedis?login=${token}&bankName=${bank.name}`, {
             method: 'GET'
           })
           if (response.ok) {
             setLoadingCurrency('')
             const data = await response.json();
             console.log(data)
             Cookies.set(`bank_account_${token}`, data.value)
             setBalance(data.value);
           }
         }catch(e){
          setLoadingCurrency('error')
          console.log(e)
        }
      }
      getBalance()
    }, []);
    const addTransaction = async (amount: any, category: any, date: any, login: any, type: any) => {
      try {
        console.log(amount)
        const activeBank = JSON.parse(Cookies.get('ActiveBank') || '{}');
          const response = await fetch('/api/addTrans', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  amount,
                  category,
                  date,
                  login,
                  balance: balance || 0,
                  type,
                  bankName: activeBank.name
              })
          });
  
          if (response.ok) {
              if(type === 'gain'){
              setBalance(prev=> Number(prev) + Number(amount));
              console.log(new Date(date))
              const fullTime = new Date(date).getHours()
              console.log(fullTime)
              const balanceToken  = Cookies.get(`bank_account_${login}`)
              Cookies.set(`bank_account_${login}`, Number(balanceToken) + Number(amount))
              }else{
              setBalance(prev=> Number(prev) - Number(amount))
              const balanceToken  = Cookies.get(`bank_account_${login}`)
              Cookies.set(`bank_account_${login}`, Number(balanceToken) - Number(amount))

            }
  
              const token = Cookies.get('info_token');
              const transResponse = await fetch(`/api/getTrans?login=${token}&bankName=${activeBank.name}`);
              if (transResponse.ok) {
                  setItems((await transResponse.json()).transactions || []);
              }
          }
      } catch (error) {
          console.error('Ошибка:', error);
      }
  };
    const handleToggle = useCallback(() => {
        setShow(prev => !prev);
        setShouldAnimate(prev => !prev);
    }, []);
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const amount = formData.get('amount');
        const category = formData.get('category');
        const date = formData.get('date');
      
        if (amount && category && date && login) {
          addTransaction(amount, category, date, login, transactionType);
          setItems(prevItems => [...prevItems, { amount, category, date, type: transactionType }]);
        }
    };
    const transactions = [...items]
        .filter(item => !isNaN(new Date(item.date)))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((item, index) => {
            return (
              <div
              key={item.id || index}
              className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-[8px] p-[12px] mb-[10px] border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col text-sm">
                <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">${item.numeralAmount || item.amount}</span>
              </div>
              <div className="flex flex-col text-sm">
                <span className="text-gray-500 dark:text-gray-400">Category:</span>
                <span className="capitalize text-gray-800 dark:text-gray-200">{item.category}</span>
              </div>
              <div className="flex flex-col text-sm">
                <span className="text-gray-500 dark:text-gray-400">type:</span>
                <span className={` ${item.type === 'gain' ? '!text-[green]': '!text-[gray]'}`}>{item.type}</span>
              </div>
              <div className="flex flex-col text-sm">
                <span className="text-gray-500 dark:text-gray-400">Date:</span>
                <span className="text-gray-700 dark:text-gray-300">{new Date(item.date).toLocaleDateString()}</span>
              </div>
              <button
                onClick={() => delTransaction(item.id, Number(item.numeralAmount || item.amount), item.type, item.date)}
                className="ml-4 px-[10px] py-[5px] text-red-500 border border-red-500 rounded-[6px] cursor-pointer hover:bg-[orange] hover:text-white text-sm transition"
              >
                Delete
              </button>
            </div>
            );
        });
    const delTransaction = async (id: any, amount: any, type: any, date: any) =>{ 
      try{
        const activeBank = JSON.parse(Cookies.get('ActiveBank') || '{}');
        const info = `${login}:${id}:${amount}:${balance}:${type}:${date}:${activeBank.name}`
        console.log(info)
        const response = await fetch(`api/delTrans?info=${info}`, {
          method: 'DELETE'
        })
        if(response.ok){
          console.log(type)
        if(type === 'loss'){
          setBalance((prev) => ({
            ...prev,
            balance: (prev.balance ?? 0) + amount
          }));
        }else{
        setBalance((prev) => ({
          ...prev,
          balance: (prev.balance ?? 0) - amount
        }));
      }
          console.log('transaction is deleted!')  
          setItems((prev)=> prev.filter(item=> item.id != id))
        }else{
          console.log('something wrong(')
        }

      }catch(e){
        console.log(e)
      }
    }
    console.log(balance)
    const numeralBalane = Number(balance)
    return (
        <div className="w-[1200px] m-auto p-[40px] input">
              <div className="flex flex-col items-center text-center space-y-[10px] mb-[40px]">
                <h2 className="text-[24px] font-bold text-white">
                  Welcome to your personal financial tracker!
                </h2>
                <h3 className="text-[16px] text-gray-300">
                  Start adding your financial transactions and see how best to distribute your budget.
                </h3>
              </div>
              <div className="w-full border border-white  rounded-[5px] p-[20px] bg-[#1e1e1e] shadow-[0_0_20px_rgba(255,255,255,0.1)] relative">
                <div className="mb-[20px] flex flex-row gap-[20px]">
                  <button
                    onClick={handleToggle}
                    className="h-[40px] w-[40px] flex items-center justify-center text-[24px] font-bold bg-[#0a0a0a] text-[white] border-2 border-[#777777] rounded-[10px] hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-shadow duration-300 cursor-pointer"
                  >
                    +
                  </button>
                  <p>{`your balance:${numeralBalane}`}</p>
                  <form
                    ref={formRef}
                    onSubmit={handleSubmit}
                    className={`absolute top-[30px] left-[60px] flex flex-col items-center space-y-[12px] p-[20px] border-2 border-[#6e6e6e] bg-[#4d4d4d] rounded-[10px] shadow-[0_0_25px_rgba(0,0,0,0.4)] transition-all duration-300 ${
                      show ? 'flex' : 'hidden'
                    } ${shouldAnimate ? 'fadeIn' : ''}`}>
                    <p className="text-white">Type of transaction?</p>
                    <div className="flex gap-[30]">
                      <button
                        type="button"
                        onClick={() => setTransactionType('loss')}
                        className={`px-3 py-1 rounded border-2 ${
                          transactionType === 'loss'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-transparent text-white border-gray-400'
                        }`}
                      >
                        Loss
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransactionType('gain')}
                        className={`px-3 py-1 rounded border-2 ${
                          transactionType === 'gain'
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-transparent text-white border-gray-400'
                        }`}
                      >
                        Gain
                      </button>
                    </div>
                    <p className="text-white">Your amount</p>

                    <input
                      type="text"
                      name="amount"
                      className="w-[250px] p-[8px] text-black rounded-[5px] border-2 border-[#777777] bg-white"
                      required
                    />
                    <p className="text-white">Your category</p>
                    <select
                      name="category"
                      id="category"
                      className="w-[250px] p-[8px] rounded-[5px] border-2 border-[#777777] bg-white text-black"
                    >
                      <option value="housing">Housing</option>
                      <option value="utilities">Utilities</option>
                      <option value="food">Food</option>
                      <option value="transport">Transportation</option>
                      <option value="health">Health</option>
                      <option value="clothing">Clothing</option>
                      <option value="personal_care">Personal Care</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="travel">Travel</option>
                      <option value="hobbies">Hobbies</option>
                      <option value="communication">Phone/Internet</option>
                      <option value="subscriptions">Subscriptions</option>
                      <option value="savings">Savings</option>
                      <option value="investments">Investments</option>
                      <option value="insurance">Insurance</option>
                      <option value="family">Family</option>
                      <option value="gifts">Gifts</option>
                      <option value="charity">Charity</option>
                      <option value="education">Education</option>
                      <option value="taxes">Taxes</option>
                      <option value="other">Other</option>
                      <option value="another">Another</option>
                    </select>

                    <p className="text-white">Date</p>
                    <input
                      type="date"
                      name="date"
                      className="w-[250px] p-[8px] text-black rounded-[5px] border-2 border-[#777777] "
                    />
                    <button
                      type="submit"
                      className="w-[250px] p-[8px] mt-[10px] text-black border-2 border-[#777777] rounded-[5px] bg-white hover:bg-gray-100 transition"
                    >
                      Add
                    </button>
                  </form>
                </div>
                <div className="mt-[30px] border-1 border-[#6e6e6e] p-[10px] rounded-[10px] gap-[2px] flex flex-col">{items.length > 0 ? transactions : 
                  <p className=' flex flex-col items-center'>{`you didnt add transaction(`}</p>}</div>
              </div>
            </div>
    );
}