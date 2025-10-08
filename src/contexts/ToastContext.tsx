import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, Sparkles, Target, TrendingUp, Users, Lightbulb, Award, Zap } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'achievement' | 'tip' | 'progress' | 'celebration';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, options?: Partial<Toast>) => void;
  showAchievement: (title: string, message: string) => void;
  showTip: (message: string) => void;
  showProgress: (message: string) => void;
  showCelebration: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', options: Partial<Toast> = {}) => {
    const id = Math.random().toString(36).substring(7);
    const duration = options.duration || (type === 'achievement' ? 6000 : type === 'celebration' ? 8000 : 4000);
    
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      ...options
    };
    
    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const showAchievement = useCallback((title: string, message: string) => {
    showToast(message, 'achievement', { title, duration: 6000 });
  }, [showToast]);

  const showTip = useCallback((message: string) => {
    showToast(message, 'tip', { duration: 5000 });
  }, [showToast]);

  const showProgress = useCallback((message: string) => {
    showToast(message, 'progress', { duration: 3000 });
  }, [showToast]);

  const showCelebration = useCallback((message: string) => {
    showToast(message, 'celebration', { duration: 8000 });
  }, [showToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 animate-heartbeat" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'achievement':
        return <Award className="w-6 h-6 animate-bounce-gentle" />;
      case 'tip':
        return <Lightbulb className="w-5 h-5 animate-pulse" />;
      case 'progress':
        return <TrendingUp className="w-5 h-5 animate-pulse" />;
      case 'celebration':
        return <Sparkles className="w-6 h-6 animate-wiggle" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/25';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/25';
      case 'achievement':
        return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-yellow-500/25 animate-glow';
      case 'tip':
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/25';
      case 'progress':
        return 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-primary-500/25';
      case 'celebration':
        return 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-purple-500/25 animate-gradient-x';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-gray-500/25';
    }
  };

  return (
    <ToastContext.Provider value={{ 
      showToast, 
      showAchievement, 
      showTip, 
      showProgress, 
      showCelebration 
    }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className={`glass-strong backdrop-blur-lg rounded-2xl shadow-2xl min-w-[320px] max-w-sm animate-slide-in-right transform transition-all duration-500 hover:scale-105 ${getStyles(toast.type)}`}
            style={{ 
              animationDelay: `${index * 100}ms`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-start gap-4 p-5">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(toast.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <h4 className="font-bold text-sm mb-1 truncate">
                    {toast.title}
                  </h4>
                )}
                <p className="text-sm font-medium leading-relaxed">
                  {toast.message}
                </p>
                
                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-all duration-300 backdrop-blur-sm"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-all duration-300 group"
              >
                <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="h-1 bg-white/20 overflow-hidden rounded-b-2xl">
              <div 
                className="h-full bg-white/40 rounded-full animate-progress"
                style={{ 
                  animation: `progress-bar ${toast.duration || 4000}ms linear forwards`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes progress-bar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-progress {
          animation: progress-bar linear forwards;
        }

        .shadow-green-500\/25 {
          box-shadow: 0 10px 25px -5px rgba(34, 197, 94, 0.25);
        }

        .shadow-red-500\/25 {
          box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.25);
        }

        .shadow-yellow-500\/25 {
          box-shadow: 0 10px 25px -5px rgba(234, 179, 8, 0.25);
        }

        .shadow-blue-500\/25 {
          box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.25);
        }

        .shadow-primary-500\/25 {
          box-shadow: 0 10px 25px -5px rgba(20, 184, 166, 0.25);
        }

        .shadow-purple-500\/25 {
          box-shadow: 0 10px 25px -5px rgba(168, 85, 247, 0.25);
        }

        .shadow-gray-500\/25 {
          box-shadow: 0 10px 25px -5px rgba(107, 114, 128, 0.25);
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
