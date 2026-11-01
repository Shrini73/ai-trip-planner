// Trip storage utilities using localStorage with optional Convex sync

import { GeneratedItinerary, TripSummary } from './types';

const TRIPS_KEY = 'voyage_ai_trips';

export function saveTrip(itinerary: GeneratedItinerary): void {
  if (typeof window === 'undefined') return;
  const trips = getAllTrips();
  const existing = trips.findIndex(t => t.id === itinerary.id);
  if (existing >= 0) {
    trips[existing] = itinerary;
  } else {
    trips.unshift(itinerary);
  }
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}

export function getAllTrips(): GeneratedItinerary[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(TRIPS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getTripById(id: string): GeneratedItinerary | null {
  const trips = getAllTrips();
  return trips.find(t => t.id === id) || null;
}

export function deleteTrip(id: string): void {
  if (typeof window === 'undefined') return;
  const trips = getAllTrips().filter(t => t.id !== id);
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}

export function getTripSummaries(): TripSummary[] {
  return getAllTrips().map(trip => ({
    id: trip.id,
    tripTitle: trip.tripTitle,
    destination: trip.destination,
    origin: trip.origin,
    startDate: trip.startDate,
    endDate: trip.endDate,
    travelers: trip.travelers,
    budget: `${trip.budgetBreakdown.currency}${trip.budgetBreakdown.total.toLocaleString()}`,
    createdAt: trip.createdAt,
  }));
}

export function generateTripId(): string {
  return `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${start.toLocaleDateString('en-US', options)} — ${end.toLocaleDateString('en-US', options)}`;
}

export function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Demo scenarios for immediate testing
export const DEMO_SCENARIOS = [
  {
    id: 'demo-1',
    name: '🗼 Paris Romantic Getaway',
    description: '5 days in the City of Light — art, cuisine & culture',
    preferences: {
      origin: 'New York, USA',
      destination: 'Paris, France',
      startDate: '2025-06-15',
      endDate: '2025-06-20',
      travelers: 2,
      budget: 'moderate' as const,
      budgetAmount: 5000,
      travelStyle: ['romantic', 'cultural'],
      interests: ['art', 'food', 'history', 'architecture'],
      accommodation: 'hotel',
      transportMode: 'metro',
    }
  },
  {
    id: 'demo-2',
    name: '🏔️ Tokyo Adventure',
    description: '7 days exploring ancient temples & futuristic tech',
    preferences: {
      origin: 'Los Angeles, USA',
      destination: 'Tokyo, Japan',
      startDate: '2025-09-10',
      endDate: '2025-09-17',
      travelers: 1,
      budget: 'budget' as const,
      budgetAmount: 3000,
      travelStyle: ['adventure', 'cultural', 'solo'],
      interests: ['technology', 'anime', 'temples', 'street-food'],
      accommodation: 'hostel',
      transportMode: 'public-transport',
    }
  },
  {
    id: 'demo-3',
    name: '🏖️ Bali Luxury Retreat',
    description: '10 days of tropical paradise, spas & surf',
    preferences: {
      origin: 'Sydney, Australia',
      destination: 'Bali, Indonesia',
      startDate: '2025-07-20',
      endDate: '2025-07-30',
      travelers: 4,
      budget: 'luxury' as const,
      budgetAmount: 15000,
      travelStyle: ['luxury', 'relaxation', 'family'],
      interests: ['beaches', 'wellness', 'surfing', 'temples', 'cuisine'],
      accommodation: 'resort',
      transportMode: 'private-car',
    }
  }
];
