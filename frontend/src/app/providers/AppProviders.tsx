import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ConfirmDialogProvider } from '../../shared/ui/ConfirmDialog';
import { ToastProvider } from '../../shared/ui/ToastProvider';

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <ConfirmDialogProvider>
            {children}
          </ConfirmDialogProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
