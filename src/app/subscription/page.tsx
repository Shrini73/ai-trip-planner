'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Sparkles, Crown, Zap, Calendar, CreditCard, Download,
  CheckCircle2, AlertTriangle, XCircle, ArrowUpRight,
  RefreshCw, ShieldCheck, FileText, ChevronRight, Loader2
} from 'lucide-react';
import { getAuthToken, getStoredUser } from '@/lib/auth';
import {
  getSubscriptionStatus, cancelSubscription, upgradeToElite,
  getInvoices, getInvoiceDetail, simulateLifecycleEvent
} from '@/lib/subscription';
import { UserSubscription, InvoiceItem } from '@/lib/types';

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<UserSubscription | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const loadData = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/sign-in?redirect=/subscription');
      return;
    }

    try {
      const [subData, invData] = await Promise.all([
        getSubscriptionStatus(),
        getInvoices(),
      ]);
      setSub(subData);
      setInvoices(invData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose premium access when the period ends.')) {
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const updated = await cancelSubscription(false);
      setSub(updated);
      setMessage({ type: 'success', text: 'Subscription has been cancelled.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await upgradeToElite();
      setSub(res.subscription);
      setMessage({ type: 'success', text: 'Congratulations! You have been upgraded to the Elite plan.' });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upgrade failed';
      setMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const detail = await getInvoiceDetail(invoiceId);
      setSelectedInvoice(detail);
    } catch {
      alert('Unable to load invoice details.');
    }
  };

  const handleSimulation = async (action: 'expire_trial' | 'payment_failed' | 'renew' | 'reset_to_free') => {
    setActionLoading(true);
    setMessage(null);
    try {
      const updated = await simulateLifecycleEvent(action);
      setSub(updated);
      setMessage({ type: 'success', text: `Simulation executed: ${action.replace('_', ' ')}` });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Simulation failed';
      setMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'trialing':
        return (
          <span className="badge bg-purple-500/20 text-purple-400 border border-purple-500/30">
            ⭐ 7-Day Free Trial
          </span>
        );
      case 'active':
        return (
          <span className="badge bg-green-500/20 text-green-400 border border-green-500/30">
            ✓ Active
          </span>
        );
      case 'past_due':
        return (
          <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30">
            ⚠️ Past Due
          </span>
        );
      case 'cancelled':
        return (
          <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">
            ✕ Cancelled
          </span>
        );
      case 'expired':
        return (
          <span className="badge bg-dark-600 text-dark-400 border border-white/10">
            Expired
          </span>
        );
      default:
        return (
          <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Free Plan
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-dark-400 text-sm">Loading subscription dashboard...</p>
        </div>
      </div>
    );
  }

  const currentPlan = sub?.plan_id || 'free';
  const isTrial = sub?.status === 'trialing';
  const isActive = sub?.status === 'active';
  const isPaid = isTrial || isActive;

  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div className="badge badge-primary inline-flex mb-2">
            <CreditCard className="w-3 h-3" /> Billing & Plan
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">
            My <span className="gradient-text">Subscription</span>
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            Manage your Voyage AI membership, trial days, payments, and invoices.
          </p>
        </div>

        {/* Message notification */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border text-sm flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Current Plan Overview Card */}
        <div className="grid md:grid-cols-12 gap-6 mb-10">
          <div className="md:col-span-8 glass-card p-7 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  currentPlan === 'elite'
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : currentPlan === 'voyager'
                    ? 'bg-gradient-to-br from-primary-500 to-purple-600'
                    : 'bg-white/10'
                }`}>
                  {currentPlan === 'elite' ? (
                    <Crown className="w-6 h-6 text-white" />
                  ) : currentPlan === 'voyager' ? (
                    <Sparkles className="w-6 h-6 text-white" />
                  ) : (
                    <Zap className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-2xl text-white">
                      {sub?.plan_name || 'Explorer (Free)'}
                    </h2>
                    {getStatusBadge(sub?.status)}
                  </div>
                  <div className="text-dark-400 text-xs mt-0.5">
                    {currentPlan === 'free'
                      ? 'Basic AI planning up to 7 days'
                      : currentPlan === 'voyager'
                      ? '$12.00 / month · Standard billing cycle'
                      : '$29.00 / month · Agency & power traveler access'}
                  </div>
                </div>
              </div>

              {/* Top actions */}
              <div className="flex items-center gap-2">
                {currentPlan === 'voyager' && (
                  <button
                    onClick={handleUpgrade}
                    disabled={actionLoading}
                    className="btn-accent text-xs py-2 px-3 flex items-center gap-1.5"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Upgrade to Elite</span>
                  </button>
                )}

                {currentPlan === 'free' && (
                  <Link
                    href="/checkout?plan=voyager"
                    className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Start 7-Day Trial</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Trial remaining alert if in trial */}
            {isTrial && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary-900/40 to-purple-900/40 border border-primary-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-300 font-bold font-display text-lg">
                    {sub?.remaining_trial_days}d
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">
                      {sub?.remaining_trial_days} days left in your free trial
                    </div>
                    <div className="text-xs text-dark-300">
                      Your trial will transition to $12/month on {formatDate(sub?.trial_end)}. Cancel anytime before then.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-dark-400 block mb-1">Billing Interval</span>
                <span className="text-white font-medium capitalize">
                  Monthly
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-dark-400 block mb-1">Price</span>
                <span className="text-white font-medium">
                  ${sub?.plan_price || 0}.00 / mo
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-dark-400 block mb-1">Next Billing Date</span>
                <span className="text-white font-medium">
                  {formatDate(sub?.next_billing_at)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-dark-400 block mb-1">Provider</span>
                <span className="text-white font-medium uppercase text-[11px]">
                  {sub?.provider || 'Razorpay / Stripe'}
                </span>
              </div>
            </div>

            {/* Cancellation notice or actions */}
            {sub?.cancel_at_period_end ? (
              <div className="mt-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center justify-between">
                <span>Your subscription will cancel at the end of the current billing cycle on {formatDate(sub?.current_period_end)}.</span>
              </div>
            ) : isPaid ? (
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-dark-400">
                  Cancel anytime. Features stay active until your current billing period ends.
                </span>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer"
                >
                  Cancel Subscription
                </button>
              </div>
            ) : null}
          </div>

          {/* Quick Perks Overview */}
          <div className="md:col-span-4 glass-card p-6 space-y-4">
            <h3 className="font-semibold text-white text-sm">Unlocked Plan Features</h3>
            <ul className="space-y-2.5 text-xs text-dark-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isPaid ? 'text-green-400' : 'text-dark-500'}`} />
                <span className={isPaid ? 'text-white' : 'text-dark-400'}>
                  {isPaid ? 'Unlimited AI Itineraries' : '3 Itineraries / month'}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isPaid ? 'text-green-400' : 'text-dark-500'}`} />
                <span className={isPaid ? 'text-white' : 'text-dark-400'}>
                  {isPaid ? 'Up to 30-Day Trips' : 'Max 7-Day Trips'}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isPaid ? 'text-green-400' : 'text-dark-500'}`} />
                <span className={isPaid ? 'text-white' : 'text-dark-400'}>
                  {isPaid ? 'AI Travel Assistant Chat' : 'No AI Chat Assistant'}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${currentPlan === 'elite' ? 'text-amber-400' : 'text-dark-500'}`} />
                <span className={currentPlan === 'elite' ? 'text-white' : 'text-dark-400'}>
                  White-Label PDF Exports {currentPlan !== 'elite' && '(Elite)'}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${currentPlan === 'elite' ? 'text-amber-400' : 'text-dark-500'}`} />
                <span className={currentPlan === 'elite' ? 'text-white' : 'text-dark-400'}>
                  Multi-City & API Access {currentPlan !== 'elite' && '(Elite)'}
                </span>
              </li>
            </ul>

            {currentPlan !== 'elite' && (
              <div className="pt-2">
                <Link
                  href="/pricing"
                  className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Compare All Plans</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Payment History & Invoices Table */}
        <div className="glass-card p-6 mb-10">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div>
              <h3 className="font-semibold text-white text-base">Payment History & Invoices</h3>
              <p className="text-dark-400 text-xs">Official receipts and billing invoices for your account</p>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-8 text-dark-400 text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No invoices generated yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-dark-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Invoice #</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Description</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-mono font-medium text-white">{inv.invoice_number}</td>
                      <td className="py-3 text-dark-300">{formatDate(inv.created_at)}</td>
                      <td className="py-3 text-dark-300 capitalize">{inv.billing_reason.replace('_', ' ')}</td>
                      <td className="py-3 font-semibold text-white">${inv.amount.toFixed(2)} {inv.currency}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                          {inv.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleViewInvoice(inv.id)}
                          className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 font-medium cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Developer Sandbox Testing Controls */}
        <div className="glass-card p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-400" />
              <h4 className="font-semibold text-white text-sm">Testing & Simulation Controls</h4>
            </div>
            <span className="text-[11px] text-dark-500">Test sandbox lifecycle events without waiting</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => handleSimulation('expire_trial')}
              disabled={actionLoading}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-colors"
            >
              ⚡ Fast-Forward: Expire Trial & Auto-Transition to Paid
            </button>

            <button
              onClick={() => handleSimulation('payment_failed')}
              disabled={actionLoading}
              className="px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30 transition-colors"
            >
              ⚠️ Simulate Payment Failure (Past Due)
            </button>

            <button
              onClick={() => handleSimulation('renew')}
              disabled={actionLoading}
              className="px-3 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-300 text-xs border border-green-500/30 transition-colors"
            >
              🔄 Simulate Monthly Renewal Payment
            </button>

            <button
              onClick={() => handleSimulation('reset_to_free')}
              disabled={actionLoading}
              className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs border border-red-500/30 transition-colors"
            >
              ↺ Reset Account to Free Plan
            </button>
          </div>
        </div>
      </main>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 text-dark-400 hover:text-white"
            >
              ✕
            </button>

            <div className="text-center pb-6 border-b border-white/10">
              <h3 className="font-display font-bold text-xl text-white">VOYAGE AI RECEIPT</h3>
              <div className="text-xs text-dark-400 mt-1">
                Invoice Number: <span className="font-mono text-white">{selectedInvoice.invoice.invoice_number}</span>
              </div>
              <div className="text-xs text-dark-400">
                Date: {formatDate(selectedInvoice.invoice.created_at)}
              </div>
            </div>

            <div className="py-4 text-xs space-y-2 border-b border-white/10">
              <div className="flex justify-between">
                <span className="text-dark-400">Billed To:</span>
                <span className="text-white font-medium">{selectedInvoice.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Payment Status:</span>
                <span className="text-green-400 font-semibold uppercase">{selectedInvoice.invoice.status}</span>
              </div>
            </div>

            <div className="py-4 space-y-2">
              {selectedInvoice.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs text-dark-300">
                  <span>{item.description}</span>
                  <span className="text-white font-medium">${item.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold text-white pt-3 border-t border-white/10">
                <span>Total Paid:</span>
                <span>${selectedInvoice.total.toFixed(2)} {selectedInvoice.invoice.currency}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="btn-secondary text-xs py-2 px-4"
              >
                Print / Save PDF
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="btn-primary text-xs py-2 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

