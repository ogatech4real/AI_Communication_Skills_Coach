import { useState, useEffect } from 'react';
import { Menu, X, Home, BarChart3, User, Settings as SettingsIcon, LogOut, Bell, Star, Target, Zap, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { QuickThemeToggle } from './ThemeToggle';

interface NavigationMenuProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onSignOut: () => void;
}

export function NavigationMenu({ currentView, onNavigate, onSignOut }: NavigationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltips, setShowTooltips] = useState(true);
  const { user } = useAuth();
  const { showTip } = useToast();

  useEffect(() => {
    // Show helpful tooltips for first-time users
    const hasSeenTooltips = localStorage.getItem('has_seen_nav_tooltips');
    if (!hasSeenTooltips) {
      setTimeout(() => {
        showTip('💡 Use the navigation menu to explore different features!');
        localStorage.setItem('has_seen_nav_tooltips', 'true');
      }, 3000);
    }
  }, [showTip]);

  if (!user) return null;

  const menuItems = [
    { 
      id: 'landing', 
      label: 'Home', 
      icon: Home, 
      description: 'Practice scenarios',
      badge: null
    },
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: BarChart3, 
      description: 'View progress',
      badge: 'New'
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: User, 
      description: 'Account settings',
      badge: null
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: SettingsIcon, 
      description: 'Preferences',
      badge: null
    },
  ];

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setIsOpen(false);
  };

  return (
    <>
      {/* Enhanced mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden glass p-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-md group"
      >
        <div className="relative">
          {isOpen ? (
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform" />
          )}
          {/* Notification dot */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      </button>

      {/* Enhanced backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Enhanced sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white/95 dark:bg-slate-900/95 shadow-2xl z-40 transform transition-all duration-500 backdrop-blur-lg lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          {/* User profile section */}
          <div className="flex items-center gap-4 mb-8 pt-16 animate-fade-in-up">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-gray-100 truncate text-lg">
                {user.email}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI Communication Coach</p>
              <div className="flex items-center gap-2 mt-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Premium Member</span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="glass-strong rounded-2xl p-4 mb-6 animate-fade-in-up animate-delay-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">12</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">4.2</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Avg Score</div>
              </div>
            </div>
          </div>

          {/* Navigation menu */}
          <nav className="space-y-3 flex-1 animate-fade-in-up animate-delay-300">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                  style={{ animationDelay: `${400 + index * 100}ms` }}
                >
                  <div className={`relative ${isActive ? 'animate-bounce-gentle' : ''}`}>
                    <Icon className="w-6 h-6" />
                    {item.badge && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                        !
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{item.label}</div>
                    <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="space-y-4 animate-fade-in-up animate-delay-600">
            {/* Theme toggle */}
            <div className="flex items-center justify-between glass-strong rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Notifications</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Stay updated</div>
                </div>
              </div>
              <div className="w-12 h-6 bg-primary-500 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
              </div>
            </div>

            {/* Sign out button */}
            <button
              onClick={() => {
                onSignOut();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group"
            >
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">Sign Out</div>
                <div className="text-xs text-red-500 dark:text-red-400">End your session</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
