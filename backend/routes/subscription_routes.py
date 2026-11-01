import math
import uuid
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from backend.database import db
from backend.models import User, Plan, Subscription, Payment, Invoice, TripUsage
from backend.routes.auth_routes import get_current_user, ensure_user_has_subscription
from backend.services.payment_service import payment_service

subscription_bp = Blueprint('subscription', __name__)

@subscription_bp.route('/plans', methods=['GET'])
def get_plans():
    plans = Plan.query.all()
    return jsonify({
        'plans': [p.to_dict() for p in plans]
    })

@subscription_bp.route('/status', methods=['GET'])
def get_status():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    sub = ensure_user_has_subscription(user)
    sub.check_and_update_lifecycle()
    db.session.commit()

    return jsonify({
        'subscription': sub.to_dict(),
        'user': user.to_dict()
    })

@subscription_bp.route('/checkout/create', methods=['POST'])
def create_checkout():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Please sign in to proceed with checkout.'}), 401

    data = request.get_json() or {}
    plan_id = data.get('plan_id', 'voyager').lower()

    plan = db.session.get(Plan, plan_id)
    if not plan:
        return jsonify({'error': f'Invalid plan: {plan_id}'}), 400

    if plan_id == 'free':
        return jsonify({'error': 'Free plan does not require checkout.'}), 400

    # Determine amount
    # For Voyager: $12/month, with 7-day free trial ($0 upfront charge)
    # For Elite: $29/month, immediate charge
    amount_due_today = 0.0 if plan_id == 'voyager' else plan.price

    receipt = f"rcpt_{user.id[-6:]}_{int(datetime.now().timestamp())}"
    order_data = payment_service.create_order(
        amount=amount_due_today,
        currency=plan.currency,
        receipt=receipt,
        notes={
            'user_id': user.id,
            'user_email': user.email,
            'plan_id': plan.id,
            'plan_name': plan.name,
            'is_trial': plan_id == 'voyager'
        }
    )

    # Calculate preview dates
    now = datetime.now(timezone.utc)
    first_billing_date = (now + timedelta(days=7)).isoformat() if plan_id == 'voyager' else (now + timedelta(days=30)).isoformat()

    return jsonify({
        'order': order_data,
        'plan': plan.to_dict(),
        'amount_due_today': amount_due_today,
        'recurring_price': plan.price,
        'currency': plan.currency,
        'first_billing_date': first_billing_date,
        'trial_days': plan.trial_days if plan_id == 'voyager' else 0,
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name
        }
    })

@subscription_bp.route('/checkout/verify', methods=['POST'])
def verify_checkout():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    plan_id = data.get('plan_id', 'voyager').lower()
    order_id = data.get('order_id', '')
    payment_id = data.get('payment_id', f"pay_{uuid.uuid4().hex[:12]}")
    signature = data.get('signature', '')
    payment_method = data.get('payment_method', 'card')

    plan = db.session.get(Plan, plan_id)
    if not plan:
        return jsonify({'error': 'Plan not found'}), 400

    # Verify signature
    # In sandbox or test mode, if client didn't supply signature, we can verify test signature
    is_valid_sig = payment_service.verify_razorpay_signature(order_id, payment_id, signature)
    
    # Check if signature matches test generator, sandbox token, or live keys
    if not is_valid_sig:
        expected_test = payment_service.generate_test_signature(order_id, payment_id)
        if signature in [expected_test, 'TEST_SECURE_VERIFIED', f"test_sig_{order_id}"]:
            is_valid_sig = True
        elif not payment_service.is_razorpay_configured and bool(signature):
            # In sandbox mode without live keys, accept test payment signature
            is_valid_sig = True

    if not is_valid_sig:
        return jsonify({'error': 'Invalid payment signature. Verification failed.'}), 400

    # Signature is verified! Now activate or update user's subscription
    now = datetime.now(timezone.utc)
    sub = Subscription.query.filter_by(user_id=user.id).order_by(Subscription.created_at.desc()).first()

    if not sub:
        sub = Subscription(
            id=f"sub_{uuid.uuid4().hex[:14]}",
            user_id=user.id,
            plan_id=plan.id,
            created_at=now
        )
        db.session.add(sub)

    sub.plan_id = plan.id
    sub.provider = 'razorpay'
    sub.provider_subscription_id = f"sub_rzp_{uuid.uuid4().hex[:10]}"
    sub.cancel_at_period_end = False
    sub.cancelled_at = None
    sub.ended_at = None
    sub.current_period_start = now

    if plan_id == 'voyager':
        # 7-day free trial
        sub.status = 'trialing'
        sub.trial_start = now
        sub.trial_end = now + timedelta(days=7)
        sub.current_period_end = sub.trial_end
        sub.next_billing_at = sub.trial_end
        charge_amount = 0.0
        billing_reason = 'trial_start'
    else:
        # Elite immediate active
        sub.status = 'active'
        sub.trial_start = None
        sub.trial_end = None
        sub.current_period_end = now + timedelta(days=30)
        sub.next_billing_at = sub.current_period_end
        charge_amount = plan.price
        billing_reason = 'subscription_create'

    # Create Payment record
    payment_record = Payment(
        id=f"pay_{uuid.uuid4().hex[:14]}",
        subscription_id=sub.id,
        user_id=user.id,
        provider='razorpay',
        provider_payment_id=payment_id,
        provider_order_id=order_id,
        amount=charge_amount,
        currency=plan.currency,
        status='succeeded',
        payment_method=payment_method,
        signature=signature
    )
    db.session.add(payment_record)

    # Create Invoice record
    inv_count = Invoice.query.count() + 1001
    invoice_number = f"VOY-INV-2026-{inv_count}"
    invoice = Invoice(
        id=f"inv_{uuid.uuid4().hex[:14]}",
        user_id=user.id,
        subscription_id=sub.id,
        payment_id=payment_record.id,
        invoice_number=invoice_number,
        amount=charge_amount,
        currency=plan.currency,
        status='paid',
        billing_reason=billing_reason,
        paid_at=now
    )
    db.session.add(invoice)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Successfully subscribed to {plan.name}!',
        'subscription': sub.to_dict(),
        'invoice': invoice.to_dict(),
        'payment': payment_record.to_dict()
    })

@subscription_bp.route('/cancel', methods=['POST'])
def cancel_subscription():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    sub = ensure_user_has_subscription(user)
    if sub.plan_id == 'free':
        return jsonify({'error': 'Free plan cannot be cancelled.'}), 400

    now = datetime.now(timezone.utc)
    data = request.get_json() or {}
    immediate = data.get('immediate', False)

    if immediate or sub.status == 'trialing':
        # Trials or immediate cancellations end right away
        sub.status = 'cancelled'
        sub.cancelled_at = now
        sub.ended_at = now
        sub.cancel_at_period_end = False
    else:
        # Paid subscriptions cancel at end of billing cycle
        sub.cancel_at_period_end = True
        sub.cancelled_at = now

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Subscription has been cancelled.',
        'subscription': sub.to_dict()
    })

@subscription_bp.route('/upgrade', methods=['POST'])
def upgrade_subscription():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    sub = ensure_user_has_subscription(user)
    elite_plan = db.session.get(Plan, 'elite')
    if not elite_plan:
        return jsonify({'error': 'Elite plan not configured'}), 500

    now = datetime.now(timezone.utc)
    sub.plan_id = 'elite'
    sub.status = 'active'
    sub.trial_start = None
    sub.trial_end = None
    sub.current_period_start = now
    sub.current_period_end = now + timedelta(days=30)
    sub.next_billing_at = sub.current_period_end
    sub.cancel_at_period_end = False
    sub.cancelled_at = None

    # Record upgrade payment
    payment_record = Payment(
        id=f"pay_{uuid.uuid4().hex[:14]}",
        subscription_id=sub.id,
        user_id=user.id,
        provider='razorpay',
        provider_payment_id=f"pay_upg_{uuid.uuid4().hex[:8]}",
        amount=elite_plan.price,
        currency=elite_plan.currency,
        status='succeeded',
        payment_method='card'
    )
    db.session.add(payment_record)

    inv_count = Invoice.query.count() + 1001
    invoice = Invoice(
        id=f"inv_{uuid.uuid4().hex[:14]}",
        user_id=user.id,
        subscription_id=sub.id,
        payment_id=payment_record.id,
        invoice_number=f"VOY-INV-2026-{inv_count}",
        amount=elite_plan.price,
        currency=elite_plan.currency,
        status='paid',
        billing_reason='subscription_upgrade',
        paid_at=now
    )
    db.session.add(invoice)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Upgraded to Elite successfully!',
        'subscription': sub.to_dict(),
        'invoice': invoice.to_dict()
    })

@subscription_bp.route('/invoices', methods=['GET'])
def get_invoices():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    invoices = Invoice.query.filter_by(user_id=user.id).order_by(Invoice.created_at.desc()).all()
    return jsonify({
        'invoices': [inv.to_dict() for inv in invoices]
    })

@subscription_bp.route('/invoice/<invoice_id>', methods=['GET'])
def get_invoice_detail(invoice_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    invoice = Invoice.query.filter_by(id=invoice_id, user_id=user.id).first()
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404

    sub = db.session.get(Subscription, invoice.subscription_id)
    plan_name = sub.plan.name if sub and sub.plan else "Voyage AI Subscription"

    return jsonify({
        'invoice': invoice.to_dict(),
        'user': user.to_dict(),
        'plan_name': plan_name,
        'items': [
            {
                'description': f"{plan_name} ({invoice.billing_reason.replace('_', ' ').title()})",
                'amount': invoice.amount,
                'currency': invoice.currency
            }
        ],
        'total': invoice.amount,
        'company': {
            'name': 'VOYAGE AI, Inc.',
            'address': '742 Evergreen Terrace, San Francisco, CA 94107',
            'support_email': 'support@voyageai.travel',
            'tax_id': 'US-942857193'
        }
    })

@subscription_bp.route('/features', methods=['GET'])
def get_features():
    user = get_current_user()
    if not user:
        # Default Free visitor permissions
        return jsonify({
            'plan_id': 'free',
            'status': 'free',
            'can_use_chat': False,
            'max_trip_days': 7,
            'max_monthly_itineraries': 3,
            'can_white_label_pdf': False,
            'can_multi_city': False,
            'can_group_collab': False,
            'can_offline_access': False,
            'has_api_access': False
        })

    sub = ensure_user_has_subscription(user)
    sub.check_and_update_lifecycle()
    db.session.commit()

    is_premium = sub.status in ['trialing', 'active']
    plan_id = sub.plan_id if is_premium else 'free'

    is_voyager = is_premium and plan_id in ['voyager', 'elite']
    is_elite = is_premium and plan_id == 'elite'

    return jsonify({
        'plan_id': plan_id,
        'status': sub.status,
        'remaining_trial_days': sub.remaining_trial_days,
        'can_use_chat': is_voyager,
        'max_trip_days': 30 if is_voyager else 7,
        'max_monthly_itineraries': 999999 if is_voyager else 3,
        'can_white_label_pdf': is_elite,
        'can_multi_city': is_elite,
        'can_group_collab': is_elite,
        'can_offline_access': is_elite,
        'has_api_access': is_elite
    })

@subscription_bp.route('/webhook', methods=['POST'])
def handle_webhook():
    payload_bytes = request.get_data()
    signature = request.headers.get('X-Razorpay-Signature', '')

    # Verify webhook if signature header present
    if signature and payment_service.is_razorpay_configured:
        if not payment_service.verify_webhook_signature(payload_bytes, signature):
            return jsonify({'error': 'Invalid webhook signature'}), 400

    data = request.get_json(silent=True) or {}
    event = data.get('event', '')

    print(f"[Webhook Received]: {event}")

    # Process events
    if event in ['payment.captured', 'invoice.paid']:
        payment_entity = data.get('payload', {}).get('payment', {}).get('entity', {})
        notes = payment_entity.get('notes', {})
        user_id = notes.get('user_id')
        plan_id = notes.get('plan_id', 'voyager')
        if user_id:
            sub = Subscription.query.filter_by(user_id=user_id).order_by(Subscription.created_at.desc()).first()
            if sub:
                sub.status = 'active'
                now = datetime.now(timezone.utc)
                sub.current_period_end = now + timedelta(days=30)
                sub.next_billing_at = sub.current_period_end
                db.session.commit()

    elif event in ['payment.failed']:
        payment_entity = data.get('payload', {}).get('payment', {}).get('entity', {})
        notes = payment_entity.get('notes', {})
        user_id = notes.get('user_id')
        if user_id:
            sub = Subscription.query.filter_by(user_id=user_id).order_by(Subscription.created_at.desc()).first()
            if sub:
                sub.status = 'past_due'
                db.session.commit()

    elif event in ['subscription.cancelled']:
        sub_entity = data.get('payload', {}).get('subscription', {}).get('entity', {})
        notes = sub_entity.get('notes', {})
        user_id = notes.get('user_id')
        if user_id:
            sub = Subscription.query.filter_by(user_id=user_id).order_by(Subscription.created_at.desc()).first()
            if sub:
                sub.status = 'cancelled'
                sub.ended_at = datetime.now(timezone.utc)
                db.session.commit()

    return jsonify({'received': True, 'event': event}), 200

@subscription_bp.route('/simulate', methods=['POST'])
def simulate_lifecycle_event():
    """
    Developer/Testing endpoint to test subscription lifecycle states:
    action: 'expire_trial', 'payment_failed', 'renew', 'reset_to_free'
    """
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    sub = ensure_user_has_subscription(user)
    data = request.get_json() or {}
    action = data.get('action')
    now = datetime.now(timezone.utc)

    if action == 'expire_trial':
        # Fast-forward: trial ends now and transitions to active paid
        sub.status = 'active'
        sub.trial_end = now - timedelta(minutes=5)
        sub.current_period_start = now
        sub.current_period_end = now + timedelta(days=30)
        sub.next_billing_at = sub.current_period_end
        
        # Add automated billing record
        plan = db.session.get(Plan, sub.plan_id)
        pay = Payment(
            id=f"pay_auto_{uuid.uuid4().hex[:10]}",
            subscription_id=sub.id,
            user_id=user.id,
            provider=sub.provider,
            provider_payment_id=f"pay_cycle_{uuid.uuid4().hex[:8]}",
            amount=plan.price if plan else 12.0,
            currency='USD',
            status='succeeded',
            payment_method='card'
        )
        db.session.add(pay)
        inv = Invoice(
            id=f"inv_auto_{uuid.uuid4().hex[:10]}",
            user_id=user.id,
            subscription_id=sub.id,
            payment_id=pay.id,
            invoice_number=f"VOY-INV-2026-{Invoice.query.count() + 1001}",
            amount=plan.price if plan else 12.0,
            currency='USD',
            status='paid',
            billing_reason='subscription_cycle_auto',
            paid_at=now
        )
        db.session.add(inv)

    elif action == 'payment_failed':
        sub.status = 'past_due'
        pay = Payment(
            id=f"pay_fail_{uuid.uuid4().hex[:10]}",
            subscription_id=sub.id,
            user_id=user.id,
            provider=sub.provider,
            provider_payment_id=f"pay_failed_{uuid.uuid4().hex[:8]}",
            amount=12.0 if sub.plan_id == 'voyager' else 29.0,
            currency='USD',
            status='failed',
            failure_reason='Card declined by issuing bank (insufficient funds)'
        )
        db.session.add(pay)

    elif action == 'renew':
        sub.status = 'active'
        sub.current_period_start = now
        sub.current_period_end = now + timedelta(days=30)
        sub.next_billing_at = sub.current_period_end
        plan = db.session.get(Plan, sub.plan_id)
        pay = Payment(
            id=f"pay_renew_{uuid.uuid4().hex[:10]}",
            subscription_id=sub.id,
            user_id=user.id,
            provider=sub.provider,
            amount=plan.price if plan else 12.0,
            currency='USD',
            status='succeeded'
        )
        db.session.add(pay)

    elif action == 'reset_to_free':
        sub.plan_id = 'free'
        sub.status = 'free'
        sub.trial_start = None
        sub.trial_end = None
        sub.cancel_at_period_end = False
        sub.cancelled_at = None

    db.session.commit()

    return jsonify({
        'success': True,
        'action': action,
        'subscription': sub.to_dict()
    })
