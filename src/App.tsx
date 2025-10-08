import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { ChatInterface } from './components/ChatInterface';
import { FeedbackDisplay } from './components/FeedbackDisplay';
import { Dashboard } from './components/Dashboard';
import { UserProfile } from './components/UserProfile';
import { Settings } from './components/Settings';
import { SessionHistory } from './components/SessionHistory';
import { OnboardingTour } from './components/OnboardingTour';
import { NavigationMenu } from './components/NavigationMenu';
import { QuickThemeToggle } from './components/ThemeToggle';
import { LogOut, BarChart3, User, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from './lib/supabase';

type View = 'landing' | 'chat' | 'feedback' | 'dashboard' | 'profile' | 'settings' | 'session-history';

function AppContent() {
  const [view, setView] = useState<View>('landing');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentScenarioTitle, setCurrentScenarioTitle] = useState<string>('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      const hasSeenOnboarding = localStorage.getItem('onboarding_completed');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const handleStartSession = async (scenarioId: string) => {
    try {
      const { data: scenario } = await supabase
        .from('scenario')
        .select('title')
        .eq('id', scenarioId)
        .single();

      const { data: session, error } = await supabase
        .from('session')
        .insert({
          user_id: user!.id,
          scenario_id: scenarioId,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(session.id);
      setCurrentScenarioTitle(scenario?.title || 'Practice Session');
      setView('chat');
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleShowFeedback = () => {
    setView('feedback');
  };

  const handleBackToChat = () => {
    setView('chat');
  };

  const handleReturnHome = () => {
    setCurrentSessionId(null);
    setCurrentScenarioTitle('');
    setView('landing');
  };

  const handleNavigate = (newView: string) => {
    setView(newView as View);
  };

  const handleViewSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setView('session-history');
  };

  const handleSignOut = async () => {
    await signOut();
    handleReturnHome();
  };

  return (
    <>
      <NavigationMenu
        currentView={view}
        onNavigate={handleNavigate}
        onSignOut={handleSignOut}
      />

      <div className="min-h-screen">
        {user && view === 'landing' && (
          <div className="absolute top-4 right-4 flex items-center gap-3 z-10 animate-fade-in-down">
            <QuickThemeToggle />
            <button
              onClick={() => setView('profile')}
              className="flex items-center gap-2 glass px-4 py-2 rounded-xl font-medium hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 shadow-lg backdrop-blur-md group"
            >
              <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 glass px-4 py-2 rounded-xl font-medium hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 shadow-lg backdrop-blur-md group"
            >
              <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              onClick={() => setView('settings')}
              className="flex items-center gap-2 glass px-4 py-2 rounded-xl font-medium hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 shadow-lg backdrop-blur-md group"
            >
              <SettingsIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 glass px-4 py-2 rounded-xl font-medium hover:bg-red-500/20 transition-all duration-300 shadow-lg backdrop-blur-md group text-red-600 dark:text-red-400"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}

        {view === 'landing' && <LandingPage onStartSession={handleStartSession} />}

        {view === 'chat' && currentSessionId && (
          <ChatInterface
            sessionId={currentSessionId}
            scenarioTitle={currentScenarioTitle}
            onBack={handleReturnHome}
            onShowFeedback={handleShowFeedback}
          />
        )}

        {view === 'feedback' && currentSessionId && (
          <FeedbackDisplay
            sessionId={currentSessionId}
            onBack={handleBackToChat}
            onReturnHome={handleReturnHome}
          />
        )}

        {view === 'dashboard' && (
          <Dashboard
            onBack={handleReturnHome}
            onViewSession={handleViewSession}
          />
        )}

        {view === 'profile' && <UserProfile onBack={handleReturnHome} />}

        {view === 'settings' && <Settings onBack={handleReturnHome} />}

        {view === 'session-history' && currentSessionId && (
          <SessionHistory
            sessionId={currentSessionId}
            onBack={() => setView('dashboard')}
          />
        )}
      </div>

      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
