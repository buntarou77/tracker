'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { UIProvider } from './UIContext';
import { BankTransactionProvider } from './BankTransactionContext';
import { PlanProvider } from './PlanContext';

interface ContextProvidersProps {
  children: ReactNode;
}

export function ContextProviders({ children }: ContextProvidersProps) {
  return (
    <AuthProvider>
      <UIProvider>
        <BankTransactionProvider>
          <PlanProvider>
            {children}
          </PlanProvider>
        </BankTransactionProvider>
      </UIProvider>
    </AuthProvider>
  );
}

export default ContextProviders; 