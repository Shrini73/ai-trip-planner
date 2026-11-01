
// Gemini AI client for Voyage AI itinerary generation

import {
  TripPreferences,
  GeneratedItinerary,
  DayPlan,
} from './types';

// ==========================================
// GEMINI CONFIGURATION
// ==========================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.5-flash-lite';
// ==========================================
// BUILD AI ITINERARY PROMPT
// ==========================================

export function buildItineraryPrompt(prefs: TripPreferences): string {
  const days = Math.max(
    1,
    Math.ceil(
      (new Date(prefs.endDate).getTime() -
        new Date(prefs.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
    )
  );

  return `
You are Voyage AI, an expert AI travel planner.

Create a detailed, realistic and personalized travel itinerary.

TRIP DETAILS:

Origin: ${prefs.origin}
Destination: ${prefs.destination}
Start Date: ${prefs.startDate}
End Date: ${prefs.endDate}
Duration: ${days} days
Travelers: ${prefs.travelers}
Budget Level: ${prefs.budget}
Total Budget: $${prefs.budgetAmount} USD
Travel Style: ${prefs.travelStyle.join(', ')}
Interests: ${prefs.interests.join(', ')}
Accommodation: ${prefs.accommodation}
Transport: ${prefs.transportMode}

IMPORTANT INSTRUCTIONS:

1. Generate exactly ${days} days in the itinerary.
2. Suggest realistic attractions and restaurants.
3. Provide realistic estimated prices.
4. Use accurate geographical coordinates.
5. Keep the itinerary within the specified budget.
6. Consider the traveler's interests and travel style.
7. Avoid repeating attractions.
8. Include practical transportation suggestions.
9. Do not invent hotel or restaurant ratings as verified facts.
10. Clearly indicate when weather information is an estimate.
11. Return valid JSON only.
12. Do not include Markdown code blocks.

RETURN JSON USING THIS EXACT STRUCTURE:

{
  "tripTitle": "Catchy trip title",
  "summary": "2-3 sentence trip overview",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4", "Highlight 5"],
  "bestTimeToVisit": "Best time to visit",
  "weather": "Expected weather",
  "currency": "Local currency code",
  "language": "Primary language",
  "timezone": "Local timezone",
  "emergencyContacts": {
    "police": "Local emergency number",
    "ambulance": "Local ambulance number",
    "touristHelpline": "Tourist helpline"
  },
  "centerCoordinates": {
    "lat": 0,
    "lng": 0
  },
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Day theme",
      "hotel": {
        "name": "Hotel name or suggested accommodation",
        "rating": 4,
        "pricePerNight": 100,
        "location": "Neighborhood",
        "amenities": ["WiFi", "Breakfast"],
        "description": "Description",
        "coordinates": {
          "lat": 0,
          "lng": 0
        },
        "imageKeyword": "Hotel image keyword"
      },
      "restaurants": [
        {
          "name": "Restaurant name",
          "cuisine": "Cuisine type",
          "priceRange": "$$",
          "rating": 4,
          "specialDish": "Popular dish",
          "location": "Restaurant location",
          "coordinates": {
            "lat": 0,
            "lng": 0
          },
          "mealType": "breakfast"
        }
      ],
      "attractions": [
        {
          "name": "Attraction name",
          "type": "Attraction type",
          "entryFee": 10,
          "duration": "2-3 hours",
          "rating": 4,
          "description": "Attraction description",
          "bestTime": "Morning",
          "coordinates": {
            "lat": 0,
            "lng": 0
          },
          "tips": ["Tip 1", "Tip 2"]
        }
      ],
      "transportTips": "Transportation suggestions",
      "estimatedDayCost": 100
    }
  ],
  "budgetBreakdown": {
    "accommodation": 0,
    "food": 0,
    "attractions": 0,
    "transport": 0,
    "miscellaneous": 0,
    "total": 0,
    "currency": "USD",
    "savingTips": ["Tip 1", "Tip 2", "Tip 3"]
  },
  "packingList": [
    "Passport",
    "Clothes",
    "Walking shoes",
    "Adapter",
    "Sunscreen",
    "Power bank",
    "Water bottle",
    "First aid kit"
  ],
  "culturalTips": [
    "Cultural tip 1",
    "Cultural tip 2",
    "Cultural tip 3",
    "Cultural tip 4"
  ]
}

Generate all ${days} days.
Use actual destination-specific coordinates.
Keep all prices in USD.
Return ONLY valid JSON.
`;
}

// ==========================================
// GENERATE ITINERARY USING GEMINI API
// ==========================================

export async function generateItineraryWithGemini(
  prefs: TripPreferences,
  tripId: string
): Promise<GeneratedItinerary> {

  // Check API key

  if (!GEMINI_API_KEY) {
    throw new Error(
      'Gemini API key is missing. Please configure GEMINI_API_KEY in .env.local.'
    );
  }

  // Validate dates

  const startDate = new Date(prefs.startDate);
  const endDate = new Date(prefs.endDate);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate <= startDate
  ) {
    throw new Error('Please provide valid trip dates.');
  }

  // Calculate trip duration

  const days = Math.max(
    1,
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) /
      (1000 * 60 * 60 * 24)
    )
  );

  // Build prompt

  const prompt = buildItineraryPrompt(prefs);

  // Call Gemini API

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },

      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],

        generationConfig: {
          maxOutputTokens: 32768,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  // Handle API errors

  if (!response.ok) {
    const errorData = await response.text();

    throw new Error(
      `Gemini API Error (${response.status}): ${errorData}`
    );
  }

  // Read Gemini response
  const data = await response.json();

  const candidate = data.candidates?.[0];

  const text = candidate?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    console.error('[Gemini] Empty response:', {
      finishReason: candidate?.finishReason,
      promptFeedback: data.promptFeedback,
    });

    throw new Error(
      'Gemini returned an empty response. Please try again.'
    );
  }

  // Parse JSON response
  let parsed: Partial<
    Omit<
      GeneratedItinerary,
      | 'id'
      | 'origin'
      | 'destination'
      | 'startDate'
      | 'endDate'
      | 'totalDays'
      | 'travelers'
      | 'createdAt'
      | 'userId'
    >
  >;

  try {
    const clean = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    parsed = JSON.parse(clean);

  } catch (error) {
    console.error('[Gemini] JSON parsing failed:', {
      finishReason: candidate?.finishReason,
      responseLength: text.length,
      responseEnding: text.slice(-1000),
      parseError:
        error instanceof Error ? error.message : String(error),
    });

    if (candidate?.finishReason === 'MAX_TOKENS') {
      throw new Error(
        'Gemini response was too long and got cut off. Try a shorter itinerary.'
      );
    }

    throw new Error(
      `Gemini returned invalid JSON. Finish reason: ${candidate?.finishReason || 'Unknown'
      }. Check the VS Code terminal for details.`
    );
  }
  // Validate generated itinerary

  if (
    !parsed.tripTitle ||
    !Array.isArray(parsed.days) ||
    parsed.days.length !== days
  ) {
    throw new Error(
      'Gemini generated an incomplete itinerary. Please try again.'
    );
  }

  // Prepare final itinerary

  const itinerary: GeneratedItinerary = {
    id: tripId,

    tripTitle:
      parsed.tripTitle || `${prefs.destination} Adventure`,

    destination: prefs.destination,
    origin: prefs.origin,
    startDate: prefs.startDate,
    endDate: prefs.endDate,
    totalDays: days,
    travelers: prefs.travelers,

    summary: parsed.summary || '',
    highlights: parsed.highlights || [],
    bestTimeToVisit: parsed.bestTimeToVisit || '',
    weather: parsed.weather || '',
    currency: parsed.currency || 'USD',
    language: parsed.language || 'English',
    timezone: parsed.timezone || 'UTC',

    emergencyContacts: parsed.emergencyContacts || {
      police: 'Check local emergency services',
      ambulance: 'Check local emergency services',
      touristHelpline: 'Check local tourist information',
    },

    days: parsed.days as DayPlan[],

    budgetBreakdown: parsed.budgetBreakdown || {
      accommodation: 0,
      food: 0,
      attractions: 0,
      transport: 0,
      miscellaneous: 0,
      total: 0,
      currency: 'USD',
      savingTips: [],
    },

    packingList: parsed.packingList || [],
    culturalTips: parsed.culturalTips || [],

    centerCoordinates: parsed.centerCoordinates || {
      lat: 0,
      lng: 0,
    },

    createdAt: new Date().toISOString(),
    userId: 'guest',
  };

  return itinerary;
}