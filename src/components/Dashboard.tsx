import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, TrendingUp, Award, Target, Clock, CheckCircle, Eye, BarChart3, Calendar, Star, Zap, Users, MessageCircle, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardProps {
  onBack: () => void;
  onViewSession?: (sessionId: string) => void;
}

interface SessionSummary {
  id: string;
  scenario_title: string;
  started_at: string;
  status: string;
  feedback?: {
    scores: {
      clarity: number;
      empathy: number;
      assertiveness: number;
    };
  };
}

// Progress chart component
const ProgressChart = ({ data, label }: { data: number; label: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const animate = () => {
      setAnimatedValue(prev => {
        const diff = data - prev;
        if (Math.abs(diff) < 0.1) return data;
        return prev + diff * 0.1;
      });
    };

    const interval = setInterval(animate, 50);
    return () => clearInterval(interval);
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 120;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 45;
    const lineWidth = 8;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Progress arc
    const progress = (animatedValue / 5) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progress);
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }, [animatedValue]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={120} height={120} className="mx-auto" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {animatedValue.toFixed(1)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {label}
        </div>
      </div>
    </div>
  );
};

export function Dashboard({ onBack, onViewSession }: DashboardProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    avgClarity: 0,
    avgEmpathy: 0,
    avgAssertiveness: 0,
    improvementRate: 0,
    streakDays: 0,
    totalTimeSpent: 0,
  });
  const { user } = useAuth();
  const { showTip } = useToast();
  const { actualTheme } = useTheme();

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('session')
        .select(`
          id,
          started_at,
          ended_at,
          status,
          scenario:scenario_id (title, estimated_duration)
        `)
        .eq('user_id', user!.id)
        .order('started_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      const sessionsWithFeedback = await Promise.all(
        (sessionsData || []).map(async (session: any) => {
          const { data: feedback } = await supabase
            .from('feedback')
            .select('scores')
            .eq('session_id', session.id)
            .maybeSingle();

          return {
            id: session.id,
            scenario_title: session.scenario?.title || 'Unknown',
            started_at: session.started_at,
            status: session.status,
            feedback: feedback || undefined,
          };
        })
      );

      setSessions(sessionsWithFeedback);

      const completedWithFeedback = sessionsWithFeedback.filter(s => s.feedback);
      const totalClarity = completedWithFeedback.reduce((sum, s) => sum + (s.feedback?.scores.clarity || 0), 0);
      const totalEmpathy = completedWithFeedback.reduce((sum, s) => sum + (s.feedback?.scores.empathy || 0), 0);
      const totalAssertiveness = completedWithFeedback.reduce((sum, s) => sum + (s.feedback?.scores.assertiveness || 0), 0);

      // Calculate improvement rate (simplified)
      const improvementRate = completedWithFeedback.length > 3 ? 15 : 0;
      
      // Calculate streak (simplified)
      const streakDays = Math.min(completedWithFeedback.length, 7);
      
      // Calculate total time spent
      const totalTimeSpent = sessionsWithFeedback.reduce((sum, s) => sum + 15, 0); // Assuming 15 min per session

      setStats({
        totalSessions: sessionsData?.length || 0,
        completedSessions: completedWithFeedback.length,
        avgClarity: completedWithFeedback.length > 0 ? totalClarity / completedWithFeedback.length : 0,
        avgEmpathy: completedWithFeedback.length > 0 ? totalEmpathy / completedWithFeedback.length : 0,
        avgAssertiveness: completedWithFeedback.length > 0 ? totalAssertiveness / completedWithFeedback.length : 0,
        improvementRate,
        streakDays,
        totalTimeSpent,
      });

      // Show tips based on performance
      if (completedWithFeedback.length > 0) {
        const avgScore = (stats.avgClarity + stats.avgEmpathy + stats.avgAssertiveness) / 3;
        if (avgScore > 4) {
          showTip('🎉 Excellent progress! You\'re mastering communication skills!');
        } else if (avgScore > 3) {
          showTip('💪 Great job! Keep practicing to reach the next level.');
        } else {
          showTip('🚀 You\'re improving! Try different scenarios to boost your skills.');
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showTip('Unable to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-secondary-500/5 to-accent-500/5 animate-gradient-x"></div>
        
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-500 mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-primary-500 opacity-20"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Loading Your Progress
          </h2>
          <p className="text-gray-600 dark:text-gray-400 animate-pulse">
            Analyzing your communication journey...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/3 via-secondary-500/3 to-accent-500/3 animate-gradient-x"></div>
      
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 glass px-4 py-2 rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform" />
          <span className="text-gray-700 dark:text-gray-200 font-medium">Back to Home</span>
        </button>

        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 glass-strong px-6 py-3 rounded-full shadow-xl mb-6 backdrop-blur-lg">
            <BarChart3 className="w-5 h-5 text-primary-500 animate-pulse" />
            <span className="gradient-text font-medium">Progress Dashboard</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4 animate-fade-in-up animate-delay-200">
            Your Communication
            <br />
            <span className="gradient-text">Journey</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto animate-fade-in-up animate-delay-300">
            Track your skills development and celebrate your progress
          </p>
        </div>

        {/* Time period selector */}
        <div className="flex justify-center mb-8 animate-fade-in-up animate-delay-400">
          <div className="glass-strong rounded-2xl p-2 backdrop-blur-lg">
            {(['week', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  selectedPeriod === period
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced stats grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="card-hover p-6 animate-fade-in-up animate-delay-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sessions</h3>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{stats.totalSessions}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
              <span>All time</span>
            </div>
          </div>

          <div className="card-hover p-6 animate-fade-in-up animate-delay-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{stats.completedSessions}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>With feedback</span>
            </div>
          </div>

          <div className="card-hover p-6 animate-fade-in-up animate-delay-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Streak</h3>
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{stats.streakDays}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>Days in a row</span>
            </div>
          </div>

          <div className="card-hover p-6 animate-fade-in-up animate-delay-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Time Spent</h3>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{stats.totalTimeSpent}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Minutes practiced</span>
            </div>
          </div>
        </div>

        {/* Progress charts */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="card-hover p-8 text-center animate-fade-in-up animate-delay-900">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Clarity</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">How clear and structured your messages are</p>
            </div>
            <ProgressChart data={stats.avgClarity} label="Avg Score" />
          </div>

          <div className="card-hover p-8 text-center animate-fade-in-up animate-delay-1000">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Empathy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Understanding and emotional awareness</p>
            </div>
            <ProgressChart data={stats.avgEmpathy} label="Avg Score" />
          </div>

          <div className="card-hover p-8 text-center animate-fade-in-up animate-delay-1100">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Assertiveness</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Confidence and boundary setting</p>
            </div>
            <ProgressChart data={stats.avgAssertiveness} label="Avg Score" />
          </div>
        </div>

        {/* Enhanced session history */}
        <div className="card-hover overflow-hidden animate-fade-in-up animate-delay-1200">
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-primary-500" />
                Practice History
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                <span>{sessions.length} sessions</span>
              </div>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="px-8 py-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-12 h-12 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No practice sessions yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Start your first practice session to see your progress here</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Start Practicing
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Scenario</th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Date</th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                    <th className="px-8 py-4 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">Clarity</th>
                    <th className="px-8 py-4 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">Empathy</th>
                    <th className="px-8 py-4 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">Assertiveness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sessions.map((session, index) => (
                    <tr
                      key={session.id}
                      className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 cursor-pointer animate-fade-in-up"
                      style={{ animationDelay: `${1200 + index * 100}ms` }}
                      onClick={() => onViewSession?.(session.id)}
                    >
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{session.scenario_title}</span>
                            {onViewSession && (
                              <Eye className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 inline" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-gray-600 dark:text-gray-400">{formatDate(session.started_at)}</td>
                      <td className="px-8 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            session.status === 'completed'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : session.status === 'active'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        {session.feedback ? (
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold shadow-md">
                            {session.feedback.scores.clarity.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-8 py-4 text-center">
                        {session.feedback ? (
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400 font-bold shadow-md">
                            {session.feedback.scores.empathy.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-8 py-4 text-center">
                        {session.feedback ? (
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 font-bold shadow-md">
                            {session.feedback.scores.assertiveness.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
