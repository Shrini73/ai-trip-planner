'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass, Map, CreditCard, Menu, X, Sparkles, LogIn,
  LogOut, User as UserIcon, Crown
} from 'lucide-react';
import { getStoredUser, clearAuthSession, getAuthToken } from '@/lib/auth';
import { getSubscriptionStatus } from '@/lib/subscription';
import { AuthUser, UserSubscription } from '@/lib/types';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sub, setSub] = useState<UserSubscription | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const syncAuth = () => {
    const token = getAuthToken();
    const storedUser = getStoredUser();
    setUser(token ? storedUser : null);

    if (token) {
      getSubscriptionStatus().then(setSub).catch(() => setSub(null));
    } else {
      setSub(null);
    }
  };

  useEffect(() => {
    syncAuth();

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('voyage_auth_change', syncAuth);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('voyage_auth_change', syncAuth);
    };
  }, []);

  const handleSignOut = () => {
    clearAuthSession();
    setUser(null);
    setSub(null);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Compass },
    { href: '/my-trips', label: 'My Trips', icon: Map },
    { href: '/pricing', label: 'Pricing', icon: CreditCard },
    ...(user ? [{ href: '/subscription', label: 'My Subscription', icon: Crown }] : []),
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const getPlanBadge = () => {
    if (!sub) return null;
    if (sub.status === 'trialing') {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap">
          Voyager Trial ({sub.remaining_trial_days}d)
        </span>
      );
    }
    if (sub.status === 'active' && sub.plan_id === 'elite') {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap font-semibold">
          ★ Elite
        </span>
      );
    }
    if (sub.status === 'active' && sub.plan_id === 'voyager') {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 whitespace-nowrap">
          Voyager
        </span>
      );
    }
    return null;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-dark shadow-2xl' : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-primary-500/30 transition-shadow">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full animate-pulse" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              <span className="gradient-text">VOYAGE</span>
              <span className="text-white"> AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(href)
                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                    : 'text-dark-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* CTA & User Profile Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/create-trip"
              className="flex items-center gap-2 btn-primary text-sm py-2 px-4"
            >
              <Sparkles className="w-4 h-4" />
              Plan a Trip
            </Link>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <Link
                  href="/subscription"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary-500/20 text-primary-300 flex items-center justify-center text-xs font-semibold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-medium text-white truncate max-w-[120px]">
                      {user.email.split('@')[0]}
                    </div>
                  </div>
                  {getPlanBadge()}
                </Link>

                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="flex items-center gap-2 btn-secondary text-sm py-2 px-4"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-dark-300 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glass-dark border-t border-white/10">
          <div className="px-4 py-4 space-y-2">
            {user && (
              <div className="px-4 py-2.5 mb-2 rounded-xl bg-white/5 flex items-center justify-between">
                <span className="text-xs text-white truncate">{user.email}</span>
                {getPlanBadge()}
              </div>
            )}

            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(href)
                  ? 'bg-primary-500/15 text-primary-400'
                  : 'text-dark-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/create-trip"
                onClick={() => setMobileOpen(false)}
                className="btn-primary text-sm text-center py-2.5"
              >
                ✦ Plan a Trip
              </Link>
              {user ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileOpen(false);
                  }}
                  className="btn-secondary text-sm text-center py-2.5 text-red-400"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="btn-secondary text-sm text-center py-2.5"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
