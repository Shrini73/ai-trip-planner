'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Send, Sparkles, MapPin, Calendar, Users, Wallet, Heart,
  Home, Car, ArrowRight, Loader2, ChevronRight, Zap
} from 'lucide-react';
import { TripPreferences, PlanningStep, ChatMessage } from '@/lib/types';
import { DEMO_SCENARIOS, generateTripId } from '@/lib/trips';
import { getAuthToken } from '@/lib/auth';

type StepData = {
  question: string;
  placeholder?: string;
  type: 'text' | 'choice' | 'multi-choice' | 'number' | 'date-range' | 'budget';
  choices?: { label: string; value: string; icon?: string }[];
  field: keyof TripPreferences | null;
  nextStep: PlanningStep;
  icon: React.ReactNode;
};

const STEPS: Record<PlanningStep, StepData | null> = {
  welcome: null,
  origin: {
    question: "Where are you flying from? 🛫",
    placeholder: "e.g. New York, USA",
    type: 'text',
    field: 'origin',
    nextStep: 'destination',
    icon: <MapPin className="w-5 h-5" />,
  },
  destination: {
    question: "Amazing! Now, where's your dream destination? 🌍",
    placeholder: "e.g. Paris, France",
    type: 'text',
    field: 'destination',
    nextStep: 'dates',
    icon: <MapPin className="w-5 h-5" />,
  },
  dates: {
    question: "When are you planning to travel? 📅",
    type: 'date-range',
    field: null,
    nextStep: 'travelers',
    icon: <Calendar className="w-5 h-5" />,
  },
  travelers: {
    question: "How many travelers? 👥",
    type: 'choice',
    field: 'travelers',
    nextStep: 'budget',
    icon: <Users className="w-5 h-5" />,
    choices: [
      { label: 'Solo', value: '1', icon: '🧳' },
      { label: 'Couple', value: '2', icon: '💑' },
      { label: 'Small Group (3-4)', value: '3', icon: '👨‍👩‍👧' },
      { label: 'Large Group (5+)', value: '5', icon: '👨‍👩‍👧‍👦' },
    ],
  },
  budget: {
    question: "What's your budget level? 💰",
    type: 'budget',
    field: 'budget',
    nextStep: 'style',
    icon: <Wallet className="w-5 h-5" />,
    choices: [
      { label: 'Budget', value: 'budget', icon: '🎒' },
      { label: 'Moderate', value: 'moderate', icon: '✈️' },
      { label: 'Luxury', value: 'luxury', icon: '👑' },
    ],
  },
  style: {
    question: "What's your travel style? (Pick all that apply) 🎯",
    type: 'multi-choice',
    field: 'travelStyle',
    nextStep: 'interests',
    icon: <Heart className="w-5 h-5" />,
    choices: [
      { label: 'Adventure', value: 'adventure', icon: '🧗' },
      { label: 'Cultural', value: 'cultural', icon: '🏛️' },
      { label: 'Romantic', value: 'romantic', icon: '💕' },
      { label: 'Family', value: 'family', icon: '👨‍👩‍👧' },
      { label: 'Solo', value: 'solo', icon: '🧘' },
      { label: 'Luxury', value: 'luxury', icon: '✨' },
      { label: 'Budget', value: 'budget', icon: '💡' },
      { label: 'Relaxation', value: 'relaxation', icon: '🏖️' },
    ],
  },
  interests: {
    question: "What are you most interested in? 🎨",
    type: 'multi-choice',
    field: 'interests',
    nextStep: 'accommodation',
    icon: <Heart className="w-5 h-5" />,
    choices: [
      { label: 'Food & Cuisine', value: 'food', icon: '🍜' },
      { label: 'Art & Museums', value: 'art', icon: '🎨' },
      { label: 'History', value: 'history', icon: '🏛️' },
      { label: 'Nature', value: 'nature', icon: '🌿' },
      { label: 'Beaches', value: 'beaches', icon: '🏖️' },
      { label: 'Architecture', value: 'architecture', icon: '🏰' },
      { label: 'Nightlife', value: 'nightlife', icon: '🌃' },
      { label: 'Shopping', value: 'shopping', icon: '🛍️' },
      { label: 'Wellness', value: 'wellness', icon: '🧘' },
      { label: 'Sports', value: 'sports', icon: '⚽' },
    ],
  },
  accommodation: {
    question: "Where would you like to stay? 🏨",
    type: 'choice',
    field: 'accommodation',
    nextStep: 'transport',
    icon: <Home className="w-5 h-5" />,
    choices: [
      { label: 'Hostel', value: 'hostel', icon: '🎒' },
      { label: 'Hotel', value: 'hotel', icon: '🏨' },
      { label: 'Boutique Hotel', value: 'boutique', icon: '🏡' },
      { label: 'Resort', value: 'resort', icon: '🌴' },
      { label: 'Airbnb / Apartment', value: 'airbnb', icon: '🏠' },
    ],
  },
  transport: {
    question: "How do you prefer to get around? 🚌",
    type: 'choice',
    field: 'transportMode',
    nextStep: 'review',
    icon: <Car className="w-5 h-5" />,
    choices: [
      { label: 'Public Transit', value: 'public-transport', icon: '🚇' },
      { label: 'Taxi / Ride-share', value: 'taxi', icon: '🚕' },
      { label: 'Rent a Car', value: 'car-rental', icon: '🚗' },
      { label: 'Private Car', value: 'private-car', icon: '🚙' },
      { label: 'Walk / Bike', value: 'walk', icon: '🚶' },
    ],
  },
  review: null,
  generating: null,
  complete: null,
};

const BUDGET_AMOUNTS: Record<string, number> = {
  budget: 1500,
  moderate: 4000,
  luxury: 12000,
};

const defaultPrefs: TripPreferences = {
  origin: '',
  destination: '',
  startDate: '',
  endDate: '',
  travelers: 1,
  budget: 'moderate',
  budgetAmount: 4000,
  travelStyle: [],
  interests: [],
  accommodation: 'hotel',
  transportMode: 'public-transport',
};

export default function CreateTripPage() {
  const router = useRouter();
  const [step, setStep] = useState<PlanningStep>('welcome');
  const [prefs, setPrefs] = useState<TripPreferences>(defaultPrefs);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: "✈️ Welcome to **VOYAGE AI**! I'm your personal AI travel planner. Let me create a personalized itinerary just for you.\n\nTell me about your dream trip, or pick one of our demo scenarios to get started instantly!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('4000');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: ChatMessage['role'], content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date().toISOString(),
    }]);
  };

  const askNextStep = (nextStep: PlanningStep, contextPrefs?: TripPreferences) => {
    setStep(nextStep);
    setSelectedChoices([]);
    setInputValue('');

    const stepData = STEPS[nextStep];
    if (!stepData) {
      if (nextStep === 'review') {
        const p = contextPrefs || prefs;
        const days = Math.ceil(
          (new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        addMessage('assistant',
          `✅ **Perfect! Here's your trip summary:**\n\n` +
          `📍 **${p.origin}** → **${p.destination}**\n` +
          `📅 ${p.startDate} to ${p.endDate} (${days} days)\n` +
          `👥 ${p.travelers} traveler${p.travelers > 1 ? 's' : ''}\n` +
          `💰 ${p.budget.charAt(0).toUpperCase() + p.budget.slice(1)} budget (~$${p.budgetAmount.toLocaleString()})\n` +
          `🎯 Style: ${p.travelStyle.join(', ') || 'Flexible'}\n` +
          `❤️ Interests: ${p.interests.join(', ') || 'All'}\n` +
          `🏨 Staying at: ${p.accommodation}\n` +
          `🚌 Getting around by: ${p.transportMode}\n\n` +
          `Ready to generate your AI itinerary? 🚀`
        );
      }
      return;
    }

    addMessage('assistant', stepData.question);
  };

  const handleTextSubmit = () => {
    if (!inputValue.trim()) return;

    const stepData = STEPS[step];
    if (!stepData) return;

    addMessage('user', inputValue.trim());

    const updatedPrefs = { ...prefs };
    if (stepData.field && typeof prefs[stepData.field] === 'string') {
      (updatedPrefs as Record<string, unknown>)[stepData.field as string] = inputValue.trim();
    }

    setPrefs(updatedPrefs);
    askNextStep(stepData.nextStep, updatedPrefs);
  };

  const handleChoice = (value: string, label: string) => {
    const stepData = STEPS[step];
    if (!stepData) return;

    addMessage('user', label);

    let updatedPrefs = { ...prefs };

    if (stepData.type === 'budget') {
      updatedPrefs.budget = value as TripPreferences['budget'];
      updatedPrefs.budgetAmount = parseInt(budgetAmount) || BUDGET_AMOUNTS[value];
    } else if (stepData.field) {
      if (stepData.field === 'travelers') {
        updatedPrefs.travelers = parseInt(value);
      } else {
        (updatedPrefs as Record<string, unknown>)[stepData.field as string] = value;
      }
    }

    setPrefs(updatedPrefs);
    askNextStep(stepData.nextStep, updatedPrefs);
  };

  const handleMultiChoiceSubmit = () => {
    const stepData = STEPS[step];
    if (!stepData || selectedChoices.length === 0) return;

    addMessage('user', selectedChoices.join(', '));

    const updatedPrefs = { ...prefs };
    if (stepData.field) {
      (updatedPrefs as Record<string, unknown>)[stepData.field as string] = selectedChoices;
    }

    setPrefs(updatedPrefs);
    askNextStep(stepData.nextStep, updatedPrefs);
  };

  const handleDateSubmit = () => {
    if (!startDate || !endDate) return;

    addMessage('user', `${startDate} to ${endDate}`);

    const updatedPrefs = { ...prefs, startDate, endDate };
    setPrefs(updatedPrefs);
    askNextStep('travelers', updatedPrefs);
  };

  const handleDemoScenario = (scenario: typeof DEMO_SCENARIOS[0]) => {
    addMessage('user', `Load demo: ${scenario.name}`);
    addMessage('assistant',
      `🎉 Loading **${scenario.name}** demo scenario!\n\n` +
      `📍 **${scenario.preferences.origin}** → **${scenario.preferences.destination}**\n` +
      `📅 ${scenario.preferences.startDate} to ${scenario.preferences.endDate}\n` +
      `👥 ${scenario.preferences.travelers} traveler(s)\n` +
      `💰 ${scenario.preferences.budget.charAt(0).toUpperCase() + scenario.preferences.budget.slice(1)} budget\n\n` +
      `Generating your AI itinerary now...`
    );

    setPrefs(scenario.preferences);
    setStartDate(scenario.preferences.startDate);
    setEndDate(scenario.preferences.endDate);
    generateItinerary(scenario.preferences);
  };

  const generateItinerary = async (tripPrefs?: TripPreferences) => {
    const finalPrefs = tripPrefs || prefs;
    setIsGenerating(true);
    setStep('generating');
    setError('');

    const tripId = generateTripId();

    const generatingMsg: ChatMessage = {
      id: 'generating',
      role: 'assistant',
      content: '🤖 **AI is generating your itinerary...**\n\nThis takes about 10-30 seconds. I\'m researching:\n• Best hotels for your budget\n• Must-visit restaurants\n• Top attractions & timings\n• Transportation options\n• Budget breakdown\n• Cultural tips',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, generatingMsg]);

    try {
      const token = getAuthToken();
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ preferences: finalPrefs, tripId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate itinerary');
      }

      // Save to localStorage
      if (typeof window !== 'undefined') {
        const { saveTrip } = await import('@/lib/trips');
        saveTrip(data.itinerary);
      }

      addMessage('assistant',
        `✅ **Your itinerary is ready!**\n\n` +
        `🗺️ **${data.itinerary.tripTitle}**\n\n` +
        `${data.itinerary.summary}\n\n` +
        `**Highlights:**\n${data.itinerary.highlights.map((h: string) => `• ${h}`).join('\n')}\n\n` +
        `Redirecting to your complete itinerary...`
      );

      setTimeout(() => {
        router.push(`/trip/${tripId}`);
      }, 2000);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setError(msg);
      setIsGenerating(false);
      setStep('review');
      addMessage('assistant', `❌ Error: ${msg}\n\nPlease try again.`);
    }
  };

  const toggleChoice = (value: string) => {
    setSelectedChoices(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const stepData = STEPS[step];
  const progressSteps = ['origin', 'destination', 'dates', 'travelers', 'budget', 'style', 'interests', 'accommodation', 'transport'];
  const currentIdx = progressSteps.indexOf(step);
  const progress = currentIdx >= 0 ? ((currentIdx + 1) / progressSteps.length) * 100 : step === 'review' ? 100 : step === 'generating' || step === 'complete' ? 100 : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pt-20 pb-6">
        {/* Header */}
        <div className="py-6 text-center">
          <div className="badge badge-primary inline-flex mb-3">
            <Sparkles className="w-3 h-3" /> AI Trip Planner
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-white mb-2">
            Plan Your Perfect Trip
          </h1>
          <p className="text-dark-400 text-sm">
            Chat with AI · Get a complete itinerary in seconds
          </p>
        </div>

        {/* Progress bar */}
        {step !== 'welcome' && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-dark-500 mb-1.5">
              <span>Planning Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-[350px] max-h-[450px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {formatMessage(msg.content)}
                </div>
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="chat-bubble-ai">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                  <span className="text-sm text-dark-300">Generating your perfect itinerary...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Demo Scenarios — shown at welcome */}
        {step === 'welcome' && (
          <div className="mb-4">
            <p className="text-dark-400 text-xs mb-3 text-center">✦ Try a demo scenario or start planning your own trip</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {DEMO_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleDemoScenario(scenario)}
                  className="glass-card p-4 text-left hover:border-primary-500/50 transition-all group"
                >
                  <div className="font-semibold text-white text-sm mb-1 group-hover:text-primary-300 transition-colors">
                    {scenario.name}
                  </div>
                  <div className="text-dark-400 text-xs">{scenario.description}</div>
                </button>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={() => {
                  addMessage('assistant', "Great! Let's start planning your custom trip. First question:");
                  setTimeout(() => askNextStep('origin'), 500);
                }}
                className="btn-primary inline-flex items-center gap-2 text-sm py-2.5"
              >
                <Sparkles className="w-4 h-4" />
                Plan My Custom Trip
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step Input UI */}
        {step !== 'welcome' && step !== 'generating' && step !== 'complete' && (
          <div className="glass-card p-4">
            {/* Review step */}
            {step === 'review' && (
              <div className="space-y-3">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <button
                  onClick={() => generateItinerary()}
                  disabled={isGenerating}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                  ) : (
                    <><Zap className="w-5 h-5" /> Generate My Itinerary!</>
                  )}
                </button>
                <button
                  onClick={() => {
                    setStep('welcome');
                    setPrefs(defaultPrefs);
                    setMessages([{
                      id: '0',
                      role: 'assistant',
                      content: "✈️ Welcome back! Let's plan another amazing trip. Where would you like to go?",
                      timestamp: new Date().toISOString(),
                    }]);
                  }}
                  className="btn-secondary w-full text-sm py-2"
                >
                  Start Over
                </button>
              </div>
            )}

            {/* Date range picker */}
            {step === 'dates' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="input text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={handleDateSubmit}
                  disabled={!startDate || !endDate}
                  className="btn-primary w-full text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Dates
                </button>
              </div>
            )}

            {/* Budget step with amount input */}
            {step === 'budget' && stepData?.type === 'budget' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {stepData.choices?.map(({ label, value, icon }) => (
                    <button
                      key={value}
                      onClick={() => handleChoice(value, label)}
                      className={`p-3 rounded-xl border transition-all text-center ${
                        prefs.budget === value
                          ? 'border-primary-500 bg-primary-500/20 text-white'
                          : 'border-white/10 bg-dark-800/50 text-dark-300 hover:border-primary-500/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{icon}</div>
                      <div className="text-xs font-semibold">{label}</div>
                      <div className="text-xs text-dark-500">
                        ~${BUDGET_AMOUNTS[value].toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Custom budget amount (USD)</label>
                  <input
                    type="number"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="e.g. 3500"
                    className="input text-sm"
                    min="100"
                  />
                </div>
              </div>
            )}

            {/* Single choice */}
            {step !== 'dates' && step !== 'review' && step !== 'budget' && stepData?.type === 'choice' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {stepData.choices?.map(({ label, value, icon }) => (
                  <button
                    key={value}
                    onClick={() => handleChoice(value, label)}
                    className="p-3 rounded-xl border border-white/10 bg-dark-800/50 text-dark-300 hover:border-primary-500/50 hover:text-white hover:bg-primary-500/10 transition-all text-sm flex items-center gap-2"
                  >
                    <span className="text-lg">{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Multi choice */}
            {stepData?.type === 'multi-choice' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {stepData.choices?.map(({ label, value, icon }) => (
                    <button
                      key={value}
                      onClick={() => toggleChoice(value)}
                      className={`tag ${selectedChoices.includes(value) ? 'selected' : ''}`}
                    >
                      <span>{icon}</span> {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleMultiChoiceSubmit}
                  disabled={selectedChoices.length === 0}
                  className="btn-primary text-sm py-2.5 w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Continue ({selectedChoices.length} selected)
                </button>
              </div>
            )}

            {/* Text input */}
            {step !== 'dates' && step !== 'review' && stepData?.type === 'text' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                  placeholder={stepData.placeholder || 'Type your answer...'}
                  className="input flex-1 text-sm"
                  autoFocus
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!inputValue.trim()}
                  className="btn-primary px-4 py-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatMessage(content: string): React.ReactNode {
  // Basic markdown-like formatting
  return content.split('\n').map((line, i) => {
    let formatted = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: formatted }} />
        {i < content.split('\n').length - 1 && <br />}
      </span>
    );
  });
}
