import { useState, useEffect, useRef } from 'react';
import { Briefcase, MessageCircle, Users, TrendingUp, Sparkles, Star, Zap, Target, Award, ArrowRight, Play, Pause, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { AuthModal } from './AuthModal';

interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty_level?: string;
  estimated_duration?: number;
  objective?: string;
}

const iconMap: Record<string, any> = {
  briefcase: Briefcase,
  'message-circle': MessageCircle,
  users: Users,
  'trending-up': TrendingUp,
};

interface LandingPageProps {
  onStartSession: (scenarioId: string) => void;
}

// Animated background particles
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    const createParticles = () => {
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(20, 184, 166, ${particle.opacity})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    createParticles();
    animate();

    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-30"
      style={{ zIndex: -1 }}
    />
  );
};

// Floating stats component
const FloatingStats = () => {
  const stats = [
    { label: 'Active Users', value: '2.4K+', icon: Users },
    { label: 'Sessions Completed', value: '15.2K+', icon: Target },
    { label: 'Avg. Improvement', value: '87%', icon: TrendingUp },
  ];

  return (
    <div className="absolute top-20 left-4 space-y-4 animate-fade-in-left">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="glass rounded-xl p-4 backdrop-blur-md animate-float"
            style={{ animationDelay: `${index * 0.5}s` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function LandingPage({ onStartSession }: LandingPageProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [hoveredScenario, setHoveredScenario] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { user } = useAuth();
  const { showTip, showCelebration } = useToast();
  const { actualTheme } = useTheme();

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('scenario')
        .select('id, title, description, icon, difficulty_level, estimated_duration, objective')
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      setScenarios(data || []);
      
      // Show welcome tip
      setTimeout(() => {
        showTip('💡 Try different scenarios to improve various communication skills!');
      }, 2000);
    } catch (error) {
      console.error('Error loading scenarios:', error);
      showTip('Unable to load scenarios. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioClick = (scenarioId: string, title: string) => {
    if (!user) {
      setSelectedScenario(scenarioId);
      setShowAuth(true);
    } else {
      showCelebration(`Starting ${title} practice session! 🚀`);
      setTimeout(() => {
        onStartSession(scenarioId);
      }, 1000);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const toggleAudio = () => {
    setIsPlaying(!isPlaying);
    showTip(isPlaying ? '🔇 Audio disabled' : '🔊 Audio enabled');
  };

  useEffect(() => {
    if (user && selectedScenario) {
      onStartSession(selectedScenario);
      setSelectedScenario(null);
    }
  }, [user, selectedScenario]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <FloatingStats />
      
      {/* Audio toggle */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={toggleAudio}
          className="p-3 rounded-xl glass backdrop-blur-md hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 group"
          title={isPlaying ? 'Disable audio' : 'Enable audio'}
        >
          {isPlaying ? (
            <Volume2 className="w-5 h-5 text-primary-500 group-hover:scale-110 transition-transform" />
          ) : (
            <Pause className="w-5 h-5 text-gray-500 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 glass-strong px-6 py-3 rounded-full shadow-xl mb-6 backdrop-blur-lg animate-pulse">
            <Sparkles className="w-5 h-5 text-primary-500 animate-spin" />
            <span className="gradient-text font-medium">AI-Powered Learning Platform</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight animate-fade-in-up">
            Master Communication
            <br />
            <span className="gradient-text animate-gradient-x bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
              One Conversation at a Time
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animate-delay-300">
            Practice real-world communication scenarios with our AI coach. Get instant feedback
            on your clarity, empathy, and assertiveness to become a confident communicator.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-4 mt-8 animate-fade-in-up animate-delay-500">
            {[
              { icon: Zap, text: 'Instant Feedback' },
              { icon: Target, text: '3 Key Metrics' },
              { icon: Award, text: 'Progress Tracking' },
              { icon: Star, text: 'AI Coaching' },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.text}
                  className="flex items-center gap-2 glass px-4 py-2 rounded-full backdrop-blur-md hover:scale-105 transition-all duration-300"
                  style={{ animationDelay: `${600 + index * 100}ms` }}
                >
                  <Icon className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {feature.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-500"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-primary-500 opacity-20"></div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {scenarios.map((scenario, index) => {
              const Icon = iconMap[scenario.icon] || MessageCircle;
              const isHovered = hoveredScenario === scenario.id;
              
              return (
                <div
                  key={scenario.id}
                  className="group card-hover cursor-pointer perspective-1000"
                  onClick={() => handleScenarioClick(scenario.id, scenario.title)}
                  onMouseEnter={() => setHoveredScenario(scenario.id)}
                  onMouseLeave={() => setHoveredScenario(null)}
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className="relative overflow-hidden">
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-accent-500/10 transition-all duration-500 ${
                      isHovered ? 'opacity-100' : 'opacity-0'
                    }`} />
                    
                    {/* Icon with glow effect */}
                    <div className={`relative w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 ${
                      isHovered ? 'shadow-glow-lg' : ''
                    }`}>
                      <Icon className={`w-8 h-8 text-primary-600 dark:text-primary-400 transition-all duration-300 ${
                        isHovered ? 'animate-bounce-gentle' : ''
                      }`} />
                    </div>

                    {/* Difficulty badge */}
                    {scenario.difficulty_level && (
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(scenario.difficulty_level)}`}>
                        {scenario.difficulty_level}
                      </div>
                    )}

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:gradient-text transition-all duration-300">
                      {scenario.title}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 text-sm">
                      {scenario.description}
                    </p>

                    {/* Duration and objective */}
                    <div className="space-y-2 mb-6">
                      {scenario.estimated_duration && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                          <span>{scenario.estimated_duration} minutes</span>
                        </div>
                      )}
                      {scenario.objective && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {scenario.objective}
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium group-hover:gap-3 transition-all duration-300">
                        <span className="text-sm">Start Practice</span>
                        <ArrowRight className={`w-4 h-4 transition-all duration-300 ${
                          isHovered ? 'translate-x-1 scale-110' : 'opacity-0 -translate-x-2'
                        }`} />
                      </div>
                      
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-600 flex items-center justify-center transition-all duration-300 ${
                        isHovered ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                      }`}>
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Enhanced stats section */}
        <div className="text-center animate-fade-in-up animate-delay-700">
          <div className="inline-flex flex-col sm:flex-row gap-8 glass-strong p-8 rounded-3xl shadow-2xl backdrop-blur-lg border border-white/20 dark:border-white/10">
            <div className="text-center group">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2 group-hover:scale-110 transition-transform duration-300">
                Real-Time
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">AI Feedback</div>
              <div className="w-16 h-1 bg-gradient-to-r from-primary-500 to-secondary-600 mx-auto mt-2 rounded-full"></div>
            </div>
            <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
            <div className="text-center group">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2 group-hover:scale-110 transition-transform duration-300">
                3 Metrics
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Tracked & Scored</div>
              <div className="w-16 h-1 bg-gradient-to-r from-secondary-500 to-accent-600 mx-auto mt-2 rounded-full"></div>
            </div>
            <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
            <div className="text-center group">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2 group-hover:scale-110 transition-transform duration-300">
                Progress
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Analytics Dashboard</div>
              <div className="w-16 h-1 bg-gradient-to-r from-accent-500 to-primary-600 mx-auto mt-2 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        {!user && (
          <div className="text-center mt-16 animate-fade-in-up animate-delay-1000">
            <div className="glass-strong p-8 rounded-3xl shadow-2xl backdrop-blur-lg max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Ready to Transform Your Communication?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Join thousands of users who have improved their communication skills with our AI coach.
              </p>
              <button
                onClick={() => setShowAuth(true)}
                className="btn-primary text-lg px-8 py-4 animate-pulse"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
