'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Map, Star, Globe2, Zap } from 'lucide-react';

const stats = [
  { value: '50K+', label: 'Trips Planned' },
  { value: '120+', label: 'Destinations' },
  { value: '4.9★', label: 'User Rating' },
  { value: '<30s', label: 'Generation Time' },
];

const floatingCards = [
  { icon: '🗼', dest: 'Paris, France',   time: '5 days' },
  { icon: '🏔️', dest: 'Kyoto, Japan',    time: '7 days' },
  { icon: '🏖️', dest: 'Bali, Indonesia', time: '10 days' },
  { icon: '🌆', dest: 'New York, USA',   time: '4 days' },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-[#1a1040] to-dark-950" />

      {/* Animated orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl animate-pulse-slow delay-300" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-900/10 rounded-full blur-3xl" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — Text */}
          <div className="text-center lg:text-left animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 border border-primary-500/30">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-medium text-primary-300">Powered by Gemini AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>

            {/* Headline */}
            <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mb-6">
              <span className="text-white">Your Dream</span>
              <br />
              <span className="gradient-text glow-text-primary">Trip, Planned</span>
              <br />
              <span className="text-white">by AI</span>
            </h1>

            {/* Subheadline */}
            <p className="text-dark-300 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Tell us where you want to go. Our AI generates a complete, personalized 
              day-by-day itinerary with hotels, restaurants, attractions, and budget 
              breakdown — in seconds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <Link
                href="/create-trip"
                className="btn-primary flex items-center justify-center gap-2 text-base py-3.5 px-7 group"
              >
                <Sparkles className="w-5 h-5" />
                Start Planning Your Trip
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/my-trips"
                className="btn-secondary flex items-center justify-center gap-2 text-base py-3.5 px-7"
              >
                <Map className="w-5 h-5" />
                View Demo Trips
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto lg:mx-0">
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center lg:text-left">
                  <div className="font-display font-bold text-xl sm:text-2xl gradient-text">{value}</div>
                  <div className="text-dark-400 text-xs mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Floating UI */}
          <div className="relative hidden lg:flex items-center justify-center">
            {/* Main card */}
            <div className="glass-card p-6 w-80 shadow-2xl relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                  <Globe2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">VOYAGE AI</div>
                  <div className="flex items-center gap-1.5">
                    <span className="status-dot status-generating" />
                    <span className="text-xs text-dark-400">Generating itinerary...</span>
                  </div>
                </div>
              </div>

              {/* Generating animation */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-sm">🏨</div>
                  <div className="flex-1">
                    <div className="skeleton h-3 w-3/4 mb-1" />
                    <div className="skeleton h-2 w-1/2" />
                  </div>
                  <div className="skeleton h-5 w-16 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center text-sm">🍜</div>
                  <div className="flex-1">
                    <div className="skeleton h-3 w-2/3 mb-1" />
                    <div className="skeleton h-2 w-2/5" />
                  </div>
                  <div className="skeleton h-5 w-12 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-sm">🗺️</div>
                  <div className="flex-1">
                    <div className="skeleton h-3 w-4/5 mb-1" />
                    <div className="skeleton h-2 w-1/3" />
                  </div>
                  <div className="skeleton h-5 w-14 rounded-full" />
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-dark-400">
                  <span>Building your perfect trip</span>
                  <span className="text-primary-400">87%</span>
                </div>
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full w-[87%]" style={{animation: 'none'}} />
                </div>
              </div>
            </div>

            {/* Floating destination cards */}
            {floatingCards.map((card, i) => (
              <div
                key={card.dest}
                className="absolute glass rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl"
                style={{
                  top: i === 0 ? '-3rem' : i === 1 ? '5rem' : i === 2 ? 'auto' : '60%',
                  bottom: i === 2 ? '0' : i === 3 ? '2rem' : 'auto',
                  left: i === 1 ? '-5rem' : i === 3 ? '-4rem' : 'auto',
                  right: i === 0 ? '-3rem' : i === 2 ? '-4rem' : 'auto',
                  animation: `float ${5 + i}s ease-in-out infinite`,
                  animationDelay: `${i * 0.8}s`,
                }}
              >
                <span className="text-2xl">{card.icon}</span>
                <div>
                  <div className="text-white text-xs font-semibold">{card.dest}</div>
                  <div className="text-dark-400 text-xs">{card.time}</div>
                </div>
              </div>
            ))}

            {/* Features floating */}
            <div className="absolute -bottom-4 -left-8 glass rounded-xl px-4 py-3 flex items-center gap-2 shadow-xl" style={{ animation: 'float 7s ease-in-out infinite', animationDelay: '1s' }}>
              <Zap className="w-4 h-4 text-accent-400" />
              <span className="text-white text-xs font-semibold">AI-powered in 30s</span>
            </div>

            <div className="absolute top-1/2 -right-8 glass rounded-xl px-4 py-3 flex items-center gap-2 shadow-xl" style={{ animation: 'float 8s ease-in-out infinite', animationDelay: '2s' }}>
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-xs font-semibold">4.9 / 5 rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z" fill="rgba(15,23,42,0.5)" />
        </svg>
      </div>
    </section>
  );
}
