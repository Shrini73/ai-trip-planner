'use client';

import { Brain, Map, Wallet, Download, MessageSquare, Shield, Clock, Star } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Generation',
    description: 'Google Gemini analyzes thousands of travel data points to craft itineraries perfectly matched to your style, budget, and interests.',
    gradient: 'from-primary-500 to-purple-600',
    tag: 'Core Feature',
  },
  {
    icon: Map,
    title: 'Interactive Maps',
    description: 'Visualize your entire trip on an interactive map with custom pins for every hotel, restaurant, and attraction.',
    gradient: 'from-blue-500 to-cyan-600',
    tag: 'Visual Planning',
  },
  {
    icon: Wallet,
    title: 'Smart Budget Planner',
    description: 'Real-time budget tracking with visual breakdowns across accommodation, food, transport, and activities.',
    gradient: 'from-green-500 to-emerald-600',
    tag: 'Budget Control',
  },
  {
    icon: MessageSquare,
    title: 'AI Travel Chat',
    description: 'Chat with your AI trip assistant anytime to tweak plans, get local tips, or answer your travel questions.',
    gradient: 'from-accent-500 to-orange-600',
    tag: 'AI Assistant',
  },
  {
    icon: Download,
    title: 'PDF Export',
    description: 'Export your complete itinerary as a beautifully formatted PDF — perfect for offline use or sharing with travel companions.',
    gradient: 'from-rose-500 to-pink-600',
    tag: 'Export & Share',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your travel plans are yours alone. End-to-end security with Clerk authentication and rate-limited API access.',
    gradient: 'from-violet-500 to-purple-600',
    tag: 'Security',
  },
];

const steps = [
  { step: '01', title: 'Tell Us Your Trip', desc: 'Share your destination, dates, budget, and travel style through our conversational AI interface.', icon: '💬' },
  { step: '02', title: 'AI Understands', desc: 'Our AI processes your preferences through the Understand → Generate → Review pipeline.', icon: '🧠' },
  { step: '03', title: 'Itinerary Generated', desc: 'Get a complete day-by-day plan with hotels, restaurants, attractions, and budget breakdown.', icon: '✨' },
  { step: '04', title: 'Explore & Refine', desc: 'Chat with AI to refine your plan, view it on a map, export to PDF, or share with friends.', icon: '🗺️' },
];

export default function FeaturesSection() {
  return (
    <>
      {/* Features Grid */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="badge badge-primary inline-flex mb-4">
              <Star className="w-3 h-3" /> Features
            </div>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
              Everything You Need for the{' '}
              <span className="gradient-text">Perfect Trip</span>
            </h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              From AI generation to interactive maps and PDF export — VOYAGE AI is the only travel planning tool you&apos;ll ever need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, gradient, tag }) => (
              <div key={title} className="glass-card p-6 group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="badge badge-primary text-xs">{tag}</span>
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-2">{title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-950/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-14">
            <div className="badge badge-accent inline-flex mb-4">
              <Clock className="w-3 h-3" /> How It Works
            </div>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
              From Idea to Itinerary <span className="gradient-text-accent">in 30 Seconds</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary-500/0 via-primary-500/50 to-primary-500/0" />

            {steps.map(({ step, title, desc, icon }) => (
              <div key={step} className="relative text-center">
                <div className="w-24 h-24 rounded-2xl glass border border-primary-500/20 flex items-center justify-center text-4xl mx-auto mb-5 relative">
                  {icon}
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    {step}
                  </div>
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-2">{title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
