import { useContext } from 'react';
import { ToastContext } from './toast-context';

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');

  return {
    success: (msg: string) => ctx.show(msg, 'success'),
    error: (msg: string) => ctx.show(msg, 'error'),
    info: (msg: string) => ctx.show(msg, 'info'),
    loading: (msg: string) => ctx.show(msg, 'loading', 0),
    update: ctx.update,
    dismiss: ctx.dismiss,
  };
}
