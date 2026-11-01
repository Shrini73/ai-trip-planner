
'use client';

import { useEffect, useState } from 'react';
import { GeneratedItinerary } from '@/lib/types';

interface MapViewProps {
  trip: GeneratedItinerary;
}

function escapeHTML(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[char];
  });
}

export default function MapView({ trip }: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full min-h-[500px] bg-dark-800 flex items-center justify-center rounded-2xl">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-dark-400 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return <MapViewInner trip={trip} />;
}

function MapViewInner({ trip }: MapViewProps) {
  useEffect(() => {
    let map: import('leaflet').Map | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let animationFrame = 0;
    let cancelled = false;
    let boundsApplied = false;

    const initMap = async () => {
      const leaflet = await import('leaflet');

      if (cancelled) return;

      // Fix default Leaflet marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;

      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const container = document.getElementById('voyage-map');

      if (!container || cancelled) return;

      // Prevent duplicate initialization
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((container as any)._leaflet_id) return;

      map = leaflet.map(container, {
        center: [
          trip.centerCoordinates?.lat ?? 0,
          trip.centerCoordinates?.lng ?? 0,
        ],
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
      });

      // OpenStreetMap tiles - no API key required
      leaflet
        .tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
          }
        )
        .addTo(map);

      // Map legend
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const legend = (leaflet as any).control({
          position: 'bottomright',
        });

        legend.onAdd = () => {
          const div = leaflet.DomUtil.create('div', '');

          div.style.cssText = `
          background: rgba(15,23,42,0.9);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          font-size: 12px;
          backdrop-filter: blur(12px);
        `;

          div.innerHTML = `
          <div style="font-weight:700;margin-bottom:8px;color:#a5bafc">
            📍 Map Legend
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="background:#6366f1;border-radius:50%;width:10px;height:10px;display:inline-block"></span>
            Hotels
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="background:#f97316;border-radius:50%;width:10px;height:10px;display:inline-block"></span>
            Restaurants
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="background:#22c55e;border-radius:50%;width:10px;height:10px;display:inline-block"></span>
            Attractions
          </div>
        `;

          return div;
        };

        legend.addTo(map);

        // Custom marker icons
        const makeIcon = (color: string, emoji: string) =>
          leaflet.divIcon({
            html: `
            <div style="
              background:${color};
              border:2px solid rgba(255,255,255,0.5);
              border-radius:50%;
              width:32px;
              height:32px;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:14px;
              box-shadow:0 4px 12px ${color}88;
              cursor:pointer;
            ">${emoji}</div>
          `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            className: '',
          });

        const hotelIcon = makeIcon('#6366f1', '🏨');
        const restaurantIcon = makeIcon('#f97316', '🍽️');
        const attractionIcon = makeIcon('#22c55e', '📸');

        const allPoints: [number, number][] = [];

        // Add itinerary markers
        trip.days.forEach((day) => {
          // Hotel marker
          const hotel = day.hotel;
          const hc = hotel?.coordinates;

          if (
            hc &&
            Number.isFinite(hc.lat) &&
            Number.isFinite(hc.lng)
          ) {
            allPoints.push([hc.lat, hc.lng]);

            leaflet
              .marker([hc.lat, hc.lng], { icon: hotelIcon })
              .addTo(map!)
              .bindPopup(`
              <div style="
                background:#1e293b;
                color:white;
                padding:12px;
                border-radius:10px;
                min-width:180px;
                border:1px solid rgba(99,102,241,0.3)
              ">
                <div style="font-weight:700;font-size:13px;margin-bottom:4px">
                  ${escapeHTML(hotel.name)}
                </div>
                <div style="color:#94a3b8;font-size:11px">
                  Day ${escapeHTML(day.day)} ·
                  $${escapeHTML(hotel.pricePerNight)}/night
                </div>
                <div style="color:#fbbf24;font-size:11px;margin-top:4px">
                  ${'★'.repeat(
                Math.max(0, Math.min(5, Number(hotel.rating) || 0))
              )}
                </div>
              </div>
            `, { className: 'custom-popup' });
          }

          // Restaurant markers
          day.restaurants?.forEach((restaurant) => {
            const c = restaurant.coordinates;

            if (
              c &&
              Number.isFinite(c.lat) &&
              Number.isFinite(c.lng)
            ) {
              allPoints.push([c.lat, c.lng]);

              leaflet
                .marker([c.lat, c.lng], { icon: restaurantIcon })
                .addTo(map!)
                .bindPopup(`
                <div style="
                  background:#1e293b;
                  color:white;
                  padding:12px;
                  border-radius:10px;
                  min-width:180px;
                  border:1px solid rgba(249,115,22,0.3)
                ">
                  <div style="font-weight:700;font-size:13px;margin-bottom:4px">
                    ${escapeHTML(restaurant.name)}
                  </div>
                  <div style="color:#94a3b8;font-size:11px">
                    ${escapeHTML(restaurant.cuisine)} ·
                    ${escapeHTML(restaurant.priceRange)}
                  </div>
                  <div style="color:#94a3b8;font-size:11px;margin-top:2px">
                    ⭐ Try: ${escapeHTML(restaurant.specialDish)}
                  </div>
                </div>
              `, { className: 'custom-popup' });
            }
          });

          // Attraction markers
          day.attractions?.forEach((attraction) => {
            const c = attraction.coordinates;

            if (
              c &&
              Number.isFinite(c.lat) &&
              Number.isFinite(c.lng)
            ) {
              allPoints.push([c.lat, c.lng]);

              leaflet
                .marker([c.lat, c.lng], { icon: attractionIcon })
                .addTo(map!)
                .bindPopup(`
                <div style="
                  background:#1e293b;
                  color:white;
                  padding:12px;
                  border-radius:10px;
                  min-width:180px;
                  border:1px solid rgba(34,197,94,0.3)
                ">
                  <div style="font-weight:700;font-size:13px;margin-bottom:4px">
                    ${escapeHTML(attraction.name)}
                  </div>
                  <div style="color:#94a3b8;font-size:11px">
                    ${escapeHTML(attraction.type)} ·
                    ${escapeHTML(attraction.duration)}
                  </div>
                  <div style="color:#86efac;font-size:11px;margin-top:2px">
                    ${Number(attraction.entryFee) === 0
                    ? 'Free Entry'
                    : `$${escapeHTML(attraction.entryFee)} entry`
                  }
                  </div>
                </div>
              `, { className: 'custom-popup' });
            }
          });
        });

        // Recalculate map dimensions whenever its container changes.
        // This fixes missing or partially rendered tiles in hidden tabs.
        const refreshMapSize = () => {
          if (cancelled || !map) return;

          cancelAnimationFrame(animationFrame);

          animationFrame = requestAnimationFrame(() => {
            if (cancelled || !map || !container.isConnected) return;

            const width = container.clientWidth;
            const height = container.clientHeight;

            if (width === 0 || height === 0) return;

            map.invalidateSize({
              pan: false,
              animate: false,
            });

            // Fit all itinerary markers after the map becomes visible.
            if (!boundsApplied && allPoints.length > 0) {
              map.fitBounds(allPoints, {
                padding: [40, 40],
                maxZoom: 14,
              });

              boundsApplied = true;
            }
          });
        };

        // Observe container size changes
        resizeObserver = new ResizeObserver(() => {
          refreshMapSize();
        });

        resizeObserver.observe(container);

        // Also handle browser window resizing
        window.addEventListener('resize', refreshMapSize);

        // Initial map sizing
        refreshMapSize();

      // Store cleanup function
      cleanupResize = () => {
          resizeObserver?.disconnect();
          window.removeEventListener('resize', refreshMapSize);
          cancelAnimationFrame(animationFrame);
        };
      };

      let cleanupResize = () => { };

      initMap().catch((error) => {
        console.error('[Voyage Map] Initialization failed:', error);
      });

      return () => {
        cancelled = true;
        cleanupResize();

        if (map) {
          map.remove();
          map = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trip.id]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div
        id="voyage-map"
        className="w-full h-full min-h-[500px]"
        style={{ height: '100%', minHeight: '500px' }}
      />

      <style jsx global>{`
        #voyage-map {
          width: 100%;
          height: 100%;
          min-height: 500px;
          background: #1e293b;
          border-radius: 16px;
          z-index: 1;
        }

        #voyage-map .leaflet-tile {
          max-width: none !important;
        }

        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
        }

        .leaflet-popup-tip {
          display: none;
        }

        .custom-popup .leaflet-popup-content-wrapper {
          background: transparent;
          border: none;
          padding: 0;
        }

        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
      `}</style>
    </div>
  );
}
