
import 'leaflet/dist/leaflet.css';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VOYAGE AI — Smart Travel Planner Powered by AI',
  description: 'Plan your perfect trip with AI. Get personalized day-by-day itineraries, hotel recommendations, restaurant guides, and budget breakdowns in seconds.',
  keywords: ['AI travel planner', 'trip itinerary generator', 'travel AI', 'vacation planner'],
  openGraph: {
    title: 'VOYAGE AI — Smart Travel Planner',
    description: 'AI-powered travel itineraries in seconds',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-dark-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
