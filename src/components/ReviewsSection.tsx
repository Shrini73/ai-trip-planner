'use client';

import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const reviews = [
  {
    name: 'Sarah K.',
    avatar: '👩‍💼',
    location: 'London, UK',
    trip: 'Paris, France',
    rating: 5,
    review: 'VOYAGE AI planned my anniversary trip to Paris better than any travel agent I\'ve used. The AI understood exactly what we wanted — romantic restaurants, hidden courtyards, even the best times to visit the Louvre to avoid crowds. Absolutely magical!',
    date: 'June 2025',
  },
  {
    name: 'Marcus T.',
    avatar: '🧑‍🚀',
    location: 'New York, USA',
    trip: 'Tokyo, Japan',
    rating: 5,
    review: 'I was planning a solo trip to Tokyo and had no idea where to start. Within 30 seconds, VOYAGE AI gave me a complete 7-day plan with street food spots, anime districts, and day trips to Mt. Fuji. The budget breakdown was spot on!',
    date: 'September 2025',
  },
  {
    name: 'Priya M.',
    avatar: '👩‍🎨',
    location: 'Mumbai, India',
    trip: 'Bali, Indonesia',
    rating: 5,
    review: 'Planned a family trip to Bali for 4 people on a luxury budget. The AI found us the most incredible cliff-top villa, a private cooking class, and even a sunrise trekking guide. Every recommendation was perfect!',
    date: 'July 2025',
  },
  {
    name: 'Diego R.',
    avatar: '🧑‍💻',
    location: 'São Paulo, Brazil',
    trip: 'Morocco',
    rating: 5,
    review: 'The conversational interface is genius — I just chatted about my interests in photography, local food, and architecture, and it built an itinerary around exactly that. The cultural tips section saved me from so many faux pas!',
    date: 'October 2025',
  },
  {
    name: 'Emma L.',
    avatar: '👩‍🔬',
    location: 'Sydney, Australia',
    trip: 'Iceland',
    rating: 5,
    review: 'As a budget traveler, I was skeptical. But the budget version of Iceland came in under my estimate AND included northern lights viewing spots. The packing list was comprehensive and the map view is absolutely stunning!',
    date: 'August 2025',
  },
  {
    name: 'James W.',
    avatar: '🧑‍🍳',
    location: 'Chicago, USA',
    trip: 'Amalfi Coast, Italy',
    rating: 5,
    review: 'I\'m a food blogger and the restaurant recommendations were extraordinary — places I would never have found on my own. Hidden trattorias, local wineries, a seafood fisherman who does private tours. 10/10 would use again.',
    date: 'May 2025',
  },
];

export default function ReviewsSection() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? reviews.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === reviews.length - 1 ? 0 : c + 1));

  const visible = [
    reviews[(current) % reviews.length],
    reviews[(current + 1) % reviews.length],
    reviews[(current + 2) % reviews.length],
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1040]/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="badge badge-primary inline-flex mb-4">
            <Star className="w-3 h-3 star-filled" /> Reviews
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Loved by <span className="gradient-text">50,000+ Travelers</span>
          </h2>
          <p className="text-dark-400 text-lg max-w-xl mx-auto">
            Don&apos;t just take our word for it — here&apos;s what real travelers say about their AI-planned adventures.
          </p>
        </div>

        {/* Aggregate rating */}
        <div className="flex items-center justify-center gap-6 mb-12">
          <div className="text-center">
            <div className="font-display font-bold text-6xl gradient-text">4.9</div>
            <div className="flex items-center justify-center gap-1 my-1">
              {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 star-filled fill-yellow-400" />)}
            </div>
            <div className="text-dark-400 text-sm">Average rating</div>
          </div>
          <div className="w-px h-16 bg-white/10" />
          <div className="text-center">
            <div className="font-display font-bold text-4xl text-white">50K+</div>
            <div className="text-dark-400 text-sm mt-1">Happy travelers</div>
          </div>
          <div className="w-px h-16 bg-white/10" />
          <div className="text-center">
            <div className="font-display font-bold text-4xl text-white">120+</div>
            <div className="text-dark-400 text-sm mt-1">Destinations covered</div>
          </div>
        </div>

        {/* Reviews grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {visible.map((review, i) => (
            <div
              key={i}
              className={`glass-card p-6 transition-all duration-500 ${
                i === 1 ? 'md:scale-105 border-primary-500/30' : ''
              }`}
            >
              <Quote className="w-8 h-8 text-primary-500/40 mb-4" />
              <p className="text-dark-300 text-sm leading-relaxed mb-5 line-clamp-4">
                &quot;{review.review}&quot;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/30 to-purple-600/30 border border-primary-500/20 flex items-center justify-center text-xl">
                  {review.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">{review.name}</div>
                  <div className="text-dark-500 text-xs truncate">{review.location} → {review.trip}</div>
                </div>
                <div className="text-right">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'star-filled fill-yellow-400' : 'star-empty'}`} />
                    ))}
                  </div>
                  <div className="text-dark-500 text-xs mt-0.5">{review.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={prev} className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white hover:border-primary-500/50 hover:text-primary-400 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current ? 'bg-primary-500 w-6' : 'bg-dark-600 hover:bg-dark-500'
                }`}
              />
            ))}
          </div>
          <button onClick={next} className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white hover:border-primary-500/50 hover:text-primary-400 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
