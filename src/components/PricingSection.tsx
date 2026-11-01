'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Zap, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';
import { getSubscriptionStatus } from '@/lib/subscription';
import { UserSubscription } from '@/lib/types';

const plans = [
  {
    id: 'free',
    name: 'Explorer',
    icon: Zap,
    price: 'Free',
    period: '',
    description: 'Perfect for occasional travelers',
    color: 'from-dark-700 to-dark-800',
    borderColor: 'border-white/10',
    buttonClass: 'btn-secondary',
    buttonText: 'Get Started Free',
    targetRoute: '/create-trip',
    features: [
      '3 AI itineraries per month',
      'Up to 7-day trip planning',
      'Basic map view',
      'Budget breakdown',
      'PDF export',
      'Community support',
    ],
    limits: ['No AI chat assistant', 'No saved trip sync'],
    featured: false,
  },
  {
    id: 'voyager',
    name: 'Voyager',
    icon: Sparkles,
    price: '$12',
    period: '/month',
    description: 'For frequent travelers who want more',
    color: 'from-primary-900/50 to-purple-900/50',
    borderColor: 'border-primary-500/40',
    buttonClass: 'btn-primary',
    buttonText: 'Start 7-Day Free Trial',
    targetRoute: '/checkout?plan=voyager',
    features: [
      'Unlimited AI itineraries',
      'Up to 30-day trip planning',
      'Interactive map with all pins',
      'AI chat travel assistant',
      'Advanced budget planner',
      'Priority generation queue',
      'PDF & share export',
      'Cloud trip sync',
    ],
    limits: [],
    featured: true,
    badge: '⭐ Most Popular',
  },
  {
    id: 'elite',
    name: 'Elite',
    icon: Crown,
    price: '$29',
    period: '/month',
    description: 'For travel agencies & power users',
    color: 'from-amber-900/30 to-orange-900/30',
    borderColor: 'border-amber-500/30',
    buttonClass: 'btn-accent',
    buttonText: 'Go Elite',
    targetRoute: '/checkout?plan=elite',
    features: [
      'Everything in Voyager',
      'Multi-city trip planning',
      'Group trip collaboration',
      'White-label PDF export',
      'API access',
      'Priority customer support',
      'Custom AI training on preferences',
      'Offline access',
    ],
    limits: [],
    featured: false,
  },
];

export default function PricingSection() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    getSubscriptionStatus().then(sub => {
      if (sub) setSubscription(sub);
    });
  }, []);

  const handlePlanClick = (plan: typeof plans[0]) => {
    // Free plan always goes to create-trip directly
    if (plan.id === 'free') {
      router.push('/create-trip');
      return;
    }

    setLoadingPlan(plan.id);
    const token = getAuthToken();

    if (!token) {
      // Unauthenticated users are redirected to login/signup with return redirect
      router.push(`/sign-in?redirect=${encodeURIComponent(plan.targetRoute)}`);
    } else {
      // Authenticated users go directly to subscription checkout
      router.push(plan.targetRoute);
    }
  };

  return (
    <section id="pricing" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="badge badge-accent inline-flex mb-4">
            <Crown className="w-3 h-3" /> Pricing
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Simple, <span className="gradient-text">Transparent Pricing</span>
          </h2>
          <p className="text-dark-400 text-lg max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees, no surprises.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = subscription && subscription.plan_id === plan.id && subscription.status !== 'cancelled' && subscription.status !== 'expired';
            const isTrialActive = isCurrentPlan && subscription?.status === 'trialing';

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border ${plan.borderColor} bg-gradient-to-br ${plan.color} p-7 transition-all duration-300 hover:shadow-2xl ${plan.featured ? 'md:scale-105 shadow-primary-500/20 shadow-xl' : ''
                  }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge badge-primary text-xs px-4 py-1 whitespace-nowrap">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.featured ? 'bg-gradient-to-br from-primary-500 to-purple-600' : 'bg-white/10'
                    }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-white flex items-center gap-2">
                      {plan.name}
                      {isCurrentPlan && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                          {isTrialActive ? `Trial (${subscription?.remaining_trial_days}d left)` : 'Current Plan'}
                        </span>
                      )}
                    </div>
                    <div className="text-dark-400 text-xs">{plan.description}</div>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="font-display font-bold text-5xl text-white">{plan.price}</span>
                  <span className="text-dark-400 text-sm">{plan.period}</span>
                  {plan.id === 'voyager' && (
                    <div className="text-xs text-primary-400 mt-1 font-medium">
                      7-day free trial · $0 due today
                    </div>
                  )}
                </div>

                {isCurrentPlan ? (
                  <Link
                    href="/subscription"
                    className="w-full block text-center mb-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium border border-white/10 transition-colors"
                  >
                    Manage Subscription
                  </Link>
                ) : (
                  <button
                    onClick={() => handlePlanClick(plan)}
                    disabled={loadingPlan === plan.id}
                    className={`${plan.buttonClass} w-full block text-center mb-6 py-3 cursor-pointer flex items-center justify-center gap-2`}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>{plan.buttonText}</span>
                    )}
                  </button>
                )}

                <div className="space-y-3">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-dark-300 text-sm">{f}</span>
                    </div>
                  ))}
                  {plan.limits.map((l) => (
                    <div key={l} className="flex items-start gap-2.5 opacity-50">
                      <span className="w-4 h-4 flex items-center justify-center mt-0.5 flex-shrink-0 text-dark-500 text-lg leading-none">×</span>
                      <span className="text-dark-500 text-sm">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Money-back guarantee */}
        <div className="text-center mt-12">
          <p className="text-dark-400 text-sm">
            🔒 30-day money-back guarantee · 🌍 Cancel anytime · ✓ No credit card required for free plan
          </p>
        </div>
      </div>
    </section>
  );
}
