'use client';
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import type { ErrorObjectType } from '@/app/types/shared/error';
import themes from '@/app/themes/error';

type ErrorContextType = {
  errors: ErrorObjectType[];
  setErrors: (error: ErrorObjectType[]) => void;
  addError: (error: Omit<ErrorObjectType, 'state'>) => void;
  removeError: (index: number) => void;
};

interface ErrorProviderProps {
  children: ReactNode;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errors, setErrors] = useState<ErrorObjectType[]>([]);

  const addError = (error: Omit<ErrorObjectType, 'state'>) => {
    const newError: ErrorObjectType = {
      ...error,
      state: true
    };
    setErrors(prev => [...prev, newError]);
  };

  const removeError = (index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  };

  const contextValue = useMemo(() => ({
    errors,
    setErrors,
    addError,
    removeError
  }), [errors]);

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      {errors.map((errorItem, index) => {
        const theme = themes[errorItem.theme];

        return (
          <div key={index} className="fixed bottom-6 right-6 z-[1000001] animate-fade-in-up">
            <div
              style={{
                '--error-bg': theme.background,
                '--error-text': theme.text,
                '--error-border': theme.border,
                '--error-icon': theme.iconColor,
                '--error-gradient-from': theme.gradient.from,
                '--error-gradient-to': theme.gradient.to,
                '--error-point': theme.pointColor,
              } as React.CSSProperties}
              className="w-80 overflow-hidden rounded-lg border border-[rgb(var(--error-border)/0.5)] bg-[rgb(var(--error-bg)/0.95)] text-[rgb(var(--error-text)/1)] backdrop-blur-sm shadow-2xl"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[rgb(var(--error-gradient-from)/0.5)] to-[rgb(var(--error-gradient-to)/0.5)]">
                <div className="flex items-center">
                  <div className="mr-3 h-2 w-2 animate-pulse rounded-full bg-[rgb(var(--error-point)/1)]" />
                  <h3 className="text-sm font-medium">{errorItem.name}</h3>
                </div>
                <button
                  onClick={() => {
                    errorItem.stateChangeFunc(false);
                    removeError(index);
                  }}
                  className="rounded-full p-1 transition-colors duration-200 hover:bg-[rgb(var(--error-border)/0.3)]"
                >
                  <svg className="h-4 w-4 text-[rgb(var(--error-icon)/1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-4 py-3 flex gap-5">
                <div className="max-w-xs flex items-center">
                  <p className="text-sm text-[rgb(var(--error-text)/0.85)]">{errorItem.desc}</p>
                </div>

                {errorItem.interactiveName && (
                  <div className="flex justify-end items-center">
                    <button
                      onClick={() => {
                        errorItem.interactiveFunc();
                        removeError(index);
                      }}
                      className="rounded-md border border-[rgb(var(--error-border)/0.6)] bg-gradient-to-r from-[rgb(var(--error-gradient-from)/0.7)] to-[rgb(var(--error-gradient-to)/0.7)] px-3 py-1.5 text-sm font-medium text-[rgb(var(--error-text)/1)] transition-all duration-200 hover:from-[rgb(var(--error-gradient-from)/0.9)] hover:to-[rgb(var(--error-gradient-to)/0.9)] hover:shadow-md active:scale-[0.97]"
                    >
                      {errorItem.interactiveName}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
}

export default ErrorContext;