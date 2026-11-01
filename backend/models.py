from datetime import datetime, timezone
import json
import math
from backend.database import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(64), primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    subscriptions = db.relationship('Subscription', backref='user', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='user', lazy=True, cascade='all, delete-orphan')
    invoices = db.relationship('Invoice', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name or self.email.split('@')[0],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Plan(db.Model):
    __tablename__ = 'plans'

    id = db.Column(db.String(32), primary_key=True) # 'free', 'voyager', 'elite'
    name = db.Column(db.String(64), nullable=False)
    price = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(8), default='USD')
    interval = db.Column(db.String(16), default='month')
    trial_days = db.Column(db.Integer, default=0)
    description = db.Column(db.String(256), nullable=False)
    features_json = db.Column(db.Text, nullable=False)

    def to_dict(self):
        try:
            features = json.loads(self.features_json)
        except Exception:
            features = []
        return {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'currency': self.currency,
            'interval': self.interval,
            'trial_days': self.trial_days,
            'description': self.description,
            'features': features
        }

class Subscription(db.Model):
    __tablename__ = 'subscriptions'

    id = db.Column(db.String(64), primary_key=True) # sub_xxx
    user_id = db.Column(db.String(64), db.ForeignKey('users.id'), nullable=False, index=True)
    plan_id = db.Column(db.String(32), db.ForeignKey('plans.id'), nullable=False)
    provider = db.Column(db.String(32), default='razorpay') # razorpay, stripe, test_sandbox
    provider_subscription_id = db.Column(db.String(128), nullable=True)
    provider_customer_id = db.Column(db.String(128), nullable=True)
    
    # Statuses: 'free', 'trialing', 'active', 'past_due', 'cancelled', 'expired'
    status = db.Column(db.String(32), nullable=False, default='free')
    
    trial_start = db.Column(db.DateTime, nullable=True)
    trial_end = db.Column(db.DateTime, nullable=True)
    current_period_start = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    current_period_end = db.Column(db.DateTime, nullable=True)
    next_billing_at = db.Column(db.DateTime, nullable=True)
    
    cancel_at_period_end = db.Column(db.Boolean, default=False)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    ended_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    plan = db.relationship('Plan', lazy='joined')
    payments = db.relationship('Payment', backref='subscription', lazy=True)
    invoices = db.relationship('Invoice', backref='subscription', lazy=True)

    @property
    def remaining_trial_days(self):
        if self.status != 'trialing' or not self.trial_end:
            return 0
        now = datetime.now(timezone.utc)
        trial_end_utc = self.trial_end.replace(tzinfo=timezone.utc) if self.trial_end.tzinfo is None else self.trial_end
        diff = trial_end_utc - now
        if diff.total_seconds() <= 0:
            return 0
        return math.ceil(diff.total_seconds() / 86400)

    def check_and_update_lifecycle(self):
        """Auto transitions trialing -> active or expired when time arrives"""
        now = datetime.now(timezone.utc)
        if self.status == 'trialing' and self.trial_end:
            trial_end_utc = self.trial_end.replace(tzinfo=timezone.utc) if self.trial_end.tzinfo is None else self.trial_end
            if now >= trial_end_utc:
                if self.cancel_at_period_end:
                    self.status = 'cancelled'
                    self.ended_at = now
                else:
                    # Automatically transition to paid active
                    self.status = 'active'
                    self.current_period_start = now
                    # Next 30 days
                    from datetime import timedelta
                    self.current_period_end = now + timedelta(days=30)
                    self.next_billing_at = self.current_period_end

        elif self.status == 'active' and self.current_period_end:
            end_utc = self.current_period_end.replace(tzinfo=timezone.utc) if self.current_period_end.tzinfo is None else self.current_period_end
            if now >= end_utc:
                if self.cancel_at_period_end:
                    self.status = 'cancelled'
                    self.ended_at = now
                else:
                    # Cycle renewal
                    from datetime import timedelta
                    self.current_period_start = now
                    self.current_period_end = now + timedelta(days=30)
                    self.next_billing_at = self.current_period_end

    def to_dict(self):
        self.check_and_update_lifecycle()
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan_id': self.plan_id,
            'plan_name': self.plan.name if self.plan else self.plan_id.title(),
            'plan_price': self.plan.price if self.plan else 0,
            'provider': self.provider,
            'provider_subscription_id': self.provider_subscription_id,
            'status': self.status, # 'free', 'trialing', 'active', 'past_due', 'cancelled', 'expired'
            'is_active': self.status in ['trialing', 'active'],
            'trial_start': self.trial_start.isoformat() if self.trial_start else None,
            'trial_end': self.trial_end.isoformat() if self.trial_end else None,
            'remaining_trial_days': self.remaining_trial_days,
            'current_period_start': self.current_period_start.isoformat() if self.current_period_start else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None,
            'next_billing_at': self.next_billing_at.isoformat() if self.next_billing_at else None,
            'cancel_at_period_end': self.cancel_at_period_end,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.String(64), primary_key=True) # pay_xxx
    subscription_id = db.Column(db.String(64), db.ForeignKey('subscriptions.id'), nullable=False)
    user_id = db.Column(db.String(64), db.ForeignKey('users.id'), nullable=False)
    provider = db.Column(db.String(32), default='razorpay')
    provider_payment_id = db.Column(db.String(128), nullable=True)
    provider_order_id = db.Column(db.String(128), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(8), default='USD')
    status = db.Column(db.String(32), default='succeeded') # 'succeeded', 'failed', 'pending', 'refunded'
    payment_method = db.Column(db.String(64), default='card')
    signature = db.Column(db.String(256), nullable=True)
    failure_reason = db.Column(db.String(256), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'subscription_id': self.subscription_id,
            'user_id': self.user_id,
            'provider': self.provider,
            'provider_payment_id': self.provider_payment_id,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'payment_method': self.payment_method,
            'failure_reason': self.failure_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Invoice(db.Model):
    __tablename__ = 'invoices'

    id = db.Column(db.String(64), primary_key=True) # inv_xxx
    user_id = db.Column(db.String(64), db.ForeignKey('users.id'), nullable=False)
    subscription_id = db.Column(db.String(64), db.ForeignKey('subscriptions.id'), nullable=False)
    payment_id = db.Column(db.String(64), db.ForeignKey('payments.id'), nullable=True)
    invoice_number = db.Column(db.String(64), unique=True, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(8), default='USD')
    status = db.Column(db.String(32), default='paid') # 'paid', 'open', 'void'
    billing_reason = db.Column(db.String(64), default='subscription_cycle')
    paid_at = db.Column(db.DateTime, nullable=True)
    pdf_data = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'subscription_id': self.subscription_id,
            'invoice_number': self.invoice_number,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'billing_reason': self.billing_reason,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class TripUsage(db.Model):
    __tablename__ = 'trip_usages'

    id = db.Column(db.String(64), primary_key=True)
    user_id = db.Column(db.String(64), db.ForeignKey('users.id'), nullable=False)
    month_year = db.Column(db.String(16), nullable=False) # e.g. "2026-11"
    itinerary_count = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

