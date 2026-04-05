'use client'
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useBankTransaction } from '../context/BankTransactionContext';
import { useAuthContext } from '../context/AuthContext';  
import { useUI } from '../context/UIContext';
import { sendEvent } from '../services/broadcastChannel';
import settingSvg from '../../public/settingsSvg.svg';  
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
    const [mounted, setMounted] = useState(false);
    const [activeBankCookies, setActiveBankCookies] = useState(Cookies.get('ActiveBank'))
    const [registerError, setRegisterError] = useState<boolean>(false)
    const [changingBankId, setChangingBankId] = useState<string>('') 
    const [tooManyBankAccounts, setToManyBankAccounts] = useState<boolean>(false)
    const [redirect, setRedirect] = useState<boolean>(false)
    const {isAccountsVisible, setIsAccountsVisible, addBankAccountForm, setAddBankAccountForm} = useUI();
    const { login, setLogin } = useAuthContext(); 
    const { banks, setBanks, setTrans, setActiveBank, activeBank, balance, setBalance, currency, setCurrency, setHasMore, setNextCursor, trans } = useBankTransaction();
    const [newAccount, setNewAccount] = useState<BankAccountType>({name: '', balance: '', currency: 'RUB', notes: '', active: false, login: login});
    const renders = useRef(0);
    renders.current++
    const router = useRouter()
      useEffect(()=>{
      if(redirect){
        router.push('/')
      }
      }, [redirect]);
    useEffect(() => {
        setNewAccount(prev => ({...prev, login: login}));
    }, [login]);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
      if(activeBankCookies){
        const bank = JSON.parse(activeBankCookies)
        setActiveBank({name : bank.name, id: bank.id || ''})
        setBalance(bank?.balance?.toFixed(2) || 0)
        setCurrency(bank.currency || 'RUB')
      }else if(banks?.length > 0){
        const firstBank = banks[0]
        const balance = firstBank.balance
        changeBalance(balance)
        setActiveBank({name: firstBank.name, id: firstBank.id})
        setCurrency(firstBank.currency || 'RUB')           
        Cookies.set('ActiveBankId', JSON.stringify(firstBank.id || ''))
      }else{
        setActiveBank({name: '', id: ''})
        setBalance(0)
        setCurrency('RUB')
      }
    }, [banks, activeBankCookies])
    useEffect(()=>{
      const times = setTimeout(()=>{
        setToManyBankAccounts(false)
      }, 7000)
      return ()=> clearTimeout(times)
    },[tooManyBankAccounts])
    function changeBalance(newBalance: number | string){
      const numberBalance = Number(newBalance)
      if(Number(newBalance) % 1 > 0){
        setBalance(Number(numberBalance.toFixed(2)))
      }else{
        setBalance(numberBalance)
      }
    }
    useEffect(()=>{
      if(!registerError){
        return;
      }
      const times = setTimeout(()=>{
        setRegisterError(false)
      }, 5000)
      return ()=> clearTimeout(times)
      
    },[registerError])

    const toggleAccountsVisibility = () => {
        setIsAccountsVisible(!isAccountsVisible);
    };
    const logout = async ()=>{
      const logoutResponse = await fetch('api/auth/logout',{method: 'POST', headers: {'Content-Type': 'application/json'}})
      if(logoutResponse.ok){
        const res = await fetch('api/auth/logout',{method: 'POST', headers: {'Content-Type': 'application/json'}})
        if(!res.ok){
          setRegisterError(true)
        }else{
          sendEvent({ type: 'LOGOUT' })
          setTrans([])
          setIsAccountsVisible(false)
          setBanks([])
          setActiveBank({name: '', id: ''})
          setBalance(0)
          setCurrency('RUB')
          setLogin('')
          Cookies.remove('ActiveBankId')
          localStorage.removeItem('favoriteRates')
          localStorage.removeItem('conversionHistory')
          Cookies.remove('accessToken')
          Cookies.remove('refreshToken')
          setRedirect(true);
        }
      }else{
        setRegisterError(true)
      }
    }
    const addBankAccount = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if(banks.length >= 6){
        setToManyBankAccounts(true)
      }else{
        try{
          if(!newAccount.name || !newAccount.currency || !newAccount.balance ){
            alert('Please fill in all fields')
          }else{
            const response = await fetch(`/api/addNewAccount`,
              {method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(
               newAccount
           )})
           if(response.status === 201){
            let nextBanks = [...banks, newAccount as BankAccountType & { id?: string }];
            try{
              const res = await fetch(`/api/revalidateBankNames?`, 
                {method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({login, notes: newAccount.notes || '', name: newAccount.name, currency: newAccount.currency, balance: newAccount.balance || 0})
              }) 
              if(res.ok){
                const refreshed = await res.json()
                nextBanks = refreshed.freshData 
              }
            }catch(e){

            }
            setBanks(nextBanks)
            sendEvent({ type: 'SYNC_BANKS', payload: nextBanks })
           }else{
            throw 'error'
           }
          }
        }catch(error){
        }
      }
    }
    const deleteAccount = async (accountId: string,accountName: string,  e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (window.confirm(`Are you sure you want to delete the account "${accountName}"?`)) {
        try {
          const response = await fetch(`/api/deleteAccount?&bankId=${accountId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            const nextBanks = banks.filter(account => account.id !== accountId);
            setBanks(nextBanks);
            sendEvent({ type: 'DELETE_BANK', payload: accountId });
            if (activeBank.id === accountId) {
              setActiveBank({name: '', id: ''});
              setBalance(0);
              setCurrency('RUB');
            }
          } else {
            const errorData = await response.json();
            alert(`Error deleting account: ${errorData.error || 'Unknown error'}`);
          }
        } catch (error) {
          alert('Error deleting account');
        }
      }
    };
    function editBankAccount(bankId: string, e: React.MouseEvent<HTMLButtonElement>){
      e.preventDefault();
      if(changingBankId !== ''){

      }
    }
    const bankToActive = (bank: BankAccountType) =>{
      setActiveBank({name: bank.name, id: bank.id || ''})
      setBalance(Number(bank.balance) || 0)
      setCurrency(bank.currency || 'RUB')
      Cookies.remove('ActiveBankId')
      Cookies.set('ActiveBankId', JSON.stringify(bank.id || ''))
      sendEvent({
        type: 'SWITCH_BANK',
        payload: {
          name: bank.name,
          id: bank.id || '',
          currency: bank.currency || 'USD',
        },
      })
    }

    const handleAccountsClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation(); 
    };
    if (!mounted) return null;
    if(!login) return null
    const bankAccountContent = (
        <div className={`fixed right-6 top-3 flex items-center h-auto pr-0 z-[999999] w-max-[180px] flex-col justify-start fade`}>
            <div 
                className={`bg-gradient-to-r from-gray-800/80 to-gray-700/70 text-white px-3 w-[200px] ${addBankAccountForm ? 'w-[250px]' : ''} m-[5px] py-1.5 rounded-lg shadow flex items-start justify-start gap-2 flex-col min-w-[180px] border border-gray-600 backdrop-blur-sm transition-all duration-300 hover:scale-100 cursor-pointer`} 
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
                                {Number(balance) % 1 === 0 ? Number(balance).toFixed(0) : balance.toFixed(2) || "0"}
                                <span className="text-xs text-white/60 font-semibold pb-0.5">
                                {currency === "RUB" ? "₽" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency}
                            </span>
                            </span> 
                        
                        </div>
                    </div>
                </div>
                
                {isAccountsVisible && (
                    <div 
                        className="mt-2 w-full bg-[#232336] border border-gray-700 rounded-xl shadow-xl p-3 flex flex-col items-stretch animate-fade-in z-[1000000] relative"
                        onClick={handleAccountsClick}
                    >
                        <h3 className="font-bold text-base text-white/80 mb-2 pl-1">Accounts</h3>
                        <ul className="mb-2">
                            {banks.length > 0 ? (
                                banks.map((account, index) => (
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
                                            onClick={(e) => editBankAccount(account.id,  e)}
                                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/30 hover:border-white/50 transform hover:scale-110 active:scale-95 backdrop-blur-sm"
                                            title="Delete account">
                                          <img src={settingSvg.src} alt="" className="w-3.5 h-3.5"/>
                                        </button>
                                        <button
                                            onClick={(e) => deleteAccount(account.id,account.name,  e)}
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
                      
                      <button
                        onClick={() => {logout()}}
                        className="w-full mt-2 p-2 text-sm font-medium text-center text-white bg-red-600 hover:bg-red-700 transition-colors rounded-lg flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                )}
            </div>

            {tooManyBankAccounts && (
                <div className="fixed bottom-6 right-6 z-[1000001] animate-fade-in-up">
                    <div className="w-80 bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-600/50 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-600/50">
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-amber-400 rounded-full mr-3 animate-pulse"></div>
                                <h3 className="font-medium text-slate-200 text-sm">Notification</h3>
                            </div>
                            <button
                                onClick={() => setToManyBankAccounts(false)}
                                className="text-slate-400 hover:text-slate-200 transition-colors duration-200 p-1 rounded-full hover:bg-slate-600/30"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="px-4 py-3">
                            <p className="text-sm text-slate-300">Too many accounts. Maximum 6 accounts allowed.</p>
                        </div>
                    </div>
                </div>
            )}
            
            {registerError && (
                <div className="fixed bottom-6 right-6 z-[1000001] animate-fade-in-up">
                    <div className="w-80 bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-600/50 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-600/50">
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-red-400 rounded-full mr-3 animate-pulse"></div>
                                <h3 className="font-medium text-slate-200 text-sm">Error</h3>
                            </div>
                            <button
                                onClick={() => setRegisterError(false)}
                                className="text-slate-400 hover:text-slate-200 transition-colors duration-200 p-1 rounded-full hover:bg-slate-600/30"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="px-4 py-3">
                            <p className="text-sm text-slate-300">Error registering account.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return createPortal(bankAccountContent, document.body);
};

export default BankAccount;
