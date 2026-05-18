"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let _addToast: ((msg: string, type: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = "success") {
  _addToast?.(message, type);
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  let counter = 0;

  useEffect(() => {
    _addToast = (message, type) => {
      const id = ++counter;
      setItems(prev => [...prev, { id, message, type }]);
      setTimeout(() => setItems(prev => prev.filter(i => i.id !== id)), 3500);
    };
    return () => { _addToast = null; };
  }, []);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />,
  };
  const borders = { success: "border-green-200", error: "border-red-200", warning: "border-yellow-200" };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {items.map(item => (
        <div
          key={item.id}
          className={`flex items-center gap-3 bg-white rounded-xl shadow-lg border px-4 py-3 min-w-[260px] max-w-sm pointer-events-auto animate-in slide-in-from-bottom-2 ${borders[item.type]}`}
        >
          {icons[item.type]}
          <p className="text-sm text-gray-700 flex-1">{item.message}</p>
          <button
            onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
            className="text-gray-300 hover:text-gray-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
