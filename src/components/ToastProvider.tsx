"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Check } from "lucide-react";

interface Toast {
  id: number;
  message: string;
}

const ToastContext = createContext<((message: string) => void) | null>(null);

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return showToast;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-lavender-200 px-5 py-2.5 text-sm font-semibold text-mocha-900 shadow-[0_12px_30px_-10px_rgb(0_0_0/0.6)] ring-1 ring-lavender-500/40"
          >
            <Check className="h-4 w-4 text-lavender-700" aria-hidden="true" />
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
