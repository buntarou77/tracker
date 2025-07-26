'use client';
import '../../app/globals.css'
import EmailIcon from '../resources/email.svg';
import PasswordIcon from '../resources/password.svg';
import LoginIcon from '../resources/login.svg';
import React, {  useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import deleteCookiesStartingWith from '../utils/delCookies'
import { useAuthContext } from '../context/AuthContext';

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSucces] = useState<string | null>('');
  const [reg , setReg] = useState<boolean>(true);
  const [log, setLog] = useState<boolean>(false);
  const [shouldAnimate, setShouldAnimate] = useState<boolean>(false);
  const [activeButton, setActiveButton] = useState<boolean>(true);
  const {login, setLogin} = useAuthContext();

  const regSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const repeatPassword = formData.get('repeatpassword') as string;
    
    if (password !== repeatPassword) {
      setError('Passwords do not match');
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
        setError(result.error || 'Registration error');
        return;
      }
      
      if (result.success) {
        setSucces("Registration successful");
      } else {
        setError('Registration error');
      }
    } catch (error) {
      setError('An error occurred while submitting the form');
    } finally {
      setIsLoading(false);
    }
  };

  const logSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
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
        setError(result.error || 'Login error');
        return;
      }
      if (result.success) {
        setLogin('' as string)
        deleteCookiesStartingWith('bank_account')
        Cookies.set('info_token', result.user.user)
        Cookies.set(`bank_account_${result.user.user}`, '0')
        setLogin(result.user.user as string)
        setSucces("Login successful");
      } else {
        setError('Login error');
      }
    } catch (error) {
      setError('An error occurred while submitting the form');
    } finally {
      setIsLoading(false);
    }
  };

  const activeReg = ()=>{
    setReg(true)
    setLog(false)
    setShouldAnimate(true);
    setActiveButton(true);
  }
  const activeLog = ()=>{
    setLog(true)
    setReg(false);
    setShouldAnimate(true);
    setActiveButton(false);
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
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Welcome
          </h2>
          <p className="text-gray-400">Create an account to use all tracker features</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-center backdrop-blur-sm flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Registration successful!
          </div>
        )}

        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">

          <div className="flex bg-gray-900/50">
            <button
              onClick={activeReg}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 relative ${
                activeButton 
                  ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="relative z-10">Register</span>
              {activeButton && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20"></div>
              )}
            </button>
            <div className="w-px bg-gray-700"></div>
            <button
              onClick={activeLog}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 relative ${
                !activeButton 
                  ? 'text-white bg-gradient-to-r from-green-600 to-blue-600' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="relative z-10">Login</span>
              {!activeButton && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 opacity-20"></div>
              )}
            </button>
          </div>


          <div className="p-8">
            <form onSubmit={regSubmit} className={`space-y-6 ${shouldAnimate ? 'fadeIn' : ''}`}>
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white">Create Account</h3>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <img src={LoginIcon.src} className="w-5 h-5 text-gray-400" alt="login" />
                  </div>
                  <input
                    type="text"
                    name="login"
                    placeholder="Username"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-gray-700/80 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <img src={PasswordIcon.src} className="w-5 h-5 text-gray-400" alt="password" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-gray-700/80 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <img src={PasswordIcon.src} className="w-5 h-5 text-gray-400" alt="repeat password" />
                  </div>
                  <input
                    type="password"
                    name="repeatpassword"
                    placeholder="Repeat Password"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-gray-700/80 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <img src={EmailIcon.src} className="w-5 h-5 text-gray-400" alt="email" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-gray-700/80 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  } else if(log) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Welcome Back!
          </h2>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-center backdrop-blur-sm flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Login successful!
          </div>
        )}

        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">

          <div className="flex bg-gray-900/50">
            <button
              onClick={activeReg}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 relative ${
                activeButton 
                  ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="relative z-10">Register</span>
            </button>
            <div className="w-px bg-gray-700"></div>
            <button
              onClick={activeLog}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 relative ${
                !activeButton 
                  ? 'text-white bg-gradient-to-r from-green-600 to-blue-600' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="relative z-10">Login</span>
              {!activeButton && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 opacity-20"></div>
              )}
            </button>
          </div>


          <div className="p-8">
            <form onSubmit={logSubmit} className={`space-y-6 ${shouldAnimate ? 'fadeIn' : ''}`}>
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white">Sign In</h3>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <img src={LoginIcon.src} className="w-5 h-5 text-gray-400" alt="login" />
                  </div>
                  <input
                    type="text"
                    name="login"
                    placeholder="Username"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-gray-700/80 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <img src={PasswordIcon.src} className="w-5 h-5 text-gray-400" alt="password" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-gray-700/80 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}