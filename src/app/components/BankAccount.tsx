'use client'
import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { useApp } from '../context/AppContext';

type BankAccountType = {
  name: string;
  balance: string;
  currency: string;
  notes?: string;
  active?: boolean;
  login?: string; 
  id?: string;
};

const BankAccount = () => {
    const login = Cookies.get('info_token');
    const cookieName = `bank_account_${login}`;
    const lastValue = useRef(Cookies.get(cookieName));
    const activeBankCookies = Cookies.get('ActiveBank')
    const [isAccountsVisible, setIsAccountsVisible] = useState(false);
    const [addBankAccountForm, setAddBankAccountForm] = useState(false);
    // const [activeBank, setActiveBank] = useState<BankAccountType>({name: '', balance: '', currency: '', notes: '', active: false});
    const [newAccount, setNewAccount] = useState<BankAccountType>({name: '', balance: '', currency: 'RUB', notes: '', active: false, login: login});
    const [tooManyBankAccounts, setToManyBankAccounts] = useState<boolean>(false)
    const {bankNames, setBankNames, setTrans, setActiveBank, activeBank, balance, setBalance, currency, setCurrency} = useApp()
    console.log(activeBank)
    useEffect(() => {
      if(login){
      if(activeBankCookies){
        const bank = JSON.parse(activeBankCookies)
        setActiveBank({name : bank.name, id: bank.id || ''})
        setBalance(bank.balance || 0)
        setCurrency(bank.currency || 'RUB')
      }else if(bankNames && bankNames.length > 0){
        const firstBank = bankNames[0]
        setActiveBank({name: firstBank.name, id: firstBank.id || ''})
        setBalance(firstBank.balance || 0)
        setCurrency(firstBank.currency || 'RUB')           
        Cookies.set('ActiveBankName', JSON.stringify(firstBank.name))
      }else{
        setActiveBank({name: '', id: ''})
        setBalance(0)
        setCurrency('RUB')
      }
    }
    }, [bankNames, login, activeBankCookies, setActiveBank, setBalance, setCurrency])
    
    useEffect(()=>{
      const times = setTimeout(()=>{
        setToManyBankAccounts(false)
      }, 7000)
      return ()=> clearTimeout(times)
    },[tooManyBankAccounts])
    const toggleAccountsVisibility = () => {
        setIsAccountsVisible(!isAccountsVisible);
    };
    const addBankAccount = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if(bankNames.length >= 6){
        setToManyBankAccounts(true)
      }else{
        try{
          if(!newAccount.name || !newAccount.currency || !newAccount.balance ){
            alert('Please fill in all fields')
          }else{
            const response = await fetch(`/api/addNewAccountRedis?login=${login}`,
              {method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(
               newAccount
           )})
           if(response.status === 201){
            try{
              const res = await fetch(`/api/revalidateBankNamesRedis?login=${login}`, 
                {method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({login})
              })
              if(res.ok){
                const bankNames = await res.json()
                console.log(bankNames)
                setBankNames(bankNames.freshData)
                console.log('revalidate')
              }else{
                throw 'error'
              }
            }catch(e){
              console.log(e)
            }
            setBankNames([...bankNames, newAccount])
           }else{
            throw 'error'
           }
          }
        }catch(error){
          console.log(error)
        }
      }
    }
    useEffect(()=>{
      async function getTrans(){
        const response = await fetch(`/api/getTransRedis?login=${login}&bankName=${activeBank.name}`, {
          method: 'GET'
        })
        if(response.ok){
          const transData = await response.json()
          setTrans(transData.value)
        }
      }
      getTrans()
    },[activeBank])
    const deleteAccount = async (accountName: string, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (window.confirm(`Are you sure you want to delete the account "${accountName}"?`)) {
        try {
          const response = await fetch(`/api/deleteAccountRedis?login=${encodeURIComponent(login || '')}&accountName=${encodeURIComponent(accountName)}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log(result)
            setBankNames(bankNames.filter(account => account.name !== accountName));

            if (activeBank.name === accountName) {
              setActiveBank({name: '', id: ''});
              setBalance(0);
              setCurrency('RUB');
            }
            console.log('Account successfully deleted:', result);
          } else {
            const errorData = await response.json();
            alert(`Error deleting account: ${errorData.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.log(error);
          alert('Error deleting account');
        }
      }
    };
    const bankToActive = (bank: BankAccountType) =>{
      setActiveBank({name: bank.name, id: bank.id || ''})
      setBalance(Number(bank.balance) || 0)
      setCurrency(bank.currency || 'RUB')
      console.log(bank)
      Cookies.remove('ActiveBankName')
      Cookies.set('ActiveBankName', bank.name)
    }
    const handleAccountsClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation(); 
    };
    return (
        <div className={`absolute right-0 flex items-center h-full pr-3 z-50 w-max-[180px] h-[60%]   flex-col justify-start`}>
            <div 
                className={`bg-gradient-to-r from-gray-800/80 to-gray-700/70 text-white px-3 w-[200px]   ${addBankAccountForm ? 'w-[250px]' : ''} m-[5px] py-1.5 rounded-lg shadow flex items-start justify-start gap-2 flex-col min-w-[180px] border border-gray-600 backdrop-blur-sm transition-all duration-200 hover:scale-100 cursor-pointer`} 
                onClick={toggleAccountsVisibility}
            >
                <div className='flex items-center justify-start'>
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-900/40 mr-1">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex flex-col items-start justify-center gap-0.5">
                      <div className='flex gap-1 items-center'>
                        <span className="font-medium text-xs text-white/40 tracking-wide">{login}:</span>
                        <span className="font-bold text-[75%] text-white/90 leading-tight">{activeBank.name || "No name"}</span>
                        </div>
                        <div className="flex items-end gap-1 mt-0.5">
                            <span className={`font-extrabold text-[80%] ${Number(balance) >= 0 ? "text-green-300" : "text-red-400"} drop-shadow`}>
                                {balance || "0"}
                                <span className="text-xs text-white/60 font-semibold pb-0.5">
                                {currency === "RUB" ? "₽" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency}
                            </span>
                            </span> 
                        
                        </div>
                    </div>
                </div>
                
                {isAccountsVisible && (
                    <div 
                        className="mt-2 w-full bg-[#232336] border border-gray-700 rounded-xl shadow-xl p-3 flex flex-col items-stretch animate-fade-in"
                        onClick={handleAccountsClick}
                    >
                        <h3 className="font-bold text-base text-white/80 mb-2 pl-1">Accounts</h3>
                        <ul className="mb-2">
                            {bankNames.length > 0 ? (
                                bankNames.map((account, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-[#2e2e4d] transition-all duration-200 group"
                                        onClick={()=> bankToActive(account)}
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className={`inline-block w-2 h-2 ${account.name === activeBank.name ? 'bg-green-400' : 'bg-gray-600'} rounded-full`}></span>
                                            <div className="flex flex-col">
                                                <span className="text-white text-sm font-medium">{account.name}</span>
                                                <span className="text-white/60 text-xs">
                                                    {account.balance} {account.currency === "RUB" ? "₽" : account.currency === "USD" ? "$" : account.currency === "EUR" ? "€" : account.currency}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={(e) => deleteAccount(account.name, e)}
                                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 transform hover:scale-110 active:scale-95"
                                            title="Delete account"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li className="py-1 text-gray-400 text-sm pl-2">No accounts</li>
                            )}
                        </ul>
                        {addBankAccountForm ? (
                        <div className="p-2 border-t border-gray-700 w-[200px] max-w-xs mx-auto">
                          <form  className="space-y-2 w-full" onSubmit={(e)=> addBankAccount(e)}>
                            <input
                              type="text"
                              placeholder="Account name"
                              className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:ring-1 focus:ring-green-500 focus:outline-none"
                              onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                              required
                            />
                            <textarea
                              placeholder="Notes for account"
                              className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:ring-1 focus:ring-green-500 focus:outline-none"
                              rows={2}
                              onChange={(e) => setNewAccount({...newAccount, notes: e.target.value})}
                              value={newAccount.notes || ''}
                            />
                            <div className="flex gap-1">
                              <input
                                type="number"
                                placeholder="Amount"
                                className="flex-1 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:ring-1 w-[40%] focus:ring-green-500 focus:outline-none"
                               
                                onChange={(e) => setNewAccount({...newAccount, balance: e.target.value})}
                                required
                              />
                              <select
                                className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:ring-1 focus:ring-green-500 focus:outline-none"
                               
                                onChange={(e) => setNewAccount({...newAccount, currency: e.target.value})}
                              >
                                <option value="RUB">₽</option>
                                <option value="USD">$</option>
                                <option value="EUR">€</option>
                              </select>
                            </div>

                            <div className="flex gap-1 pt-1">
                              <button
                                type="submit"
                                className="flex-1 px-2 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                               onClick={()=> setAddBankAccountForm(false)}
                                className="flex-1 px-2 py-1 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddBankAccountForm(true)}
                          className="w-full p-2 text-sm font-medium text-center text-white bg-gray-700 hover:bg-gray-600 transition-colors border-t border-gray-700"
                        >
                          + Add account
                        </button>
                      )}
                    </div>
                )}
            </div>
            {tooManyBankAccounts && (
                <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
                  <div className="w-72 bg-gray-700 rounded-lg shadow-xl border-l-4 border-blue-300 overflow-hidden">
                    <div className="flex items-center justify-between bg-gray-300 px-4 py-3">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-blue-500 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <h3 className="font-semibold text-blue-700">Notification</h3>
                      </div>
                      <button
                        onClick={()=> setToManyBankAccounts(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="px-4 py-3 text-sm text-white bg-gray-700">
                      <p>Too many accounts</p>
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
};

export default BankAccount;
