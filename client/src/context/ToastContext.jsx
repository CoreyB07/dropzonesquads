import React, { useState, useCallback } from 'react';
import { ShieldAlert, CheckCircle2, Info, X } from 'lucide-react';
import { ToastContext } from './toastContext';

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback(({ type = 'info', message, duration = 7000 }) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, type, message }]);

        if (duration > 0) {
            window.setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const success = (message) => addToast({ type: 'success', message });
    const error = (message) => addToast({ type: 'error', message });
    const info = (message) => addToast({ type: 'info', message });

    return (
        <ToastContext.Provider value={{ success, error, info }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl animate-in slide-in-from-right-8 fade-in duration-300 min-w-[300px] max-w-md ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                                toast.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                                    'bg-military-gray/80 border-military-gray text-gray-200 backdrop-blur-md'
                            }`}
                    >
                        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                        {toast.type === 'error' && <ShieldAlert className="w-5 h-5 flex-shrink-0" />}
                        {toast.type === 'info' && <Info className="w-5 h-5 flex-shrink-0 text-tactical-yellow" />}

                        <p className="text-sm font-semibold flex-1 leading-snug">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-white/10 rounded-md transition-colors"
                        >
                            <X className="w-4 h-4 opacity-70 hover:opacity-100" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
