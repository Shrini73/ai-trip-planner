'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, Sparkles, Loader2, MessageSquare, Lock, Crown, ArrowRight } from 'lucide-react';
import { GeneratedItinerary, ChatMessage, FeaturePermissions } from '@/lib/types';
import { getFeaturePermissions } from '@/lib/subscription';
import { getAuthToken } from '@/lib/auth';

interface AIChatProps {
  trip: GeneratedItinerary;
}

const QUICK_QUESTIONS = [
  "What's the best local food to try?",
  "Any hidden gems I shouldn't miss?",
  "What should I pack for this trip?",
  "What are the busiest tourist times?",
  "Any safety tips for this destination?",
  "What's the local transport like?",
];

export default function AIChat({ trip }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hi! I'm your AI travel assistant for your **${trip.tripTitle}** trip. I know every detail of your itinerary and can answer questions, suggest alternatives, or give local tips. What would you like to know?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<FeaturePermissions | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    getFeaturePermissions()
      .then((p) => {
        setPermissions(p);
        setCheckingAuth(false);
      })
      .catch(() => setCheckingAuth(false));
  }, []);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setInput('');
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const token = getAuthToken();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: msg,
          tripContext: {
            destination: trip.destination,
            days: trip.totalDays,
            budget: trip.budgetBreakdown.total,
            highlights: trip.highlights,
            culturalTips: trip.culturalTips,
          },
          history: messages.slice(-6),
        }),
      });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Chat request failed');
        }

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response || 'I\'m not sure about that. Could you rephrase?',
          timestamp: new Date().toISOString(),
        }]);
      } catch (err: unknown) {
        const msgError = err instanceof Error ? err.message : '';
        const fallbackResponse = generateFallbackResponse(msg, trip);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: msgError.includes('Voyager') ? msgError : fallbackResponse,
          timestamp: new Date().toISOString(),
        }]);
      } finally {
        setLoading(false);
      }
    };

    // If user is on Explorer free plan, display upgrade overlay
    const isChatLocked = permissions && !permissions.can_use_chat;

    return (
      <div className="max-w-3xl mx-auto">
          <div className="card p-0 overflow-hidden relative">
            {/* Chat Header */}
                  <div className="p-5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>VOYAGE AI Assistant</span>
                          {permissions?.can_use_chat && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
                              {permissions.plan_id === 'elite' ? 'Elite Access' : 'Voyager Access'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="status-dot status-done" />
                          <span className="text-xs text-dark-400">Knows your full itinerary · Ready to help</span>
                        </div>
                      </div>
                    </div>
                  </div>

                            {/* Feature Lock Overlay for Explorer plan */}
                            {isChatLocked ? (
                              <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[380px] bg-gradient-to-b from-dark-900/80 to-dark-950">
                                <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-4 text-primary-400">
                                  <Lock className="w-7 h-7" />
                                </div>
                                <h3 className="font-display font-bold text-xl text-white mb-2">
                                  AI Travel Assistant is a Voyager & Elite Feature
                                </h3>
                                <p className="text-dark-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                                  Unlock 24/7 personalized travel intelligence, hotel swaps, restaurant tips, local transit directions and itinerary changes on the fly.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                  <Link
                                    href="/checkout?plan=voyager"
                                    className="btn-primary py-2.5 px-5 text-sm flex items-center justify-center gap-2"
                                  >
                                    <Sparkles className="w-4 h-4" />
                                    <span>Start 7-Day Free Trial ($0 Today)</span>
                                  </Link>
                                  <Link
                                    href="/pricing"
                                    className="btn-secondary py-2.5 px-4 text-sm flex items-center justify-center gap-1.5"
                                  >
                                    <span>View Plans</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Messages */}
                                <div className="p-5 space-y-4 h-[380px] overflow-y-auto">
                                  {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                      {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                                          <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                      )}
                                      <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                          {msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                  {loading && (
                                    <div className="flex justify-start">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0">
                                        <Sparkles className="w-4 h-4 text-white" />
                                      </div>
                                      <div className="chat-bubble-ai flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                                        <span className="text-sm text-dark-400">Thinking...</span>
                                      </div>
                                    </div>
                                  )}
                                  <div ref={messagesEndRef} />
                                </div>

                                      {/* Quick Questions */}
                                      <div className="px-5 pb-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <MessageSquare className="w-3 h-3 text-dark-500" />
                                          <span className="text-dark-500 text-xs">Quick questions:</span>
                                        </div>
                                          <div className="flex flex-wrap gap-2">
                                            {QUICK_QUESTIONS.map((q) => (
                                              <button
                                                key={q}
                                                onClick={() => sendMessage(q)}
                                                disabled={loading}
                                                className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-dark-400 hover:border-primary-500/40 hover:text-primary-300 transition-all disabled:opacity-50 cursor-pointer"
                                              >
                                                {q}
                                              </button>
                                            ))}
                                          </div>
                                        </div>

                                      {/* Input */}
                                      <div className="p-5 pt-2 border-t border-white/5">
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                            placeholder={`Ask anything about ${trip.destination}...`}
                                            className="input flex-1 text-sm"
                                            disabled={loading}
                                          />
                                          <button
                                            onClick={() => sendMessage()}
                                            disabled={!input.trim() || loading}
                                            className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            <Send className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </>
        )}
                                  </div>
    </div>
                            );
}

                            function generateFallbackResponse(msg: string, trip: GeneratedItinerary): string {
  const m = msg.toLowerCase();
                            const dest = trip.destination;

                            if (m.includes('food') || m.includes('eat') || m.includes('restaurant') || m.includes('cuisine')) {
    const restaurants = trip.days.flatMap(d => d.restaurants).slice(0, 3);
                            return `Great question! For food in ${dest}, your itinerary already includes some fantastic spots:\n\n${restaurants.map(r => `• **${r.name}** — ${r.cuisine}. Try their ${r.specialDish}!`).join('\n')}\n\nI'd also recommend exploring local markets and street food for the most authentic experience. ${trip.culturalTips[2] || ''}`;
  }

                            if (m.includes('pack') || m.includes('bring') || m.includes('luggage') || m.includes('suitcase')) {
    return `Here's your personalized packing list for ${dest}:\n\n${trip.packingList.map(i => `✓ ${i}`).join('\n')}\n\n💡 Pro tip: Pack light and leave room for souvenirs — you'll likely find amazing local items to bring back!`;
  }

                            if (m.includes('safe') || m.includes('safety') || m.includes('danger') || m.includes('crime')) {
    return `Safety info for ${dest}:\n\n${trip.culturalTips.join('\n\n')}\n\n🚔 Emergency: ${trip.emergencyContacts.police}\n🚑 Ambulance: ${trip.emergencyContacts.ambulance}\n📞 Tourist helpline: ${trip.emergencyContacts.touristHelpline}\n\nGenerally, ${dest} is a popular tourist destination. Stay alert in crowded areas and keep copies of your documents.`;
  }

                            if (m.includes('hidden') || m.includes('gem') || m.includes('local') || m.includes('secret')) {
    return `For hidden gems in ${dest}, I'd suggest:\n\n• Explore neighborhoods away from tourist hotspots — locals know the best spots\n• Visit attractions on weekday mornings to avoid crowds\n• Ask your hotel concierge for their personal favorites\n• Your Day ${Math.min(3, trip.totalDays)} theme "${trip.days[Math.min(2, trip.days.length - 1)]?.theme}" is specifically curated for unique experiences!\n\n${trip.highlights[2] || ''}`;
  }

                            if (m.includes('transport') || m.includes('getting around') || m.includes('subway') || m.includes('bus') || m.includes('taxi')) {
    return `Getting around ${dest}:\n\n${trip.days[0]?.transportTips || ''}\n\n💡 Tips:\n• ${trip.culturalTips[1] || 'Always carry local currency'}\n• Download offline maps before you go\n• Your itinerary uses ${trip.days[0]?.transportTips?.includes('public') ? 'public transport' : 'flexible transport'} which is the most efficient option for your trip.`;
  }

                            if (m.includes('weather') || m.includes('temperature') || m.includes('climate') || m.includes('rain')) {
    return `Weather for ${dest} during your trip:\n\n🌤️ ${trip.weather}\n\n📅 Best time to visit: ${trip.bestTimeToVisit}\n\n💡 Packing tip: ${trip.packingList.find(i => i.toLowerCase().includes('layer') || i.toLowerCase().includes('weather')) || 'Pack layers to be prepared for varying conditions'}.`;
  }

                            if (m.includes('budget') || m.includes('money') || m.includes('cost') || m.includes('expensive') || m.includes('cheap')) {
    const perDay = Math.round(trip.budgetBreakdown.total / trip.totalDays);
                            return `Budget insights for your ${dest} trip:\n\n💰 Total budget: $${trip.budgetBreakdown.total.toLocaleString()}\n📅 Daily average: ~$${perDay}/day\n\nMoney-saving tips:\n${trip.budgetBreakdown.savingTips.map(t => `• ${t}`).join('\n')}`;
  }

                            // Generic response
                            return `Great question about ${dest}! Based on your ${trip.totalDays}-day itinerary, here are some key tips:\n\n• ${trip.culturalTips[0] || 'Respect local customs and dress codes'}\n• ${trip.highlights[0] || 'Explore with an open mind'}\n• Best visited: ${trip.bestTimeToVisit}\n\nIs there anything more specific you'd like to know about your trip? I can help with restaurants, attractions, transport, or cultural tips!`;
}
