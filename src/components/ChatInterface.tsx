import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, ArrowLeft, BarChart3, Mic, MicOff, Volume2, VolumeX, Settings, MoreVertical, Clock, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  scenarioTitle: string;
  onBack: () => void;
  onShowFeedback: () => void;
}

export function ChatInterface({ sessionId, scenarioTitle, onBack, onShowFeedback }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast, showTip } = useToast();
  const { actualTheme } = useTheme();

  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('message')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at');

      if (error) throw error;

      if (data && data.length === 0) {
        await sendMessage('', true);
      } else {
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setInitializing(false);
    }
  };

  const sendMessage = async (content: string, isInitial = false) => {
    if ((!content.trim() && !isInitial) || loading) return;

    setLoading(true);
    setTypingIndicator(true);

    try {
      if (!isInitial) {
        const { data: userMessage, error: userError } = await supabase
          .from('message')
          .insert({
            session_id: sessionId,
            role: 'user',
            content: content.trim(),
          })
          .select()
          .single();

        if (userError) throw userError;
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        
        // Show tip for first message
        if (messages.length === 0) {
          showTip('💡 Try to be clear and specific in your responses for better feedback!');
        }
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_message: isInitial ? '' : content.trim(),
          is_initial: isInitial,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const result = await response.json();

      // Simulate typing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      const { data: assistantMessage, error: assistantError } = await supabase
        .from('message')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: result.message,
        })
        .select()
        .single();

      if (assistantError) throw assistantError;
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message. Please try again.', 'error');
    } finally {
      setLoading(false);
      setTypingIndicator(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    showTip(isRecording ? '🎤 Recording stopped' : '🎤 Recording started - speak clearly!');
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    showTip(isAudioEnabled ? '🔇 Audio disabled' : '🔊 Audio enabled');
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-secondary-500/5 to-accent-500/5 animate-gradient-x"></div>
        
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-500 mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-primary-500 opacity-20"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Preparing Your Session
          </h2>
          <p className="text-gray-600 dark:text-gray-400 animate-pulse">
            Setting up your AI communication coach...
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/3 via-secondary-500/3 to-accent-500/3 animate-gradient-x"></div>
      
      {/* Header */}
      <div className="glass-strong border-b border-white/20 dark:border-white/10 shadow-xl backdrop-blur-lg relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={onBack}
              className="p-3 glass rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {scenarioTitle}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Practice Session</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Control buttons */}
            <button
              onClick={toggleRecording}
              className={`p-3 rounded-xl transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 text-white shadow-lg animate-pulse' 
                  : 'glass hover:bg-white/20 dark:hover:bg-white/10'
              }`}
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={toggleAudio}
              className="p-3 glass rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300"
              title={isAudioEnabled ? 'Disable audio' : 'Enable audio'}
            >
              {isAudioEnabled ? (
                <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 glass rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            {messages.length >= 4 && (
              <button
                onClick={onShowFeedback}
                className="btn-primary flex items-center gap-2 animate-pulse"
              >
                <BarChart3 className="w-4 h-4" />
                Get Feedback
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 relative z-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-3 max-w-[85%]">
                {message.role === 'assistant' && (
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div
                  className={`relative rounded-3xl px-6 py-4 shadow-lg backdrop-blur-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white ml-auto'
                      : 'glass-strong text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-primary-600 dark:text-primary-400">
                      <span className="text-xs font-semibold">AI Coach</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                  
                  <div className="prose prose-sm max-w-none">
                    <p className="leading-relaxed whitespace-pre-wrap m-0">
                      {message.content}
                    </p>
                  </div>
                  
                  {/* Message timestamp */}
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' 
                      ? 'text-white/70' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {new Date(message.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-white font-semibold text-sm">You</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {(loading || typingIndicator) && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white animate-spin" />
                </div>
                <div className="glass-strong rounded-3xl px-6 py-4 shadow-lg">
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
                    <span className="text-xs font-semibold">AI Coach</span>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced input area */}
      <div className="glass-strong border-t border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-lg relative z-10">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex gap-4 items-end">
              {/* Recording indicator */}
              {isRecording && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-600 dark:text-red-400 text-sm font-medium">Recording...</span>
                </div>
              )}
              
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message or speak your response..."
                  className="input w-full px-6 py-4 pr-12 text-lg resize-none rounded-2xl shadow-lg"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                
                {/* Character count and suggestions */}
                <div className="absolute bottom-2 right-4 flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {input.length}/500
                  </span>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary flex items-center gap-2 px-6 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            
            {/* Quick action buttons */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => showTip('💡 Try being more specific or asking follow-up questions!')}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors"
                >
                  💡 Need help?
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Press Enter to send</span>
                <span>•</span>
                <span>Shift+Enter for new line</span>
              </div>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
