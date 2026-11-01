// API Route: POST /api/generate-itinerary
import { NextRequest, NextResponse } from 'next/server';
import { generateItineraryWithGemini } from '@/lib/gemini';
import { TripPreferences } from '@/lib/types';

// Simple in-memory rate limiter (per IP, 5 requests per hour)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }

  if (entry.count >= 10) return false;

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { preferences, tripId } = body as { preferences: TripPreferences; tripId: string };

    // Validate required fields
    if (!preferences?.destination || !preferences?.origin || !preferences?.startDate || !preferences?.endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: destination, origin, startDate, endDate' },
        { status: 400 }
      );
    }

    if (!tripId) {
      return NextResponse.json({ error: 'Missing tripId' }, { status: 400 });
    }

    // Validate dates
    const start = new Date(preferences.startDate);
    const end = new Date(preferences.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }
    if (end <= start) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 30) {
      return NextResponse.json({ error: 'Maximum trip duration is 30 days' }, { status: 400 });
    }

    // Server-side Feature Verification for trips > 7 days
    if (days > 7) {
      const authHeader = request.headers.get('authorization');
      let allowed = false;
      if (authHeader) {
        try {
          const featRes = await fetch('http://127.0.0.1:5000/api/subscription/features', {
            headers: { authorization: authHeader },
          });
          if (featRes.ok) {
            const feat = await featRes.json();
            if (feat.max_trip_days >= days) {
              allowed = true;
            }
          }
        } catch {
          // If backend offline, don't crash
        }
      }

      if (!allowed) {
        return NextResponse.json(
          { error: 'Explorer plan is limited to trips up to 7 days. Upgrade to Voyager or Elite for up to 30-day itineraries.' },
          { status: 403 }
        );
      }
    }

    console.log(`[Generate] Trip to ${preferences.destination} for ${days} days`);

    const itinerary = await generateItineraryWithGemini(preferences, tripId);

    return NextResponse.json({ itinerary }, { status: 200 });
  } catch (error) {
    console.error('[Generate] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate itinerary';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
