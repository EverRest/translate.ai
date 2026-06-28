import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

type ToastType = 'success' | 'error' | 'loading' | 'info';

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  show: (message: string, type: ToastType, autoDismissMs?: number) => string;
  update: (id: string, message: string, type: ToastType) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const scheduleAutoDismiss = useCallback(
    (id: string, ms: number) => {
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => dismiss(id), ms);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const show = useCallback(
    (message: string, type: ToastType, autoDismissMs = 5000) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
      if (autoDismissMs > 0 && type !== 'loading') {
        scheduleAutoDismiss(id, autoDismissMs);
      }
      return id;
    },
    [scheduleAutoDismiss],
  );

  const update = useCallback(
    (id: string, message: string, type: ToastType) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, message, type } : t)),
      );
      if (type !== 'loading') {
        scheduleAutoDismiss(id, 5000);
      }
    },
    [scheduleAutoDismiss],
  );

  return (
    <ToastContext.Provider value={{ show, update, dismiss }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-xl transition-all',
              toast.type === 'success' &&
                'border-emerald-800 bg-emerald-950 text-emerald-300',
              toast.type === 'error' &&
                'border-red-800 bg-red-950 text-red-300',
              toast.type === 'loading' &&
                'border-slate-700 bg-slate-800 text-slate-300',
              toast.type === 'info' && 'border-sky-800 bg-sky-950 text-sky-300',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {toast.type === 'loading' && (
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {toast.type === 'success' && (
              <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
            )}
            {toast.type === 'error' && (
              <span className="mt-0.5 shrink-0">✕</span>
            )}
            {toast.type === 'info' && (
              <span className="mt-0.5 shrink-0">ℹ</span>
            )}
            <span className="flex-1 leading-relaxed">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 opacity-40 hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

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
