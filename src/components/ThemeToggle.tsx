import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ] as const;

  const currentTheme = themes.find(t => t.id === theme) || themes[0];
  const Icon = currentTheme.icon;

  const handleThemeChange = (newTheme: typeof theme) => {
    setTheme(newTheme);
  };

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-1 border border-white/20 dark:border-white/10">
        {themes.map((themeOption) => {
          const ThemeIcon = themeOption.icon;
          const isActive = theme === themeOption.id;
          
          return (
            <button
              key={themeOption.id}
              onClick={() => handleThemeChange(themeOption.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/5'
              }`}
              title={`Switch to ${themeOption.label} theme`}
            >
              <ThemeIcon className={`w-4 h-4 transition-transform ${isActive ? 'animate-bounce-gentle' : ''}`} />
              <span className="hidden sm:inline">{themeOption.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Tooltip */}
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          Current: {currentTheme.label} theme
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
        </div>
      </div>
    </div>
  );
}

export function QuickThemeToggle() {
  const { toggleTheme, actualTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-3 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 group"
      title={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} theme`}
    >
      {actualTheme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-primary-500 transition-colors" />
      ) : (
        <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-primary-500 transition-colors" />
      )}
    </button>
  );
}
