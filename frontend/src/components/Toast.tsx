"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, isVisible, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return {
          gradient: "from-green-500 to-green-600",
          bg: "from-green-50 to-green-100/50",
          border: "border-green-200",
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case "error":
        return {
          gradient: "from-red-500 to-red-600",
          bg: "from-red-50 to-red-100/50",
          border: "border-red-200",
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case "warning":
        return {
          gradient: "from-orange-500 to-orange-600",
          bg: "from-orange-50 to-orange-100/50",
          border: "border-orange-200",
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        };
      case "info":
        return {
          gradient: "from-blue-500 to-blue-600",
          bg: "from-blue-50 to-blue-100/50",
          border: "border-blue-200",
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

  const styles = getToastStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-4 right-4 z-[9999] max-w-md"
          style={{ position: 'fixed' }}
        >
          <div className={`glass-card overflow-hidden rounded-2xl border-2 bg-gradient-to-br ${styles.bg} ${styles.border} shadow-2xl hover-lift`}>
            <div className="flex items-start gap-4 p-5 min-w-[320px]">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${styles.gradient} text-white shadow-lg`}>
                {styles.icon}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-sm font-bold leading-relaxed text-neutral-900 break-words">
                  {message}
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-neutral-600 transition hover:bg-neutral-200/50 hover:text-neutral-900 hover:scale-110"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Progress bar */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className={`h-1.5 bg-gradient-to-r ${styles.gradient}`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
