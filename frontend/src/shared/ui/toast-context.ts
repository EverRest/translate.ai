import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'loading' | 'info';

export type ToastContextValue = {
  show: (message: string, type: ToastType, autoDismissMs?: number) => string;
  update: (id: string, message: string, type: ToastType) => void;
  dismiss: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
