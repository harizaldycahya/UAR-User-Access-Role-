"use client";

import * as React from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
};

type ToastContextType = {
  toast: (props: ToastProps) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastData, setToastData] = React.useState<ToastProps | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const toast = React.useCallback((props: ToastProps) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    setToastData(props);
    setIsVisible(true);

    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      hideTimeoutRef.current = setTimeout(() => {
        setToastData(null);
      }, 300);
    }, 4000);
  }, []);

  const handleClose = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    hideTimeoutRef.current = setTimeout(() => {
      setToastData(null);
    }, 300);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const getVariantStyles = () => {
    switch (toastData?.variant) {
      case "destructive":
        return "bg-red-50 border-red-200 text-red-900";
      case "success":
        return "bg-green-50 border-green-200 text-green-900";
      default:
        return "bg-white border-gray-200 text-gray-900";
    }
  };

  const getIcon = () => {
    switch (toastData?.variant) {
      case "destructive":
        return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />;
    }
  };

  const getProgressColor = () => {
    switch (toastData?.variant) {
      case "destructive":
        return "bg-red-500";
      case "success":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {toastData && (
        <div className="fixed top-4 right-4 z-50 pointer-events-none">
          <div
            className={`
              pointer-events-auto
              rounded-lg border shadow-lg
              px-4 py-3 pr-10
              min-w-[300px] max-w-[420px]
              transition-all duration-300 ease-out
              ${getVariantStyles()}
              ${isVisible 
                ? "translate-y-0 opacity-100 scale-100" 
                : "-translate-y-2 opacity-0 scale-95"
              }
            `}
          >
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-black/5 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 opacity-50" />
            </button>

            <div className="flex gap-3">
              {getIcon()}
              
              <div className="flex-1 pt-0.5">
                {toastData.title && (
                  <p className="font-semibold text-sm leading-tight mb-1">
                    {toastData.title}
                  </p>
                )}
                {toastData.description && (
                  <p className="text-sm opacity-80 leading-snug">
                    {toastData.description}
                  </p>
                )}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 rounded-b-lg overflow-hidden">
              <div
                className={`h-full ${getProgressColor()}`}
                style={{
                  animation: isVisible ? "shrink 4s linear forwards" : "none",
                }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return context;
}