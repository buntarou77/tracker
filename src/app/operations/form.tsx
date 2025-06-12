'use client'
import { useState } from "react";
import Cookies from 'js-cookie';
export default function FirstForm({onComplite}){
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);
    const login = Cookies.get('info_token');
    const sendForm = async (e: React.FormEvent<HTMLFormElement>)=> {
        e.preventDefault();
        const formData = new FormData(e.currentTarget)
        const info = {
               login: login,
               lasts :formData.get('lasts'),
               debts: formData.get('debts'),
               food: formData.get('food'),
               family: formData.get('family'),
               home: formData.get('home'),
               active: formData.get('active'),
               salary: formData.get('salary'),
               currency: formData.get('currency'),
               plan: []
        }
        try{
            setLoading(true)
          console.log(info)
          const response = await fetch('/api/noSql',{
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(info),
          })
        
        if (!response.ok) {

          setError(true)
          return;
        }else{
          localStorage.setItem(`success_first_test_${login}`, 'true')
          Cookies.set('bank_account', [info.active, 'default account'])
            onComplite()
            setLoading(false)
        }
        
      }catch(e){
  
      }
      }
      if(error){
        return(
            <div>Somthing happend</div>
        )
      }
      return(
        
        <div className="flex flex-col items-center justify-center min-h-screen  p-6 ">
        <div className="w-full max-w-2xl  rounded-xl shadow-md p-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-3xl font-bold text-green-600">Hello, {login}!</p>
            <h2 className="text-xl text-gray-700">Please complete your account setup to unlock all features of our financial tracker</h2>
            <h4 className="text-[15px] opacity-[0.7] text-gray-700" > This is necessary for a competent analysis of your expenses</h4>
          </div>
          <form className="space-y-6 flex flex-col  font-bold " onSubmit={sendForm} >
            <div className="space-y-2 gap-[10px] flex flex-col mb-[20px]">
              <label className="block text-sm font-[800]">What currency do you use?</label>
              <h3 className="block text-sm font-medium text-gray-700 opacity-[0.7] font-[500] m-[0]">How much money do you get in hand after your work?</h3>
              <div className="relative">
              <select  name="currency" className="block p-[5px] bg-[black] text-[white] w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" >
              <option value="">Select currency</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="JPY">JPY</option>
              <option value="GBP">GBP</option>
              <option value="AUD">AUD</option>
              <option value="CAD">CAD</option>
              <option value="CHF">CHF</option>
              <option value="CNY">CNY</option>
              <option value="HKD">HKD</option>
              <option value="NZD">NZD</option>
              <option value="SEK">SEK</option>
              <option value="KRW">KRW</option>
              <option value="SGD">SGD</option>
              <option value="NOK">NOK</option>
              <option value="MXN">MXN</option>
              <option value="INR">INR</option>
              <option value="RUB">RUB</option>
              <option value="ZAR">ZAR</option>
              <option value="TRY">TRY</option>
              <option value="BRL">BRL</option>
              </select>
              </div>
            </div>
            <div className="space-y-2 gap-[10px] flex flex-col mb-[20px]">
              <label className="block text-sm font-[800]">What is your monthly salary?</label>
              <h3 className="block text-sm font-medium text-white opacity-[0.7] font-[500] m-[0]">How much money do you get in hand after your work?</h3>
              <div className="relative">
              <input type="number" name="salary" className="block p-[5px] w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0.00"/>
              </div>
            </div>
            <div className="space-y-2 gap-[10px] flex flex-col mb-[10px]">
              <label className="block text-sm font-medium text-white">Current savings and investments</label>
              <h3 className="block text-sm font-medium text-white opacity-[0.7] font-[500] m-[0]">How much money do you get in hand after your work?</h3>
              <div className="relative">
              <input type="number" name="active" className="block p-[5px] w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0.00"/>
              </div>
            </div>
            <div className="space-y-2 gap-[10px] flex flex-col mb-[10px]">
              <label className="block text-sm font-medium text-white">Monthly housing payment</label>
              <h3 className="block text-sm font-medium text-white opacity-[0.7] font-[500] m-[0]">How much money do you get in hand after your work?</h3>
              <div className="relative">
              <input type="number" name="home" className="block p-[5px] w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0.00"/>
              </div>
            </div>
            <div className="space-y-2 gap-[10px] flex flex-col mb-[10px]">
              <label className="block text-sm font-medium text-white">Regular family expenses (monthly)</label>
              <h3 className="block text-sm font-medium text-white opacity-[0.7] font-[500] m-[0]">How much money do you get in hand after your work?</h3>
              <div className="relative">
              <input type="number" name="family" className="block p-[5px] w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0.00"/>
              </div>
            </div>
            <div className="space-y-2 gap-[10px] flex flex-col mb-[10px]">
              <label className="block text-sm font-medium text-white">Monthly food budget</label>
              <h3 className="block text-sm font-medium text-white opacity-[0.7] font-[500] m-[0]">How much money do you get in hand after your work?</h3>
              <div className="relative">
              <input type="number" name="food" className="block p-[5px] w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0.00"/>
              </div>
            </div>
            <div className="space-y-2 gap-[10px] flex flex-col mb-[10px]">
              <label className="block text-sm font-medium text-white">Current debts (total amount)</label>
              <h3 className="block text-sm font-medium text-white opacity-[0.7] font-[500] m-[0]">How much money do you get in hand after your work?</h3>
              <div className="relative">
              <input type="number" name="debts" className="block p-[5px] w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0.00"/>
              </div>
            </div> 
            <div className="space-y-2 gap-[10px] flex flex-col mb-[10px]">
              <label className="block text-sm font-medium text-white">Typical monthly savings</label>
              <h3 className="block text-sm font-medium text-white opacity-[0.7] font-[500] m-[0]">How much money do you get in hand after your work?</h3>
              <div className="relative">
              <input type="number" name="lasts" className="block p-[5px] w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0.00"/>
              </div>
            </div>
            <div className="pt-4">
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">{loading ? 'Loading' : `Complete Setup`}</button>
            </div>
          </form>
        </div>
      </div>
      )
}