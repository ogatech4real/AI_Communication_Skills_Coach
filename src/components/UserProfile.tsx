import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Calendar, Save, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface UserProfileProps {
  onBack: () => void;
}

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface Stats {
  totalSessions: number;
  totalFeedbacks: number;
  avgScore: number;
  bestScore: number;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalFeedbacks: 0,
    avgScore: 0,
    bestScore: 0,
  });
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserData();
      loadStats();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('app_user')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUserData(data);
        setFullName(data.full_name || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: sessions } = await supabase
        .from('session')
        .select('id')
        .eq('user_id', user!.id);

      const sessionIds = sessions?.map(s => s.id) || [];

      if (sessionIds.length > 0) {
        const { data: feedbacks } = await supabase
          .from('feedback')
          .select('scores')
          .in('session_id', sessionIds);

        if (feedbacks && feedbacks.length > 0) {
          const allScores = feedbacks.map((f: any) => {
            const scores = f.scores;
            return (scores.clarity + scores.empathy + scores.assertiveness) / 3;
          });

          const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
          const bestScore = Math.max(...allScores);

          setStats({
            totalSessions: sessions?.length || 0,
            totalFeedbacks: feedbacks.length,
            avgScore,
            bestScore,
          });
        } else {
          setStats({
            totalSessions: sessions?.length || 0,
            totalFeedbacks: 0,
            avgScore: 0,
            bestScore: 0,
          });
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_user')
        .update({ full_name: fullName.trim() })
        .eq('id', user!.id);

      if (error) throw error;

      showToast('Profile updated successfully', 'success');
      setUserData(prev => prev ? { ...prev, full_name: fullName.trim() } : null);
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

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
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full mb-4 shadow-xl">
            <User className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Profile</h1>
          <p className="text-gray-600">Manage your account and view your achievements</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>

            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={userData?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Member Since
                </label>
                <input
                  type="text"
                  value={userData ? formatDate(userData.created_at) : ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving || fullName === (userData?.full_name || '')}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-lg font-medium hover:from-teal-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-8 shadow-lg text-white">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Your Achievements</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-3xl font-bold mb-1">{stats.totalSessions}</div>
                  <div className="text-sm text-white/80">Practice Sessions Completed</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-3xl font-bold mb-1">{stats.totalFeedbacks}</div>
                  <div className="text-sm text-white/80">Feedbacks Received</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Average Score</span>
                    <span className="text-2xl font-bold text-teal-600">{stats.avgScore.toFixed(1)}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.avgScore / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Best Score</span>
                    <span className="text-2xl font-bold text-green-600">{stats.bestScore.toFixed(1)}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.bestScore / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
