import { AnimatePresence, motion } from "framer-motion";

interface ToastItem {
  id: string;
  type: "success" | "error" | "warning" | "info" | string;
  message: string;
}

export interface ToastShelfProps {
  toasts: ToastItem[];
  onDismiss: (toastId: string) => void;
}

export default function ToastShelf({ toasts, onDismiss }: ToastShelfProps) {
  return (
    <div
      className="fixed right-4 top-4 w-min(340px,calc(100vw-2rem)) z-[9999] grid gap-3"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {toasts.map((toast: ToastItem) => (
          <motion.div
            key={toast.id}
            className={`border rounded-[0.75rem] bg-[var(--surface)] shadow-[var(--shadow)] p-2 flex items-center justify-between gap-3 text-sm ${
              toast.type === "success"
                ? "border-[color-mix(in_oklch,var(--success)_50%,var(--line))]"
                : toast.type === "warning"
                  ? "border-[color-mix(in_oklch,var(--warning)_55%,var(--line))]"
                  : toast.type === "error"
                    ? "border-[color-mix(in_oklch,var(--error)_58%,var(--line))]"
                    : "border-[color-mix(in_oklch,var(--line),transparent_20%)]"
            }`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
