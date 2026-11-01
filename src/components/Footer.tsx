'use client';

import Link from 'next/link';
import { Compass, Twitter, Instagram, Youtube, Github, Heart } from 'lucide-react';

const links = {
  Product: [
    { label: 'Features',    href: '/#features' },
    { label: 'Pricing',     href: '/pricing' },
    { label: 'Destinations', href: '/#destinations' },
    { label: 'How It Works', href: '/#how-it-works' },
  ],
  Resources: [
    { label: 'Travel Blog',     href: '#' },
    { label: 'Travel Tips',     href: '#' },
    { label: 'Destination Guide', href: '#' },
    { label: 'Packing Guides',  href: '#' },
  ],
  Company: [
    { label: 'About Us',     href: '#' },
    { label: 'Contact',      href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
};

const socials = [
  { icon: Twitter,   href: '#', label: 'Twitter'   },
  { icon: Instagram, href: '#', label: 'Instagram'  },
  { icon: Youtube,   href: '#', label: 'YouTube'    },
  { icon: Github,    href: '#', label: 'GitHub'     },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl">
                <span className="gradient-text">VOYAGE</span>
                <span className="text-white"> AI</span>
              </span>
            </Link>
            <p className="text-dark-400 text-sm leading-relaxed mb-6 max-w-xs">
              AI-powered travel planning that creates personalized itineraries in seconds. 
              Your perfect trip, planned by artificial intelligence.
            </p>
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg glass border border-white/10 flex items-center justify-center text-dark-400 hover:text-white hover:border-primary-500/40 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-semibold text-white text-sm mb-4">{category}</h3>
              <ul className="space-y-2.5">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-dark-400 text-sm hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-dark-500 text-xs">
            © 2025 VOYAGE AI. All rights reserved.
          </p>
          <p className="text-dark-500 text-xs flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> using Gemini AI
          </p>
        </div>
      </div>
    </footer>
  );
}
