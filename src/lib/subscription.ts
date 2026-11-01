import { getAuthToken } from './auth';
import { PlanDetails, UserSubscription, InvoiceItem, FeaturePermissions } from './types';

function getAuthHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getPlans(): Promise<PlanDetails[]> {
  try {
    const res = await fetch('/api/py/subscription/plans');
    if (!res.ok) throw new Error('Failed to fetch plans');
    const data = await res.json();
    return data.plans;
  } catch (e) {
    console.error('Error fetching plans:', e);
    return [];
  }
}

export async function getSubscriptionStatus(): Promise<UserSubscription | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/py/subscription/status', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.subscription;
  } catch (e) {
    console.error('Error fetching subscription status:', e);
    return null;
  }
}

export async function createCheckoutOrder(planId: string): Promise<{
  order: {
    provider: string;
    order_id: string;
    amount: number;
    currency: string;
    key_id: string;
    status: string;
  };
  plan: PlanDetails;
  amount_due_today: number;
  recurring_price: number;
  currency: string;
  first_billing_date: string;
  trial_days: number;
  user: { id: string; email: string; name: string };
}> {
  try {
    const res = await fetch('/api/py/subscription/checkout/create', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ plan_id: planId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create subscription checkout');
    }

    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('fetch') || msg.includes('Failed')) {
      throw new Error('Backend server is initializing. Ensure "npm run dev" or "python -m backend.app" is active.');
    }
    throw err;
  }
}

export async function verifyPayment(payload: {
  plan_id: string;
  order_id: string;
  payment_id: string;
  signature: string;
  payment_method?: string;
}): Promise<{
  success: boolean;
  message: string;
  subscription: UserSubscription;
  invoice: InvoiceItem;
}> {
  const res = await fetch('/api/py/subscription/checkout/verify', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Payment signature verification failed');
  }

  return res.json();
}

export async function cancelSubscription(immediate: boolean = false): Promise<UserSubscription> {
  const res = await fetch('/api/py/subscription/cancel', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ immediate }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to cancel subscription');
  }

  const data = await res.json();
  return data.subscription;
}

export async function upgradeToElite(): Promise<{ subscription: UserSubscription; invoice: InvoiceItem }> {
  const res = await fetch('/api/py/subscription/upgrade', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upgrade subscription');
  }

  return res.json();
}

export async function getInvoices(): Promise<InvoiceItem[]> {
  try {
    const res = await fetch('/api/py/subscription/invoices', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.invoices || [];
  } catch (e) {
    console.error('Error fetching invoices:', e);
    return [];
  }
}

export async function getInvoiceDetail(invoiceId: string) {
  const res = await fetch(`/api/py/subscription/invoice/${invoiceId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch invoice');
  }
  return res.json();
}

export async function getFeaturePermissions(): Promise<FeaturePermissions> {
  try {
    const res = await fetch('/api/py/subscription/features', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Feature check failed');
    return await res.json();
  } catch {
    // Default Free fallback
    return {
      plan_id: 'free',
      status: 'free',
      remaining_trial_days: 0,
      can_use_chat: false,
      max_trip_days: 7,
      max_monthly_itineraries: 3,
      can_white_label_pdf: false,
      can_multi_city: false,
      can_group_collab: false,
      can_offline_access: false,
      has_api_access: false,
    };
  }
}

export async function simulateLifecycleEvent(action: 'expire_trial' | 'payment_failed' | 'renew' | 'reset_to_free'): Promise<UserSubscription> {
  const res = await fetch('/api/py/subscription/simulate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ action }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed simulation');
  }

  const data = await res.json();
  return data.subscription;
}

