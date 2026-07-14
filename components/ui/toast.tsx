"use client";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
type Toast = { id: number; message: string; type: "success" | "error" };
const Context = createContext<(message: string, type?: Toast["type"]) => void>(
  () => {},
);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback(
    (message: string, type: Toast["type"] = "success") => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, type }]);
      setTimeout(
        () => setToasts((current) => current.filter((t) => t.id !== id)),
        4000,
      );
    },
    [],
  );
  return (
    <Context.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex min-w-72 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xl"
          >
            {t.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => setToasts((c) => c.filter((x) => x.id !== t.id))}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Context.Provider>
  );
}
export const useToast = () => useContext(Context);
