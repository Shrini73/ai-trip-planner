// API Route: GET/POST /api/trips — server-side trip management
import { NextRequest, NextResponse } from 'next/server';
import { GeneratedItinerary } from '@/lib/types';

// In-memory storage for server-side (demo). In production, use a real DB.
// Client uses localStorage for persistence; this API is for cross-device sync.
const serverTrips = new Map<string, GeneratedItinerary>();

export async function GET() {
  const trips = Array.from(serverTrips.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json({ trips });
}

export async function POST(request: NextRequest) {
  try {
    const { itinerary } = await request.json() as { itinerary: GeneratedItinerary };
    if (!itinerary?.id) {
      return NextResponse.json({ error: 'Invalid itinerary' }, { status: 400 });
    }
    serverTrips.set(itinerary.id, itinerary);
    return NextResponse.json({ success: true, id: itinerary.id });
  } catch {
    return NextResponse.json({ error: 'Failed to save trip' }, { status: 500 });
  }
}
