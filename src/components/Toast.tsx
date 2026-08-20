"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export type ToastType = "coffee" | "heart" | "copy" | "sparkle" | "info" | "map";

interface ToastItem {
  id: number;
  message: string;
  type?: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const showToast = useCallback((message: string, type: ToastType = "coffee") => {
    const id = nextIdRef.current++;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]); // Keep at most 3 active toasts

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const getIcon = (type?: ToastType) => {
    switch (type) {
      case "heart":
        return "♥️";
      case "copy":
        return "📋";
      case "sparkle":
        return "✨";
      case "map":
        return "📍";
      case "coffee":
      default:
        return "☕";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast floating container */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "fixed",
          bottom: "28px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 18px 9px 14px",
              backgroundColor: "rgba(35, 27, 21, 0.94)",
              color: "#FBF6EE",
              borderRadius: "100px",
              border: "1px solid rgba(193, 104, 47, 0.35)",
              boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.82rem",
              fontWeight: 500,
              letterSpacing: "0.02em",
              animation: "toastSlideUp 260ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
              pointerEvents: "auto",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                lineHeight: 1,
              }}
            >
              {getIcon(toast.type)}
            </span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
