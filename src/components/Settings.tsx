import { useState } from 'react';
import { ArrowLeft, Bell, Moon, Sun, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [notifications, setNotifications] = useState(
    localStorage.getItem('notifications') !== 'false'
  );
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  );
  const [sound, setSound] = useState(
    localStorage.getItem('sound') !== 'false'
  );
  const { showToast } = useToast();

  const handleNotificationsToggle = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('notifications', String(newValue));
    showToast(
      newValue ? 'Notifications enabled' : 'Notifications disabled',
      'success'
    );
  };

  const handleDarkModeToggle = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', String(newValue));
    showToast(
      'Dark mode will be available in a future update',
      'info'
    );
  };

  const handleSoundToggle = () => {
    const newValue = !sound;
    setSound(newValue);
    localStorage.setItem('sound', String(newValue));
    showToast(
      newValue ? 'Sound effects enabled' : 'Sound effects disabled',
      'success'
    );
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    showToast('Onboarding tour reset. Refresh to see it again.', 'success');
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all local preferences? This will not delete your account or practice sessions.')) {
      localStorage.clear();
      showToast('Local preferences cleared', 'success');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Customize your learning experience</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
            </div>

            <div className="divide-y divide-gray-200">
              <div className="px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Bell className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <p className="text-sm text-gray-600">Receive updates about your progress</p>
                  </div>
                </div>
                <button
                  onClick={handleNotificationsToggle}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    notifications ? 'bg-teal-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                      notifications ? 'transform translate-x-6' : ''
                    }`}
                  ></div>
                </button>
              </div>

              <div className="px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    {darkMode ? (
                      <Moon className="w-6 h-6 text-gray-600" />
                    ) : (
                      <Sun className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Dark Mode</h3>
                    <p className="text-sm text-gray-600">Coming soon in future update</p>
                  </div>
                </div>
                <button
                  onClick={handleDarkModeToggle}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-300'
                  }`}
                  disabled
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                      darkMode ? 'transform translate-x-6' : ''
                    }`}
                  ></div>
                </button>
              </div>

              <div className="px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                    {sound ? (
                      <Volume2 className="w-6 h-6 text-cyan-600" />
                    ) : (
                      <VolumeX className="w-6 h-6 text-cyan-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Sound Effects</h3>
                    <p className="text-sm text-gray-600">Play sounds for notifications</p>
                  </div>
                </div>
                <button
                  onClick={handleSoundToggle}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    sound ? 'bg-cyan-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                      sound ? 'transform translate-x-6' : ''
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Data & Privacy</h2>
            </div>

            <div className="px-8 py-6 space-y-4">
              <button
                onClick={handleResetOnboarding}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Reset Onboarding</h3>
                    <p className="text-sm text-gray-600">See the welcome tour again</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={handleClearData}
                className="w-full flex items-center justify-between px-6 py-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <RefreshCw className="w-5 h-5 text-red-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-red-900">Clear Local Data</h3>
                    <p className="text-sm text-red-600">Reset all preferences and settings</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
            <div className="space-y-2 text-gray-600">
              <p>AI Life Coach v1.0.0</p>
              <p className="text-sm">
                An AI-powered communication training platform designed to help you master
                real-world scenarios through practice and feedback.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
