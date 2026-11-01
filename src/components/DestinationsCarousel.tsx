'use client';

const destinations = [
  { name: 'Paris, France',      emoji: '🗼', tagline: 'City of Light',           rating: 4.9, color: 'from-rose-500/30 to-pink-600/30' },
  { name: 'Tokyo, Japan',       emoji: '⛩️', tagline: 'Where tradition meets future', rating: 4.9, color: 'from-red-500/30 to-orange-600/30' },
  { name: 'Bali, Indonesia',    emoji: '🌺', tagline: 'Island of the Gods',      rating: 4.8, color: 'from-green-500/30 to-teal-600/30' },
  { name: 'New York, USA',      emoji: '🗽', tagline: 'The Big Apple',            rating: 4.8, color: 'from-blue-500/30 to-indigo-600/30' },
  { name: 'Santorini, Greece',  emoji: '🏛️', tagline: 'Aegean paradise',         rating: 4.9, color: 'from-sky-500/30 to-blue-600/30' },
  { name: 'Dubai, UAE',         emoji: '🌆', tagline: 'City of gold',            rating: 4.7, color: 'from-amber-500/30 to-yellow-600/30' },
  { name: 'Machu Picchu, Peru', emoji: '🏔️', tagline: 'Lost city of the Incas',  rating: 4.9, color: 'from-emerald-500/30 to-green-600/30' },
  { name: 'Safari, Kenya',      emoji: '🦁', tagline: 'The Great Migration',     rating: 4.8, color: 'from-orange-500/30 to-amber-600/30' },
  { name: 'Kyoto, Japan',       emoji: '🌸', tagline: 'Ancient capital',         rating: 4.8, color: 'from-pink-500/30 to-rose-600/30' },
  { name: 'Amalfi, Italy',      emoji: '🍋', tagline: 'Cliffside beauty',        rating: 4.8, color: 'from-yellow-500/30 to-orange-600/30' },
  { name: 'Iceland',            emoji: '🌋', tagline: 'Land of fire and ice',    rating: 4.9, color: 'from-cyan-500/30 to-blue-600/30' },
  { name: 'Morocco',            emoji: '🕌', tagline: 'Colors of the Maghreb',   rating: 4.7, color: 'from-orange-500/30 to-red-600/30' },
];

const doubled = [...destinations, ...destinations];

export default function DestinationsCarousel() {
  return (
    <section className="py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="text-center">
          <div className="badge badge-primary inline-flex mb-4">
            <span>🌍</span> Top Destinations
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Go Anywhere, <span className="gradient-text">Plan Everything</span>
          </h2>
          <p className="text-dark-400 text-lg max-w-2xl mx-auto">
            From iconic landmarks to hidden gems — VOYAGE AI plans the perfect trip to over 120 destinations worldwide.
          </p>
        </div>
      </div>

      {/* Infinite scroll carousel */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-dark-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-dark-950 to-transparent z-10 pointer-events-none" />

        {/* Row 1 — scrolls left */}
        <div className="flex gap-4 mb-4" style={{ width: 'max-content', animation: 'scroll 35s linear infinite' }}>
          {doubled.slice(0, 16).map((dest, i) => (
            <DestCard key={i} dest={dest} />
          ))}
        </div>

        {/* Row 2 — scrolls right */}
        <div className="flex gap-4" style={{ width: 'max-content', animation: 'scroll 40s linear infinite reverse' }}>
          {doubled.slice(4, 20).map((dest, i) => (
            <DestCard key={i} dest={dest} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DestCard({ dest }: { dest: typeof destinations[0] }) {
  return (
    <div className={`flex-shrink-0 w-48 rounded-2xl overflow-hidden border border-white/10 cursor-pointer hover:scale-105 transition-transform duration-300`}>
      {/* Color gradient bg */}
      <div className={`bg-gradient-to-br ${dest.color} p-5 text-center`}>
        <div className="text-5xl mb-3">{dest.emoji}</div>
        <div className="font-semibold text-white text-sm leading-tight">{dest.name}</div>
        <div className="text-white/70 text-xs mt-1">{dest.tagline}</div>
      </div>
      {/* Bottom rating */}
      <div className="bg-dark-800/90 px-3 py-2 flex items-center justify-between">
        <span className="text-yellow-400 text-xs font-bold">★ {dest.rating}</span>
        <span className="text-dark-400 text-xs">AI Ready</span>
      </div>
    </div>
  );
}
