import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, TrendingUp, Award, Target, Star, Sparkles, Zap, Heart, Share2, Download, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';

interface FeedbackDisplayProps {
  sessionId: string;
  onBack: () => void;
  onReturnHome: () => void;
}

interface Feedback {
  id: number;
  summary: string;
  scores: {
    clarity: number;
    empathy: number;
    assertiveness: number;
  };
  recommendations: string;
  created_at: string;
}

// Animated progress ring component
const AnimatedProgressRing = ({ score, color, delay = 0 }: { score: number; color: string; delay?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const animate = () => {
      setAnimatedScore(prev => {
        const diff = score - prev;
        if (Math.abs(diff) < 0.05) return score;
        return prev + diff * 0.1;
      });
    };

    const timeout = setTimeout(() => {
      const interval = setInterval(animate, 50);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [score, delay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 160;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 60;
    const lineWidth = 12;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Progress arc
    const progress = (animatedScore / 5) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progress);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.stroke();
  }, [animatedScore, color]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={160} height={160} className="mx-auto" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {animatedScore.toFixed(1)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          out of 5.0
        </div>
      </div>
    </div>
  );
};

export function FeedbackDisplay({ sessionId, onBack, onReturnHome }: FeedbackDisplayProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { showToast, showCelebration: showCelebrationToast } = useToast();
  const { actualTheme } = useTheme();

  useEffect(() => {
    loadOrGenerateFeedback();
  }, [sessionId]);

  const loadOrGenerateFeedback = async () => {
    try {
      const { data: existingFeedback, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) throw error;

      if (existingFeedback) {
        setFeedback(existingFeedback);
        setLoading(false);
      } else {
        await generateFeedback();
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
      setLoading(false);
    }
  };

  const generateFeedback = async () => {
    setGenerating(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/feedback`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate feedback');
      }

      const feedbackData = await response.json();
      setFeedback(feedbackData);
      
      // Show celebration for good scores
      const avgScore = (feedbackData.scores.clarity + feedbackData.scores.empathy + feedbackData.scores.assertiveness) / 3;
      if (avgScore >= 4) {
        setShowCelebration(true);
        showCelebrationToast('🎉 Outstanding performance! You\'re mastering communication skills!');
      } else if (avgScore >= 3.5) {
        showCelebrationToast('💪 Great job! You\'re making excellent progress!');
      } else {
        showCelebrationToast('🚀 Keep practicing! Every session helps you improve!');
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
      showToast('Failed to generate feedback. Please try again.', 'error');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const shareFeedback = () => {
    if (navigator.share && feedback) {
      navigator.share({
        title: 'My Communication Skills Progress',
        text: `Just completed a practice session! My scores: Clarity ${feedback.scores.clarity}/5, Empathy ${feedback.scores.empathy}/5, Assertiveness ${feedback.scores.assertiveness}/5`,
        url: window.location.href,
      });
    } else {
      showToast('Share feature copied to clipboard!', 'success');
    }
  };

  if (loading || generating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-secondary-500/5 to-accent-500/5 animate-gradient-x"></div>
        
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500 mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border-4 border-primary-500 opacity-20"></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Analyzing Your Performance
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Our AI coach is evaluating your conversation...
          </p>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to generate feedback</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'from-green-500 to-emerald-600';
    if (score >= 3) return 'from-teal-500 to-cyan-600';
    if (score >= 2) return 'from-yellow-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Celebration confetti */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/3 via-secondary-500/3 to-accent-500/3 animate-gradient-x"></div>
      
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 glass px-4 py-2 rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform" />
          <span className="text-gray-700 dark:text-gray-200 font-medium">Back to Chat</span>
        </button>

        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 glass-strong px-6 py-3 rounded-full shadow-xl mb-6 backdrop-blur-lg">
            <Award className="w-5 h-5 text-primary-500 animate-bounce-gentle" />
            <span className="gradient-text font-medium">Performance Analysis</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4 animate-fade-in-up animate-delay-200">
            Your Feedback
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto animate-fade-in-up animate-delay-300">
            {feedback.summary}
          </p>
        </div>

        {/* Enhanced score displays */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {[
            { label: 'Clarity', score: feedback.scores.clarity, icon: Target, color: '#14b8a6', description: 'Message structure and precision' },
            { label: 'Empathy', score: feedback.scores.empathy, icon: Award, color: '#06b6d4', description: 'Emotional awareness and validation' },
            { label: 'Assertiveness', score: feedback.scores.assertiveness, icon: TrendingUp, color: '#8b5cf6', description: 'Confidence and boundary setting' },
          ].map((metric, index) => (
            <div
              key={metric.label}
              className="card-hover p-8 text-center animate-fade-in-up"
              style={{ animationDelay: `${400 + index * 200}ms` }}
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <metric.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{metric.label}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{metric.description}</p>
              </div>

              <AnimatedProgressRing 
                score={metric.score} 
                color={metric.color} 
                delay={600 + index * 200} 
              />

              <div className="mt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metric.score >= 4 ? '🌟 Excellent performance!' :
                   metric.score >= 3 ? '💪 Good job, keep improving!' :
                   metric.score >= 2 ? '🚀 Fair, needs practice' :
                   '📈 Needs significant improvement'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced recommendations section */}
        <div className="card-hover p-8 mb-8 animate-fade-in-up animate-delay-1000">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            Recommendations for Improvement
          </h2>

          <div className="space-y-6">
            {feedback.recommendations.split('\n').filter(line => line.trim()).map((rec, index) => (
              <div 
                key={index} 
                className="flex gap-6 p-6 glass-strong rounded-2xl border border-white/20 dark:border-white/10 animate-fade-in-up"
                style={{ animationDelay: `${1200 + index * 200}ms` }}
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    {rec.replace(/^[•\-]\s*/, '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-6 animate-fade-in-up animate-delay-1400">
          <button
            onClick={shareFeedback}
            className="flex items-center gap-3 px-6 py-4 glass rounded-2xl font-medium hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform" />
            <span className="text-gray-700 dark:text-gray-200">Share Progress</span>
          </button>
          
          <button
            onClick={onReturnHome}
            className="btn-primary flex items-center gap-3 px-8 py-4 text-lg"
          >
            <Sparkles className="w-5 h-5" />
            Try Another Scenario
          </button>
        </div>

        {/* Overall score celebration */}
        <div className="text-center mt-12 animate-fade-in-up animate-delay-1600">
          <div className="glass-strong rounded-3xl p-8 backdrop-blur-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Star className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Overall Score</h3>
                <p className="text-gray-600 dark:text-gray-400">Based on all three metrics</p>
              </div>
            </div>
            <div className="text-6xl font-bold gradient-text mb-2">
              {((feedback.scores.clarity + feedback.scores.empathy + feedback.scores.assertiveness) / 3).toFixed(1)}
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">out of 5.0</p>
          </div>
        </div>
      </div>

    </div>
  );
}
