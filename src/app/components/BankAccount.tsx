'use client'
import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';

const BankAccount = () => {
    const cookieName = 'bank_account';
    const [balance, setBalance] = useState(Cookies.get(cookieName)?.split(',')[0]);
    const [accountName, setAccountName] = useState(Cookies.get(cookieName)?.split(',')[1]);
    const lastValue = useRef(Cookies.get(cookieName));

    useEffect(() => {
        const interval = setInterval(() => {
            const currentValue = Cookies.get(cookieName);
            if (currentValue !== lastValue.current) {
                lastValue.current = currentValue;
                if (currentValue) {
                  setBalance(currentValue.split(',')[0]);
                  setAccountName(currentValue.split(',')[1]);
                } else {
                  setBalance(undefined);
                  setAccountName(undefined);
                }
            }
        }, 10000); 

        return () => clearInterval(interval);
    }, [cookieName]);

    return (
        <div className="absolute right-0 flex items-center h-full pr-3 z-50 w-[180px]">
            <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/70 text-white px-3 py-1.5 rounded-lg shadow flex items-center gap-2 min-w-[180px] border border-gray-600 backdrop-blur-sm transition-all duration-200 hover:scale-100 cursor-default">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-900/40 mr-1">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex flex-col items-start justify-center">
                  <span className="font-normal text-xs text-white/60 leading-tight mb-0.5 truncate ">{accountName ? accountName : '—'}</span>
                  <span className="font-semibold text-sm text-green-200">{balance ? balance : '—'} <span className="text-xs text-white/50 font-medium">₽</span></span>
                </div>
            </div>
        </div>
    )
}
export default BankAccount;