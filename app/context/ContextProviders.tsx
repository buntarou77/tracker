'use client';

import React, { ReactNode } from 'react';
import { UIProvider } from './UIContext';
import { BankTransactionProvider } from './BankTransactionContext';
import { PlanProvider } from './PlanContext';
import { ErrorProvider } from './ErrorContext';
import { AuthProvider } from './AuthContext';
interface ContextProvidersProps {
  children: ReactNode;
}

export function ContextProviders({ children }: ContextProvidersProps) {
  return (
    <AuthProvider>
    <ErrorProvider>
      <UIProvider>
        <BankTransactionProvider>
          <PlanProvider>
            {children}
          </PlanProvider>
        </BankTransactionProvider>
      </UIProvider>
    </ErrorProvider>
    </AuthProvider>
  );
}

export default ContextProviders; 