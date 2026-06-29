import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

// ─── Types ────────────────────────────────────────────────────────────────────
type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

// ─── Context ──────────────────────────────────────────────────────────────────
const ConfirmContext = createContext<ConfirmFn | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ConfirmDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<
    (ConfirmOptions & { resolve: (v: boolean) => void }) | null
  >(null);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ ...opts, resolve });
    });
  }, []);

  const close = (value: boolean) => {
    resolveRef.current?.(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => close(false)}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
              <h2 className="text-base font-semibold text-white">
                {state.title}
              </h2>
              {state.description && (
                <p className="mt-2 text-sm text-slate-400">
                  {state.description}
                </p>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-400 hover:text-white"
                >
                  {state.cancelLabel ?? 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => close(true)}
                  className={[
                    'rounded-lg px-4 py-2 text-sm font-medium text-white',
                    state.danger
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-sky-600 hover:bg-sky-500',
                  ].join(' ')}
                >
                  {state.confirmLabel ?? 'Confirm'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </ConfirmContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx)
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  return ctx;
}
