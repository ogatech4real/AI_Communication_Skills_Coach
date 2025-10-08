import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
}

const steps = [
  {
    title: 'Welcome to AI Life Coach',
    description: 'Master real-world communication skills through AI-powered practice sessions. Get instant feedback and track your progress over time.',
    image: '🎯',
  },
  {
    title: 'Choose Your Scenario',
    description: 'Select from various practice scenarios like job interviews, conflict resolution, or client presentations. Each scenario is tailored to help you improve specific skills.',
    image: '💼',
  },
  {
    title: 'Practice with AI Coach',
    description: 'Engage in realistic conversations with our AI coach. The AI adapts to your responses and creates a challenging yet supportive learning environment.',
    image: '💬',
  },
  {
    title: 'Get Detailed Feedback',
    description: 'After your session, receive AI-generated feedback on three key metrics: Clarity, Empathy, and Assertiveness. Learn exactly what to improve.',
    image: '📊',
  },
  {
    title: 'Track Your Progress',
    description: 'View your performance history, average scores, and improvements over time in your personal dashboard. Watch yourself grow!',
    image: '📈',
  },
];

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden transform transition-all duration-500 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              <span className="font-semibold">Getting Started</span>
            </div>
            <button
              onClick={handleSkip}
              className="text-white/80 hover:text-white transition-colors text-sm"
            >
              Skip Tour
            </button>
          </div>
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index <= currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              ></div>
            ))}
          </div>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="text-7xl mb-6 animate-bounce-slow">{step.image}</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{step.title}</h2>
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
              {step.description}
            </p>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="text-sm text-gray-500">
              {currentStep + 1} of {steps.length}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              {currentStep === steps.length - 1 ? (
                <X className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
