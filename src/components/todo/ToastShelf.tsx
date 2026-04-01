import { AnimatePresence, motion } from 'framer-motion';

export default function ToastShelf({ toasts, onDismiss }) {
  return (
    <div className="toast-shelf" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>{toast.message}</span>
            <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
