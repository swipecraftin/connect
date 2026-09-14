import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';

export type AlertType = 'info' | 'success' | 'warning' | 'danger';

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => Promise<boolean>;
  showConfirm: (options: Omit<AlertOptions, 'showCancel'>) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: AlertOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const showAlert = useCallback((options: AlertOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options: {
          showCancel: false,
          confirmText: 'Dismiss',
          type: 'info',
          ...options,
        },
        resolve,
      });
    });
  }, []);

  const showConfirm = useCallback((options: Omit<AlertOptions, 'showCancel'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options: {
          showCancel: true,
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          type: 'info',
          ...options,
        },
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    if (modalState) {
      modalState.resolve(true);
      setModalState(null);
    }
  };

  const handleCancel = () => {
    if (modalState) {
      modalState.resolve(false);
      setModalState(null);
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Modern Nocturne Dialog Modal */}
      {modalState?.isOpen && (
        <div
          onClick={handleCancel}
          className="fixed inset-0 z-[100] grid place-items-center p-4 bg-[#040507]/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] flex flex-col gap-4 p-5 rounded-[14px] border border-white/[0.12] bg-[#0E1015] shadow-[0_30px_80px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.045)] animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-start gap-3.5">
              {/* Type Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  modalState.options.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/15 text-[#34D399]'
                    : modalState.options.type === 'danger'
                    ? 'border-red-500/30 bg-red-500/15 text-red-400'
                    : modalState.options.type === 'warning'
                    ? 'border-amber-500/30 bg-amber-500/15 text-amber-400'
                    : 'border-[#3e8bff]/30 bg-[#3e8bff]/15 text-[#3e8bff]'
                }`}
              >
                {modalState.options.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {modalState.options.type === 'danger' && <AlertTriangle className="w-5 h-5" />}
                {modalState.options.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                {(!modalState.options.type || modalState.options.type === 'info') && (
                  <Info className="w-5 h-5" />
                )}
              </div>

              {/* Title & Message */}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <span className="font-sans font-bold text-[15px] tracking-[-0.015em] text-[#F2F4F8]">
                  {modalState.options.title}
                </span>
                <p className="text-[12.5px] leading-relaxed text-[#8A8F9C] m-0">
                  {modalState.options.message}
                </p>
              </div>

              {/* Close icon */}
              <button
                type="button"
                onClick={handleCancel}
                className="w-6 h-6 rounded-md hover:bg-white/[0.08] text-[#8A8F9C] hover:text-[#F2F4F8] flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              {modalState.options.showCancel && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="h-[32px] px-3.5 rounded-lg border border-white/[0.08] hover:border-white/[0.18] bg-transparent text-[#C6CBD5] text-xs font-medium transition-colors"
                >
                  {modalState.options.cancelText || 'Cancel'}
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirm}
                className={`h-[32px] px-4 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] ${
                  modalState.options.type === 'danger'
                    ? 'border border-red-500/50 bg-red-500/20 hover:bg-red-500/30 text-red-200'
                    : modalState.options.type === 'success'
                    ? 'border border-emerald-500/50 bg-emerald-500/20 hover:bg-emerald-500/30 text-[#6EE7B7]'
                    : 'border border-[#3e8bff]/50 bg-[#3e8bff]/15 hover:bg-[#3e8bff]/25 text-[#cfe0ff]'
                }`}
              >
                {modalState.options.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return ctx;
};
