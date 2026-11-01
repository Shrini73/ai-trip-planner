// Core Types for VOYAGE AI

export interface TripPreferences {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: 'budget' | 'moderate' | 'luxury';
  budgetAmount: number;
  travelStyle: string[];
  interests: string[];
  accommodation: string;
  transportMode: string;
}

export interface HotelRecommendation {
  name: string;
  rating: number;
  pricePerNight: number;
  location: string;
  amenities: string[];
  description: string;
  coordinates: { lat: number; lng: number };
  imageKeyword: string;
}

export interface Restaurant {
  name: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  specialDish: string;
  location: string;
  coordinates: { lat: number; lng: number };
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface Attraction {
  name: string;
  type: string;
  entryFee: number;
  duration: string;
  rating: number;
  description: string;
  bestTime: string;
  coordinates: { lat: number; lng: number };
  tips: string[];
}

export interface DayPlan {
  day: number;
  date: string;
  theme: string;
  hotel: HotelRecommendation;
  restaurants: Restaurant[];
  attractions: Attraction[];
  transportTips: string;
  estimatedDayCost: number;
}

export interface BudgetBreakdown {
  accommodation: number;
  food: number;
  attractions: number;
  transport: number;
  miscellaneous: number;
  total: number;
  currency: string;
  savingTips: string[];
}

export interface GeneratedItinerary {
  id: string;
  tripTitle: string;
  destination: string;
  origin: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  travelers: number;
  summary: string;
  highlights: string[];
  bestTimeToVisit: string;
  weather: string;
  currency: string;
  language: string;
  timezone: string;
  emergencyContacts: {
    police: string;
    ambulance: string;
    touristHelpline: string;
  };
  days: DayPlan[];
  budgetBreakdown: BudgetBreakdown;
  packingList: string[];
  culturalTips: string[];
  centerCoordinates: { lat: number; lng: number };
  createdAt: string;
  userId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  component?: 'date-picker' | 'preference-selector' | 'budget-selector' | 'itinerary-preview';
  componentData?: Record<string, unknown>;
}

export interface TripSummary {
  id: string;
  tripTitle: string;
  destination: string;
  origin: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: string;
  createdAt: string;
  thumbnail?: string;
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  preferences: TripPreferences;
}

export type PlanningStep =
  | 'welcome'
  | 'origin'
  | 'destination'
  | 'dates'
  | 'travelers'
  | 'budget'
  | 'style'
  | 'interests'
  | 'accommodation'
  | 'transport'
  | 'review'
  | 'generating'
  | 'complete';

export type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';

export interface PlanDetails {
  id: 'free' | 'voyager' | 'elite';
  name: string;
  price: number;
  currency: string;
  interval: string;
  trial_days: number;
  description: string;
  features: string[];
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: 'free' | 'voyager' | 'elite';
  plan_name: string;
  plan_price: number;
  provider: string;
  provider_subscription_id?: string;
  status: SubscriptionStatus;
  is_active: boolean;
  trial_start?: string | null;
  trial_end?: string | null;
  remaining_trial_days: number;
  current_period_start?: string | null;
  current_period_end?: string | null;
  next_billing_at?: string | null;
  cancel_at_period_end: boolean;
  cancelled_at?: string | null;
  created_at?: string | null;
}

export interface InvoiceItem {
  id: string;
  user_id: string;
  subscription_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void';
  billing_reason: string;
  paid_at?: string | null;
  created_at: string;
}

export interface FeaturePermissions {
  plan_id: 'free' | 'voyager' | 'elite';
  status: SubscriptionStatus;
  remaining_trial_days: number;
  can_use_chat: boolean;
  max_trip_days: number;
  max_monthly_itineraries: number;
  can_white_label_pdf: boolean;
  can_multi_city: boolean;
  can_group_collab: boolean;
  can_offline_access: boolean;
  has_api_access: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  created_at?: string;
}

