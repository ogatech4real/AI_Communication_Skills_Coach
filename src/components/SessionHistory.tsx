import { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Clock, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SessionHistoryProps {
  sessionId: string;
  onBack: () => void;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface SessionData {
  id: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  scenario: {
    title: string;
    description: string;
  };
  feedback?: {
    summary: string;
    scores: {
      clarity: number;
      empathy: number;
      assertiveness: number;
    };
    recommendations: string;
  };
}

export function SessionHistory({ sessionId, onBack }: SessionHistoryProps) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('session')
        .select(`
          id,
          started_at,
          ended_at,
          status,
          scenario:scenario_id (title, description)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      const { data: messagesData, error: messagesError } = await supabase
        .from('message')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at');

      if (messagesError) throw messagesError;

      setSession({
        ...(sessionData as any),
        feedback: feedbackData || undefined,
      });
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Session not found</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-8 py-6 text-white">
            <h1 className="text-3xl font-bold mb-2">{session.scenario.title}</h1>
            <p className="text-white/90 mb-4">{session.scenario.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Started: {formatDate(session.started_at)}</span>
              </div>
              {session.ended_at && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Ended: {formatDate(session.ended_at)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>{messages.length} messages</span>
              </div>
            </div>
          </div>

          {session.feedback && (
            <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-6 h-6 text-teal-600" />
                <h2 className="text-xl font-bold text-gray-900">Performance Summary</h2>
              </div>
              <p className="text-gray-700 mb-6">{session.feedback.summary}</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Clarity', score: session.feedback.scores.clarity },
                  { label: 'Empathy', score: session.feedback.scores.empathy },
                  { label: 'Assertiveness', score: session.feedback.scores.assertiveness },
                ].map((metric) => (
                  <div key={metric.label} className="text-center">
                    <div className="text-3xl font-bold text-teal-600 mb-1">
                      {metric.score.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Conversation History</h2>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">
                    {message.role === 'user' ? 'You' : 'AI Coach'} • {formatDate(message.created_at)}
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          {session.feedback && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h3>
              <div className="space-y-3">
                {session.feedback.recommendations.split('\n').filter(line => line.trim()).map((rec, index) => (
                  <div key={index} className="flex gap-3 p-4 bg-teal-50 rounded-xl">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{rec.replace(/^[•\-]\s*/, '')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
