'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BudgetChart from '@/components/BudgetChart';
import AIChat from '@/components/AIChat';
import { GeneratedItinerary, DayPlan } from '@/lib/types';
import { getTripById, formatDateRange } from '@/lib/trips';
import {
  MapPin, Calendar, Users, Wallet, Download, Map, List,
  Star, Clock, DollarSign, ChevronDown, ChevronUp, ArrowLeft,
  Hotel, Utensils, Camera, Package, Globe, Phone, Luggage,
  Sparkles, MessageSquare
} from 'lucide-react';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type TabType = 'itinerary' | 'map' | 'budget' | 'tips' | 'chat';

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<GeneratedItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('itinerary');
  const [expandedDay, setExpandedDay] = useState<number>(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    const found = getTripById(tripId);
    setTrip(found);
    setLoading(false);
  }, [tripId]);

  const handleExportPDF = async () => {
    if (!trip) return;
    setExporting(true);
    try {
      const { exportTripAsPDF } = await import('@/lib/pdf-export');
      const { getFeaturePermissions } = await import('@/lib/subscription');
      const perms = await getFeaturePermissions();
      await exportTripAsPDF(trip, { isElite: perms.can_white_label_pdf });
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('PDF export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Navbar />
        <div className="text-6xl">🗺️</div>
        <h2 className="font-display font-bold text-2xl text-white">Trip Not Found</h2>
        <p className="text-dark-400">This trip may have been deleted or doesn't exist.</p>
        <button onClick={() => router.push('/my-trips')} className="btn-primary mt-2">
          View My Trips
        </button>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'itinerary', label: 'Itinerary', icon: <List className="w-4 h-4" /> },
    { id: 'map', label: 'Map View', icon: <Map className="w-4 h-4" /> },
    { id: 'budget', label: 'Budget', icon: <Wallet className="w-4 h-4" /> },
    { id: 'tips', label: 'Tips & Info', icon: <Globe className="w-4 h-4" /> },
    { id: 'chat', label: 'AI Chat', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Header */}
      <div className="relative pt-16 pb-8 bg-gradient-to-br from-dark-950 via-[#1a1040] to-dark-950">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <button
            onClick={() => router.push('/my-trips')}
            className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Trips
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-primary">
                  <Sparkles className="w-3 h-3" /> AI Generated
                </span>
                <span className="badge badge-success">
                  <span className="status-dot status-done" /> Completed
                </span>
              </div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-3">
                {trip.tripTitle}
              </h1>
              <p className="text-dark-300 text-base max-w-2xl leading-relaxed mb-5">
                {trip.summary}
              </p>

              {/* Trip Meta */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-dark-300 text-sm">
                  <MapPin className="w-4 h-4 text-primary-400" />
                  <span>{trip.origin} → {trip.destination}</span>
                </div>
                <div className="flex items-center gap-2 text-dark-300 text-sm">
                  <Calendar className="w-4 h-4 text-primary-400" />
                  <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-dark-300 text-sm">
                  <Users className="w-4 h-4 text-primary-400" />
                  <span>{trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-dark-300 text-sm">
                  <Clock className="w-4 h-4 text-primary-400" />
                  <span>{trip.totalDays} days</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 flex-shrink-0">
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="btn-primary flex items-center gap-2 py-2.5 px-5 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="glass rounded-xl p-3">
                  <div className="font-display font-bold text-xl gradient-text">
                    ${trip.budgetBreakdown.total.toLocaleString()}
                  </div>
                  <div className="text-dark-500 text-xs">Total Budget</div>
                </div>
                <div className="glass rounded-xl p-3">
                  <div className="font-display font-bold text-xl text-white">
                    {trip.totalDays}
                  </div>
                  <div className="text-dark-500 text-xs">Days Planned</div>
                </div>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap gap-2 mt-5">
            {trip.highlights.slice(0, 4).map((h, i) => (
              <span key={i} className="tag text-xs">✓ {h}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-16 z-40 glass-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === id
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                    : 'text-dark-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── ITINERARY TAB ── */}
        {activeTab === 'itinerary' && (
          <div className="space-y-4">
            {trip.days.map((day) => (
              <DayCard
                key={day.day}
                day={day}
                isExpanded={expandedDay === day.day}
                onToggle={() => setExpandedDay(expandedDay === day.day ? 0 : day.day)}
              />
            ))}
          </div>
        )}

        {/* ── MAP TAB ── */}
        {activeTab === 'map' && (
          <div className="h-[600px] rounded-2xl overflow-hidden border border-white/10">
            <MapView trip={trip} />
          </div>
        )}

        {/* ── BUDGET TAB ── */}
        {activeTab === 'budget' && (
          <BudgetChart budget={trip.budgetBreakdown} travelers={trip.travelers} days={trip.totalDays} />
        )}

        {/* ── TIPS TAB ── */}
        {activeTab === 'tips' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Essential Info */}
            <div className="card space-y-4">
              <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary-400" /> Essential Info
              </h3>
              <InfoRow label="Best Time to Visit" value={trip.bestTimeToVisit} />
              <InfoRow label="Weather" value={trip.weather} />
              <InfoRow label="Currency" value={trip.currency} />
              <InfoRow label="Language" value={trip.language} />
              <InfoRow label="Timezone" value={trip.timezone} />
            </div>

            {/* Emergency Contacts */}
            <div className="card space-y-4">
              <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-red-400" /> Emergency Contacts
              </h3>
              <InfoRow label="🚔 Police" value={trip.emergencyContacts.police} />
              <InfoRow label="🚑 Ambulance" value={trip.emergencyContacts.ambulance} />
              <InfoRow label="📞 Tourist Helpline" value={trip.emergencyContacts.touristHelpline} />
            </div>

            {/* Packing List */}
            <div className="card">
              <h3 className="font-display font-bold text-lg text-white flex items-center gap-2 mb-4">
                <Luggage className="w-5 h-5 text-accent-400" /> Packing List
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {trip.packingList.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-dark-300 text-sm">
                    <span className="w-5 h-5 rounded-md bg-primary-500/20 flex items-center justify-center text-xs text-primary-400 flex-shrink-0">✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Cultural Tips */}
            <div className="card">
              <h3 className="font-display font-bold text-lg text-white flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400" /> Cultural Tips
              </h3>
              <div className="space-y-3">
                {trip.culturalTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 text-dark-300 text-sm">
                    <span className="w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-xs text-yellow-400 flex-shrink-0">
                      {i + 1}
                    </span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── AI CHAT TAB ── */}
        {activeTab === 'chat' && (
          <AIChat trip={trip} />
        )}
      </div>
    </div>
  );
}

/* ─── Day Card ────────────────────────────────────────────────── */
function DayCard({ day, isExpanded, onToggle }: {
  day: DayPlan;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="card overflow-hidden">
      {/* Day Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-1 text-left group"
      >
        <div className="flex items-center gap-4">
          <div className="timeline-dot w-10 h-10 flex-shrink-0">
            <span className="font-bold text-white text-sm">{day.day}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-white text-lg">Day {day.day}</span>
              <span className="badge badge-primary text-xs">{day.theme}</span>
            </div>
            <div className="text-dark-400 text-sm">{day.date} · ~${day.estimatedDayCost}/person</div>
          </div>
        </div>
        <div className="text-dark-400 group-hover:text-white transition-colors">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-6">

          {/* Hotel */}
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-white mb-3">
              <Hotel className="w-4 h-4 text-primary-400" /> Where to Stay
            </h4>
            <div className="glass rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-white">{day.hotel.name}</div>
                  <div className="text-dark-400 text-sm mb-2">{day.hotel.location}</div>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= day.hotel.rating ? 'text-yellow-400 fill-yellow-400' : 'text-dark-600'}`} />
                    ))}
                    <span className="text-dark-400 text-xs">({day.hotel.rating}/5)</span>
                  </div>
                  <p className="text-dark-400 text-xs leading-relaxed mb-3">{day.hotel.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {day.hotel.amenities.map(a => (
                      <span key={a} className="text-xs bg-dark-700 text-dark-300 rounded-md px-2 py-0.5">{a}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display font-bold text-2xl gradient-text">${day.hotel.pricePerNight}</div>
                  <div className="text-dark-500 text-xs">per night</div>
                </div>
              </div>
            </div>
          </div>

          {/* Restaurants */}
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-white mb-3">
              <Utensils className="w-4 h-4 text-accent-400" /> Where to Eat
            </h4>
            <div className="space-y-3">
              {day.restaurants.map((r, i) => (
                <div key={i} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-accent-500/20 text-accent-300 rounded-md px-2 py-0.5 capitalize">{r.mealType}</span>
                        <span className="text-dark-500 text-xs">{r.priceRange}</span>
                      </div>
                      <div className="font-semibold text-white">{r.name}</div>
                      <div className="text-dark-400 text-xs">{r.cuisine} · {r.location}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-sm font-semibold">{r.rating}</span>
                      </div>
                      <div className="text-dark-500 text-xs mt-1">⭐ Try: {r.specialDish}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attractions */}
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-white mb-3">
              <Camera className="w-4 h-4 text-green-400" /> What to See & Do
            </h4>
            <div className="space-y-3">
              {day.attractions.map((a, i) => (
                <div key={i} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="font-semibold text-white">{a.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-dark-500">{a.type}</span>
                        <span className="text-xs text-dark-500">·</span>
                        <span className="text-xs text-dark-500">{a.duration}</span>
                        <span className="text-xs text-dark-500">·</span>
                        <span className="text-xs text-green-400">
                          {a.entryFee === 0 ? 'Free Entry' : `$${a.entryFee} entry`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-sm font-semibold">{a.rating}</span>
                    </div>
                  </div>
                  <p className="text-dark-400 text-xs leading-relaxed mb-2">{a.description}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-primary-400">⏰ Best time: {a.bestTime}</span>
                  </div>
                  {a.tips.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {a.tips.map((tip, ti) => (
                        <div key={ti} className="flex items-start gap-2 text-xs text-dark-400">
                          <span className="text-primary-400 flex-shrink-0">💡</span> {tip}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Transport */}
          <div className="glass rounded-xl p-4 flex items-start gap-3">
            <Package className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-white text-sm mb-1">Getting Around</div>
              <p className="text-dark-400 text-xs leading-relaxed">{day.transportTips}</p>
            </div>
          </div>

          {/* Day Cost */}
          <div className="flex items-center justify-between py-2 border-t border-white/5">
            <span className="text-dark-400 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" /> Estimated day cost
            </span>
            <span className="font-bold text-white">~${day.estimatedDayCost} <span className="text-dark-500 font-normal text-xs">/ person</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-dark-500 text-sm flex-shrink-0">{label}</span>
      <span className="text-dark-200 text-sm text-right">{value}</span>
    </div>
  );
}
