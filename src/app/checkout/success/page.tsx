'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  CheckCircle2, Sparkles, Crown, ArrowRight, Calendar,
  Shield, Download, MapPin
} from 'lucide-react';
import { getSubscriptionStatus } from '@/lib/subscription';
import { UserSubscription } from '@/lib/types';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = (searchParams.get('plan') || 'voyager').toLowerCase();
  const invoiceId = searchParams.get('invoice');
  const isVoyager = planParam !== 'elite';

  const [sub, setSub] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubscriptionStatus().then((s) => {
      setSub(s);
      setLoading(false);
    });
  }, []);

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const planName = isVoyager ? 'Voyager' : 'Elite';

  return (
    <div className="max-w-2xl mx-auto w-full px-4 pt-28 pb-16 text-center">
      <div className="glass-card p-8 sm:p-12 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Checkmark icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>

        <div className="badge badge-primary inline-flex mb-3">
          {isVoyager ? <Sparkles className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
          <span>Subscription Activated</span>
        </div>

        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white mb-2">
          Welcome to <span className="gradient-text">{planName}</span>!
        </h1>

        <p className="text-dark-300 text-sm max-w-md mx-auto mb-8">
          {isVoyager
            ? 'Your 7-day free trial has been successfully initiated. You now have full access to all Voyager capabilities.'
            : 'Your Elite membership is now active. All advanced AI trip planning and agency features are unlocked.'}
        </p>

        {/* Status card */}
        <div className="glass-card bg-white/5 border border-white/10 p-6 rounded-2xl text-left space-y-4 mb-8">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs uppercase tracking-wider text-dark-400 font-semibold">
              Subscription Status
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
              {isVoyager ? 'Trialing (7 Days Left)' : 'Active Membership'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-dark-400 block mb-1">Plan & Billing</span>
              <span className="text-white font-medium">
                {planName} · ${isVoyager ? '12' : '29'}/mo
              </span>
            </div>

            <div>
              <span className="text-dark-400 block mb-1">Next Billing Date</span>
              <span className="text-white font-medium">
                {formatDate(sub?.next_billing_at)}
              </span>
            </div>

            {isVoyager && (
              <div className="col-span-2 pt-2 border-t border-white/5">
                <span className="text-dark-400 block mb-1">Trial Period</span>
                <span className="text-primary-400 font-medium">
                  {sub?.remaining_trial_days || 7} days remaining · $0.00 charged today
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/create-trip"
            className="btn-primary py-3 px-6 text-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Plan a Trip with {planName}</span>
          </Link>

          <Link
            href="/subscription"
            className="btn-secondary py-3 px-6 text-sm flex items-center justify-center gap-2"
          >
            <span>Manage Subscription</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <Suspense fallback={
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        }>
          <SuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

