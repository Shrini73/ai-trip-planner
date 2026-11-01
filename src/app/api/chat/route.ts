// API Route: POST /api/chat
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

interface ChatRequestBody {
  message: string;
  tripContext: {
    destination: string;
    days: number;
    budget: number;
    highlights: string[];
    culturalTips: string[];
  };
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function POST(request: NextRequest) {
  try {
    // Server-side feature authorization check
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'AI Travel Assistant is exclusive to Voyager and Elite members. Please sign in and start your 7-day free trial.' },
        { status: 403 }
      );
    }

    try {
      const featRes = await fetch('http://127.0.0.1:5000/api/subscription/features', {
        headers: { authorization: authHeader },
      });
      if (featRes.ok) {
        const feat = await featRes.json();
        if (!feat.can_use_chat) {
          return NextResponse.json(
            { error: 'AI Travel Assistant is exclusive to Voyager and Elite members. Please start your 7-day free trial or upgrade.' },
            { status: 403 }
          );
        }
      }
    } catch (err) {
      console.warn('Feature verification skipped (backend offline):', err);
    }

    const body = (await request.json()) as ChatRequestBody;
    const { message, tripContext, history = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      // Intelligent fallback when API key is not configured
      const fallback = generateServerFallback(message, tripContext);
      return NextResponse.json({ response: fallback });
    }

    // Call Gemini API
    const systemPrompt = `You are VOYAGE AI, an expert, enthusiastic, and culturally knowledgeable personal travel assistant.
You are assisting a traveler with their upcoming trip.

Trip Context:
- Destination: ${tripContext?.destination || 'Your chosen destination'}
- Duration: ${tripContext?.days || 5} days
- Total Budget: $${tripContext?.budget || 3000}
- Key Highlights: ${(tripContext?.highlights || []).join(', ')}
- Cultural Tips: ${(tripContext?.culturalTips || []).join('; ')}

Instructions:
1. Provide concise, highly practical, and engaging advice.
2. Directly answer the user's specific questions about food, sights, transport, weather, etiquette, or packing.
3. Keep answers under 3-4 paragraphs unless an in-depth breakdown is explicitly asked for.
4. Format responses cleanly using markdown bullet points and bold headers.`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }],
      },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn(`[Chat API] Gemini returned ${response.status}, falling back.`);
      const fallback = generateServerFallback(message, tripContext);
      return NextResponse.json({ response: fallback });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return NextResponse.json({ response: generateServerFallback(message, tripContext) });
    }

    return NextResponse.json({ response: reply });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      { response: "I'm having a momentary connection issue. Feel free to ask again in a second!" },
      { status: 200 }
    );
  }
}

function generateServerFallback(
  msg: string,
  context?: { destination: string; days: number; highlights?: string[]; culturalTips?: string[] }
): string {
  const dest = context?.destination || 'your destination';
  const m = msg.toLowerCase();

  if (m.includes('food') || m.includes('eat') || m.includes('restaurant')) {
    return `For dining in **${dest}**, I recommend balancing must-try local specialties with neighbourhood markets. Ask your hotel concierge for their personal favourites off the main tourist avenues!`;
  }
  if (m.includes('pack') || m.includes('wear') || m.includes('clothes')) {
    return `When packing for **${dest}**, focus on comfortable walking shoes, versatile layers, and a universal power adapter. Check local weather forecasts 48 hours before departure.`;
  }
  if (m.includes('safe') || m.includes('tip') || m.includes('advice')) {
    return `In **${dest}**, standard travel awareness applies: keep copies of your ID in the cloud, stay mindful in crowded transit areas, and observe local customs.`;
  }

  return `Based on your ${context?.days || 5}-day itinerary for **${dest}**, you're set for an incredible journey! What specific questions can I help clarify about your day-by-day plans?`;
}

