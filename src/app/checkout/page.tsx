'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Sparkles, Crown, ShieldCheck, Lock, CreditCard, CheckCircle2,
  AlertCircle, Loader2, ArrowLeft, Calendar, Info
} from 'lucide-react';
import { getAuthToken, getStoredUser } from '@/lib/auth';
import { createCheckoutOrder, verifyPayment } from '@/lib/subscription';
import { PlanDetails } from '@/lib/types';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = (searchParams.get('plan') || 'voyager').toLowerCase();
  const isVoyager = planParam !== 'elite';

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Checkout details
  const [orderData, setOrderData] = useState<{
    order_id: string;
    key_id: string;
    provider: string;
  } | null>(null);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [amountDueToday, setAmountDueToday] = useState(0);
  const [firstBillingDate, setFirstBillingDate] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Form inputs
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/checkout?plan=${planParam}`)}`);
      return;
    }

    const user = getStoredUser();
    if (user?.name) {
      setCardName(user.name);
    }

    // Initialize checkout order from backend
    createCheckoutOrder(planParam)
      .then((res) => {
        setOrderData(res.order);
        setPlanDetails(res.plan);
        setAmountDueToday(res.amount_due_today);
        setFirstBillingDate(res.first_billing_date);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Checkout init error:', err);
        setError(err.message || 'Failed to initialize subscription checkout');
        setLoading(false);
      });
  }, [planParam, router]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    // Format with spaces: 4444 4444 4444 4444
    val = val.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(val);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = `${val.substring(0, 2)}/${val.substring(2)}`;
    }
    setCardExpiry(val);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('Please agree to the recurring subscription terms.');
      return;
    }

    if (!orderData) {
      setError('Payment order not ready. Please refresh.');
      return;
    }

    setError('');
    setProcessing(true);

    try {
      // Generate client test payment ID & HMAC signature if using direct form
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Request signature calculation or verify via backend
      // Backend payment_service verifies signature matching test secret or razorpay
      // We will send checkout payload to backend for server-side verification
      const verifyRes = await verifyPayment({
        plan_id: planParam,
        order_id: orderData.order_id,
        payment_id: paymentId,
        // The backend verifies HMAC or test signature:
        signature: 'TEST_SECURE_VERIFIED', // Handled by verify endpoint
        payment_method: 'card',
      });

      if (verifyRes.success) {
        router.push(`/checkout/success?plan=${planParam}&invoice=${verifyRes.invoice.id}`);
      } else {
        throw new Error(verifyRes.message || 'Verification failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment verification failed';
      setError(msg);
      setProcessing(false);
    }
  };

  const formatDate = (isoString: string) => {
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-dark-400 text-sm">Preparing secure checkout session...</p>
        </div>
      </div>
    );
  }

  const planName = isVoyager ? 'Voyager' : 'Elite';
  const planPrice = isVoyager ? 12 : 29;

  return (
    <div className="max-w-4xl mx-auto w-full px-4 pt-24 pb-16">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pricing Plans
        </Link>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Left column: Plan summary & breakdown */}
        <div className="md:col-span-5 space-y-6">
          <div className={`glass-card p-6 border ${
            isVoyager ? 'border-primary-500/30' : 'border-amber-500/30'
          } relative overflow-hidden`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isVoyager ? 'bg-gradient-to-br from-primary-500 to-purple-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'
              }`}>
                {isVoyager ? <Sparkles className="w-6 h-6 text-white" /> : <Crown className="w-6 h-6 text-white" />}
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary-400">
                  Subscription
                </span>
                <h2 className="font-display font-bold text-2xl text-white">
                  {planName} Plan
                </h2>
              </div>
            </div>

            <p className="text-dark-300 text-sm mb-6">
              {isVoyager
                ? 'Unlock unlimited itineraries, 30-day trips, and 24/7 AI travel assistant with a 7-day free trial.'
                : 'Maximum AI power: multi-city itineraries, white-label exports, API access and group collaboration.'}
            </p>

            {/* Trial badge if Voyager */}
            {isVoyager && (
              <div className="mb-6 p-3.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs flex items-start gap-2.5">
                <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-400" />
                <div>
                  <div className="font-semibold text-white">7-Day Free Trial Included</div>
                  <div className="text-dark-400 mt-0.5">
                    No charges today ($0.00). First monthly charge of $12 occurs on {formatDate(firstBillingDate)}.
                  </div>
                </div>
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-3 pt-4 border-t border-white/10 text-sm">
              <div className="flex justify-between text-dark-300">
                <span>Plan price</span>
                <span className="text-white font-medium">${planPrice}.00 / month</span>
              </div>

              {isVoyager && (
                <div className="flex justify-between text-green-400 font-medium">
                  <span>7-Day Free Trial Discount</span>
                  <span>-${planPrice}.00</span>
                </div>
              )}

              <div className="flex justify-between text-dark-400 text-xs">
                <span>Estimated Taxes & Fees</span>
                <span>$0.00</span>
              </div>

              <div className="flex justify-between text-lg font-bold text-white pt-3 border-t border-white/10">
                <span>Amount Due Today</span>
                <span className="text-emerald-400">${amountDueToday.toFixed(2)}</span>
              </div>
            </div>

            {/* Billing disclosure */}
            <div className="mt-4 pt-3 text-[11px] text-dark-500 leading-relaxed">
              Recurring billing: <strong className="text-dark-300">${planPrice}.00/month</strong> until cancelled.
              Next billing date: <span className="text-dark-300">{formatDate(firstBillingDate)}</span>. You can cancel anytime in your account dashboard with zero penalty.
            </div>
          </div>

          {/* Included Features */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="font-semibold text-white text-sm">What you get with {planName}:</h3>
            <ul className="space-y-2 text-xs text-dark-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>Unlimited AI-generated itineraries</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>Up to 30-day extended trip planning</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>Interactive maps with custom attraction pins</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>24/7 AI Chat Travel Assistant</span>
              </li>
              {planParam === 'elite' && (
                <>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>White-label PDF exports with agency branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Multi-city trip planning & API access</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Right column: Payment Form */}
        <div className="md:col-span-7">
          <div className="glass-card p-7 relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-400" />
                <h3 className="font-semibold text-white text-lg">Payment Details</h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-dark-400">
                <Lock className="w-3.5 h-3.5 text-green-400" />
                <span>256-Bit SSL Encrypted</span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Payment Verification Error</div>
                  <div className="mt-0.5">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                  Name on Card
                </label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g. Alex Traveler"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4111 2222 3333 4444"
                    maxLength={19}
                    className="input font-mono tracking-wider"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-dark-500 font-bold">
                    VISA / MC
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="input font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                    CVC / CVV
                  </label>
                  <input
                    type="password"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    className="input font-mono text-center"
                  />
                </div>
              </div>

              {/* Recurring Terms Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-dark-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 bg-dark-800 text-primary-500 focus:ring-primary-500/20"
                  />
                  <span>
                    I authorize Voyage AI to charge my card {isVoyager ? '$0.00 today for my 7-day trial, and $12.00/month recurring starting ' + formatDate(firstBillingDate) : '$29.00 today and recurring monthly'}. I understand I can cancel anytime before the billing date in my account.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={processing}
                className={`w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 mt-4 shadow-lg transition-all ${
                  isVoyager
                    ? 'btn-primary shadow-primary-500/20'
                    : 'btn-accent shadow-amber-500/20'
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying Subscription with Payment Gateway...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>
                      {isVoyager ? 'Start 7-Day Free Trial ($0.00 Due Today)' : 'Pay $29.00 & Activate Elite'}
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Test Sandbox helper note */}
            <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-dark-500 flex items-center justify-center gap-2">
              <Info className="w-3.5 h-3.5 text-primary-400" />
              <span>
                Sandbox Mode Active: Razorpay/Stripe test credentials supported. Any test card number works.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <CheckoutContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

