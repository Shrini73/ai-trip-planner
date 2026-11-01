'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Map, Calendar, Users, Wallet, Trash2, ArrowRight,
  Sparkles, Plus, Clock, MapPin, Loader2, Crown
} from 'lucide-react';
import Link from 'next/link';
import { GeneratedItinerary, UserSubscription } from '@/lib/types';
import { getAllTrips, deleteTrip, formatDateRange, DEMO_SCENARIOS, saveTrip, generateTripId } from '@/lib/trips';
import { getSubscriptionStatus } from '@/lib/subscription';

export default function MyTripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<GeneratedItinerary[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loadingDemoId, setLoadingDemoId] = useState<string | null>(null);
  const [sub, setSub] = useState<UserSubscription | null>(null);

  useEffect(() => {
    setMounted(true);
    setTrips(getAllTrips());
    getSubscriptionStatus().then(setSub).catch(() => setSub(null));
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this trip itinerary?')) {
      deleteTrip(id);
      setTrips(getAllTrips());
    }
  };

  const handleLoadDemo = async (scenario: typeof DEMO_SCENARIOS[0]) => {
    setLoadingDemoId(scenario.id);
    const tripId = generateTripId();
    try {
      const res = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: scenario.preferences, tripId }),
      });
      const data = await res.json();
      if (data.itinerary) {
        saveTrip(data.itinerary);
        router.push(`/trip/${tripId}`);
      } else {
        alert('Could not load demo trip. Please try again.');
      }
    } catch {
      alert('Failed to generate demo trip.');
    } finally {
      setLoadingDemoId(null);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-dark-400 text-sm">Loading your saved trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
          <div>
            <div className="badge badge-primary inline-flex mb-2">
              <Map className="w-3 h-3" /> Saved Itineraries
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">
              My <span className="gradient-text">Trips</span>
            </h1>
            <p className="text-dark-400 text-sm mt-1">
              Access your personalized AI travel plans anytime, anywhere.
            </p>
          </div>

          <button
            onClick={() => router.push('/create-trip')}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto text-sm py-2.5 px-5"
          >
            <Plus className="w-4 h-4" />
            Plan New Trip
          </button>
        </div>

        {/* Subscription Account Status Banner */}
        <div className="mb-8 p-4 rounded-2xl glass-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              sub?.plan_id === 'elite'
                ? 'bg-amber-500/20 text-amber-400'
                : sub?.plan_id === 'voyager'
                ? 'bg-primary-500/20 text-primary-400'
                : 'bg-white/10 text-dark-300'
            }`}>
              {sub?.plan_id === 'elite' ? <Crown className="w-5 h-5" /> : sub?.plan_id === 'voyager' ? <Sparkles className="w-5 h-5" /> : <Map className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">
                  {sub?.plan_name ? `${sub.plan_name} Membership` : 'Explorer Plan (Free)'}
                </span>
                {sub?.status === 'trialing' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Trial Active ({sub.remaining_trial_days} days left)
                  </span>
                )}
                {sub?.status === 'active' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                    Active
                  </span>
                )}
              </div>
              <p className="text-dark-400 text-xs mt-0.5">
                {sub?.status === 'trialing'
                  ? `Free trial ends on ${sub.trial_end ? new Date(sub.trial_end).toLocaleDateString() : '7 days'}. Unlimited planning active.`
                  : sub?.status === 'active'
                  ? 'Unlimited AI trip planning and premium travel intelligence active.'
                  : '3 itineraries per month · Up to 7-day trips.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sub?.plan_id === 'voyager' && (
              <Link
                href="/subscription"
                className="btn-accent text-xs py-2 px-3.5 flex items-center gap-1"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Go Elite</span>
              </Link>
            )}
            {(!sub || sub.plan_id === 'free') && (
              <Link
                href="/checkout?plan=voyager"
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start 7-Day Free Trial</span>
              </Link>
            )}
            <Link
              href="/subscription"
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1"
            >
              <span>Manage Subscription</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Trips Grid or Empty State */}
        {trips.length === 0 ? (
          <div className="glass-card p-10 sm:p-14 text-center max-w-2xl mx-auto space-y-6">
            <div className="text-6xl">🗺️</div>
            <div>
              <h2 className="font-display font-bold text-2xl text-white mb-2">
                No Trips Planned Yet
              </h2>
              <p className="text-dark-400 text-sm max-w-md mx-auto leading-relaxed">
                You haven&apos;t generated any itineraries yet. Create your first customized AI trip plan or test drive one of our curated demo scenarios below.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => router.push('/create-trip')}
                className="btn-primary inline-flex items-center gap-2 text-sm py-3 px-6"
              >
                <Sparkles className="w-4 h-4" />
                Create a Trip with AI
              </button>
            </div>

            {/* Demo scenarios */}
            <div className="pt-8 border-t border-white/5">
              <div className="text-xs text-dark-400 uppercase tracking-wider font-semibold mb-3">
                Or Instant-Load a Demo Trip:
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-left">
                {DEMO_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => handleLoadDemo(scenario)}
                    disabled={loadingDemoId !== null}
                    className="glass p-3.5 rounded-xl border border-white/10 hover:border-primary-500/40 hover:bg-primary-500/10 transition-all text-left group"
                  >
                    <div className="font-semibold text-white text-sm mb-1 group-hover:text-primary-300 flex items-center justify-between">
                      <span>{scenario.name}</span>
                      {loadingDemoId === scenario.id && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-400" />
                      )}
                    </div>
                    <div className="text-xs text-dark-400 line-clamp-2">{scenario.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => router.push(`/trip/${trip.id}`)}
                className="glass-card p-6 flex flex-col justify-between cursor-pointer group hover:border-primary-500/40"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="badge badge-primary text-xs">
                      {trip.totalDays} Days
                    </span>
                    <button
                      onClick={(e) => handleDelete(trip.id, e)}
                      title="Delete trip"
                      className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & destination */}
                  <div>
                    <h3 className="font-display font-bold text-xl text-white group-hover:text-primary-300 transition-colors">
                      {trip.tripTitle}
                    </h3>
                    <p className="text-dark-400 text-xs mt-1 line-clamp-2">
                      {trip.summary}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-dark-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                      <span>{trip.origin} → {trip.destination}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                      <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                      <span>{trip.travelers} Traveler{trip.travelers > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="text-white font-bold text-sm">
                    ${trip.budgetBreakdown?.total?.toLocaleString()}
                    <span className="text-dark-500 font-normal text-xs ml-1">
                      {trip.budgetBreakdown?.currency || 'USD'}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-primary-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View Plan <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

