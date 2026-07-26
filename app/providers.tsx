'use client';

import React from 'react';
import { ThemeProvider } from '@/lib/theme-context';
import { ToastProvider } from '@/components/toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
