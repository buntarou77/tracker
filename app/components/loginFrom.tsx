'use client';
import '../../app/globals.css'
import EmailIcon from '../resources/email.svg';
import PasswordIcon from '../../public/password.svg';
import LoginIcon from '../../public/login.svg';
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import deleteCookiesStartingWith from '../utils/delCookies'
import { useAuthContext } from '../context/AuthContext';
import { useTranslations } from 'next-intl';

export default function LoginForm() {
  const t = useTranslations('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [shouldAnimate, setShouldAnimate] = useState<boolean>(false);
  const { login, setLogin } = useAuthContext();

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
        setError(result.error || 'errorLogin');
        return;
      }
      if (result.success) {
        setLogin('' as string)
        deleteCookiesStartingWith('bank_account')
        Cookies.set('info_token', result.user.user)
        Cookies.set(`bank_account_${result.user.user}`, '0')
        setLogin(result.user.user as string)
        setSuccess(true);
      } else {
        setError('errorLogin');
      }
    } catch (error) {
      setError('errorGeneric');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => setShouldAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate]);

  useEffect(() => {
    setTimeout(() => {
      setSuccess(false);
      setError(null);
    }, 10000);
  }, [success, error]);
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-2">
          {t('title')}
        </h2>
        <p className="text-gray-400">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center backdrop-blur-sm">
          {t.has(error) ? t(error) : error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-center backdrop-blur-sm flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {t('successMessage')}
        </div>
      )}

      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
        <div className="p-8">
          <form onSubmit={logSubmit} className={`space-y-6 ${shouldAnimate ? 'fadeIn' : ''}`}>
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white">{t('formTitle')}</h3>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <img src={LoginIcon.src} className="w-5 h-5 text-gray-400" alt="login" />
                </div>
                <input
                  type="text"
                  name="login"
                  placeholder={t('usernamePlaceholder')}
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
                  placeholder={t('passwordPlaceholder')}
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
                  {t('loadingButton')}
                </div>
              ) : (
                t('submitButton')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}