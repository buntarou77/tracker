'use client';
import '../../app/globals.css'
import EmailIcon from '../resources/email.svg';
import PasswordIcon from '../resources/password.svg';
import LoginIcon from '../resources/login.svg';
import React, {  useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import deleteCookiesStartingWith from '../utils/delCookies'
import { useApp } from '../context/AppContext';
export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSucces] = useState<string | null>('');
  const [reg , setReg] = useState<boolean>(true);
  const [log, setLog] = useState<boolean>(false);
  const [shouldAnimate, setShouldAnimate] = useState<boolean>(false);
  const [activeButton, setActiveButton] = useState<boolean>(true);
  const {login, setLogin} = useApp()
  const regSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const repeatPassword = formData.get('repeatpassword') as string;
    
    if (password !== repeatPassword) {
      setError('Пароли не совпадают');
      setIsLoading(false);
      return;
    }
    const active = 0;
    const data = {
      login: formData.get('login'),
      password: formData.get('password'),
      email: formData.get('email'),
      active
    };
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.log(result.error )
        setError(result.error || 'Ошибка при регистрации');
        return;
      }
      
      if (result.success) {
        setSucces("регестрация прошла успешно");
      } else {
        setError('Ошибка при регистрации');
      }
    } catch (error) {
      console.error(error);
      setError('Произошла ошибка при отправке формы');
    } finally {
      setIsLoading(false);
    }
  };
  const logSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log('logSubmit')
    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    
    const data = {
      login: formData.get('login'),
      password: formData.get('password')
    };
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      
      if (!response.ok) {
        console.log(result.error )
        setError(result.error || 'Ошибка при входе');
        return;
      }
      if (result.success) {
        setLogin('' as string)
        deleteCookiesStartingWith('bank_account')
        console.log(result)
        Cookies.set('info_token', result.user.user)
        Cookies.set(`bank_account_${result.user.user}`, 0)
        setLogin(result.user.user as string)
        setSucces("вход прошел успешно");
      } else {
        setError('Ошибка при входе');
      }
    } catch (error) {
      console.error(error);
      setError('Произошла ошибка при отправке формы');
    } finally {
      setIsLoading(false);
    }
  };
  console.log(login)
  const activeReg = ()=>{
    setReg(true)
    setLog(false)
    setShouldAnimate(true);
  }
  const activeLog = ()=>{
    setLog(true)
    setReg(false);
    setShouldAnimate(true);
  }
  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => setShouldAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate]);
  useEffect(()=>{
    setTimeout(() => {
      setSucces('')
      setError('');
    }, 10000);
  },[success, error])
  
  if(reg){
  return (
    <div className="font-Merriweather w-[680px] input">
      <h2 className="font-thin justify-center flex">Please register before using all the features of the tracker</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {success && (
  <p className={`flex items-center justify-center text-4xl text-green-500 animate-fade-in  `}>
    <svg className="w-[30px] h-[30px] " fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
    Регистрация прошла успешно!
  </p>
)}
      <div className='flex justify-center items-center h-[60vh] h-min-[350px] '>
      <div   className='bg-[#242424] w-[60%]  h-[350px] flex-col items-center justify-center flex border-#2b2b2b-[2px]  rounded-[7px] flex transition-all duration-200'>
        <div className='h-[40px] w-[408px] flex flex-row bg-[#414141] font-[Inter] rounded-b-[0] rounded-t-[7px]'>
        <div className={`w-[50%] justify-center items-center flex ${ activeButton ? 'opacity-[1]' : 'opacity-[0.6]'  } hover:opacity-[0.8] cursor-pointer`} onClick={activeReg}>Register</div>
        <div className='h-[28px] bg-[white] w-[1px] border-white-[0.1px] rounded-[20px] opacity-[0.5]'></div>
        <div className='w-[50%] justify-center items-center flex opacity-[0.7] hover:opacity-[0.9] cursor-pointer' onClick={activeLog}>Login</div>
        </div>
        <form onSubmit={regSubmit} className={`flex flex-col h-[60vh] justify-center items-center gap-[20px] ${shouldAnimate ? 'fadeIn' : ''}`}>
            <p className='text-[20px] '>Регестрация вашего аккаунта</p> 
          <div className="justify-center flex"><img src={LoginIcon.src} className=' w-[28px] h-[28px] mr-[8px]' alt="" /><input  type="text" className='bg-[#525252]  
          p-[5px] text-[black] transition-colors transition-shadow focus:bg-[#8a8a8a] duration-200 focus:shadow-[0_6px_6px_rgba(184,184,184,0.2)]'  placeholder="login" name="login" required/></div>
          <div className="justify-center flex"><img src={PasswordIcon.src} className='w-[28px] h-[28px] mr-[8px]' alt="" /><input type="password" className='bg-[#525252] 
          p-[5px] text-[black] transition-colors transition-shadow focus:bg-[#8a8a8a] duration-200 focus:shadow-[0_6px_6px_rgba(184,184,184,0.2)]' placeholder="password" name="password" required/></div>
          <div className="justify-center flex"><img src={PasswordIcon.src} className='w-[28px] h-[28px] mr-[8px]' alt="" /><input type="password" className='bg-[#525252]
           p-[5px] text-[black] transition-colors transition-shadow focus:bg-[#8a8a8a] duration-200 focus:shadow-[0_6px_6px_rgba(184,184,184,0.2)]' placeholder="repeat password" name="repeatpassword" required/></div>
          <div className="justify-center flex"><img src={EmailIcon.src}  className='w-[25px] h-[25px] mr-[10px]'alt="email"/><input type="email" className='bg-[#525252] 
          p-[5px] text-[black] transition-colors transition-shadow focus:bg-[#8a8a8a] duration-200 focus:shadow-[0_6px_6px_rgba(184,184,184,0.2)]' placeholder="email" name="email" required/></div>
          <div className="justify-center flex color-[#8a8a8a] w-max-[24px] h-[30px]"> 
          <button type="submit" className='bg-[#8a8a8a] rounded-[4px] h-full p-1 w-[100px] font-[400] hover:transform-[scale(1.02)] cursor-pointer text-[#ffff] border-none font-["Inter"] transition-all duration-100'disabled={isLoading}>
            {isLoading ? 'Отправка...' : 'Отправить'}   
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}else if(log){
return(
    <div className="font-Merriweather w-[680px] ">
      <h2 className="font-thin justify-center flex">Please register before using all the features of the tracker</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {success ? <p className='text-[#00b900] mb-4 text-center'>вход прошел успешно!</p> : null}
      <div className='flex justify-center items-center h-[60vh] h-min-[350px]'>
      <div   className='bg-[#242424] w-[60%]  h-[350px] flex-col items-center justify-center flex border-#2b2b2b-[2px]  rounded-[7px] flex  transition-all duration-200'>
        <div className='h-[40px] w-[408px] flex flex-row bg-[#414141] font-[Inter] rounded-b-[0] rounded-t-[7px]'>
        <div className='w-[50%] justify-center items-center flex opacity-[0.7] hover:opacity-[0.9] cursor-pointer' onClick={activeReg}>Register</div>
        <div className='h-[28px] bg-[white] w-[1px] border-white-[0.1px] rounded-[20px] opacity-[0.5]'></div>
        <div className={`w-[50%] justify-center items-center flex ${ !activeButton ? 'opacity-[0.6]' : ''} hover:opacity-[0.8] cursor-pointer`} onClick={activeLog}>Login</div>
        </div>
        <form onSubmit={logSubmit} className={`flex flex-col h-[60vh] justify-center items-center gap-[20px] ${shouldAnimate ? 'fadeIn' : ''}`}>
            <p className='text-[20px] '>Login please</p> 
          <div className="justify-center flex"><img src={LoginIcon.src} className='w-[28px] h-[28px] mr-[8px]' alt="" /><input type="text" className='bg-[#525252]
           p-[5px] text-[black] transition-colors transition-shadow focus:bg-[#8a8a8a] duration-200 focus:shadow-[0_6px_6px_rgba(184,184,184,0.2)]'  placeholder="login" name="login" required/></div>
          <div className="justify-center flex"><img src={PasswordIcon.src} className='w-[28px] h-[28px] mr-[8px]' alt="" /><input type="password" className='bg-[#525252] 
           p-[5px] text-[black] transition-colors transition-shadow focus:bg-[#8a8a8a] duration-200 focus:shadow-[0_6px_6px_rgba(184,184,184,0.2)]' placeholder="password" name="password" required/></div>
          <div className="justify-center flex color-[#8a8a8a] w-max-[24px] h-[30px]"> 
          <button type="submit" className='bg-[#8a8a8a] rounded-[4px] h-full p-1 w-[100px] font-[400] hover:transform-[scale(1.02)] cursor-pointer text-[#ffff] border-none font-["Inter"] transition-all duration-100'disabled={isLoading}>
            {isLoading ? 'Отправка...' : 'Отправить'}   
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
)
}
}