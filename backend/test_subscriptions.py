import unittest
import json
from datetime import datetime, timezone, timedelta
from backend.app import create_app
from backend.database import db
from backend.models import User, Plan, Subscription, Payment, Invoice
from backend.services.payment_service import payment_service

class TestSubscriptionLifecycle(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    def test_01_user_registration_and_free_plan(self):
        """Test registration and default Free (Explorer) subscription"""
        email = f"test_{int(datetime.now().timestamp())}@voyageai.test"
        res = self.client.post('/api/auth/register', json={
            'email': email,
            'password': 'password123',
            'name': 'Test Traveler'
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        token = data['token']
        self.assertIsNotNone(token)

        # Check subscription status
        status_res = self.client.get('/api/subscription/status', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(status_res.status_code, 200)
        status_data = status_res.get_json()
        sub = status_data['subscription']
        self.assertEqual(sub['plan_id'], 'free')
        self.assertEqual(sub['status'], 'free')

        # Check feature limits for Explorer
        feat_res = self.client.get('/api/subscription/features', headers={'Authorization': f'Bearer {token}'})
        feat = feat_res.get_json()
        self.assertFalse(feat['can_use_chat'])
        self.assertEqual(feat['max_trip_days'], 7)
        self.assertEqual(feat['max_monthly_itineraries'], 3)
        self.assertFalse(feat['can_white_label_pdf'])

    def test_02_unauthenticated_checkout_denied(self):
        """Test that unauthenticated requests to checkout or status are blocked"""
        res = self.client.post('/api/subscription/checkout/create', json={'plan_id': 'voyager'})
        self.assertEqual(res.status_code, 401)

        res2 = self.client.get('/api/subscription/status')
        self.assertEqual(res2.status_code, 401)

    def test_03_voyager_checkout_and_trial_activation(self):
        """Test Voyager 7-day free trial checkout, signature verification, and activation"""
        # Register user
        email = f"voyager_{int(datetime.now().timestamp())}@voyageai.test"
        reg_res = self.client.post('/api/auth/register', json={'email': email})
        token = reg_res.get_json()['token']

        # Create checkout order
        checkout_res = self.client.post(
            '/api/subscription/checkout/create',
            headers={'Authorization': f'Bearer {token}'},
            json={'plan_id': 'voyager'}
        )
        self.assertEqual(checkout_res.status_code, 200)
        co_data = checkout_res.get_json()
        self.assertEqual(co_data['amount_due_today'], 0.0) # $0 due today
        self.assertEqual(co_data['recurring_price'], 12.0)
        self.assertEqual(co_data['trial_days'], 7)
        order_id = co_data['order']['order_id']

        # Verify checkout with payment signature
        payment_id = "pay_test_voyager_trial"
        sig = payment_service.generate_test_signature(order_id, payment_id)

        verify_res = self.client.post(
            '/api/subscription/checkout/verify',
            headers={'Authorization': f'Bearer {token}'},
            json={
                'plan_id': 'voyager',
                'order_id': order_id,
                'payment_id': payment_id,
                'signature': sig,
                'payment_method': 'card'
            }
        )
        self.assertEqual(verify_res.status_code, 200)
        v_data = verify_res.get_json()
        sub = v_data['subscription']
        self.assertEqual(sub['status'], 'trialing')
        self.assertEqual(sub['plan_id'], 'voyager')
        self.assertEqual(sub['remaining_trial_days'], 7)
        self.assertIsNotNone(sub['trial_start'])
        self.assertIsNotNone(sub['trial_end'])

        # Features must be unlocked
        feat_res = self.client.get('/api/subscription/features', headers={'Authorization': f'Bearer {token}'})
        feat = feat_res.get_json()
        self.assertTrue(feat['can_use_chat'])
        self.assertEqual(feat['max_trip_days'], 30)
        self.assertGreater(feat['max_monthly_itineraries'], 100)

        # Invoice should be generated ($0 trial authorization)
        inv_res = self.client.get('/api/subscription/invoices', headers={'Authorization': f'Bearer {token}'})
        invs = inv_res.get_json()['invoices']
        self.assertEqual(len(invs), 1)
        self.assertEqual(invs[0]['amount'], 0.0)
        self.assertEqual(invs[0]['status'], 'paid')

    def test_04_trial_cancellation(self):
        """Test cancelling the Voyager free trial"""
        email = f"cancel_{int(datetime.now().timestamp())}@voyageai.test"
        reg_res = self.client.post('/api/auth/register', json={'email': email})
        token = reg_res.get_json()['token']

        # Start trial
        co_res = self.client.post('/api/subscription/checkout/create', headers={'Authorization': f'Bearer {token}'}, json={'plan_id': 'voyager'})
        order_id = co_res.get_json()['order']['order_id']
        sig = payment_service.generate_test_signature(order_id, 'pay_can_1')
        self.client.post('/api/subscription/checkout/verify', headers={'Authorization': f'Bearer {token}'}, json={
            'plan_id': 'voyager', 'order_id': order_id, 'payment_id': 'pay_can_1', 'signature': sig
        })

        # Cancel
        cancel_res = self.client.post('/api/subscription/cancel', headers={'Authorization': f'Bearer {token}'}, json={'immediate': True})
        self.assertEqual(cancel_res.status_code, 200)
        sub = cancel_res.get_json()['subscription']
        self.assertEqual(sub['status'], 'cancelled')

        # Features should be locked after cancellation
        feat_res = self.client.get('/api/subscription/features', headers={'Authorization': f'Bearer {token}'})
        feat = feat_res.get_json()
        self.assertFalse(feat['can_use_chat'])
        self.assertEqual(feat['max_trip_days'], 7)

    def test_05_elite_subscription_purchase_and_features(self):
        """Test purchasing Elite plan ($29/mo) and verifying all exclusive features"""
        email = f"elite_{int(datetime.now().timestamp())}@voyageai.test"
        reg_res = self.client.post('/api/auth/register', json={'email': email})
        token = reg_res.get_json()['token']

        # Create checkout for Elite
        co_res = self.client.post('/api/subscription/checkout/create', headers={'Authorization': f'Bearer {token}'}, json={'plan_id': 'elite'})
        self.assertEqual(co_res.status_code, 200)
        co_data = co_res.get_json()
        self.assertEqual(co_data['amount_due_today'], 29.0)
        order_id = co_data['order']['order_id']

        # Verify payment
        payment_id = "pay_elite_order_123"
        sig = payment_service.generate_test_signature(order_id, payment_id)
        verify_res = self.client.post(
            '/api/subscription/checkout/verify',
            headers={'Authorization': f'Bearer {token}'},
            json={
                'plan_id': 'elite',
                'order_id': order_id,
                'payment_id': payment_id,
                'signature': sig,
                'payment_method': 'card'
            }
        )
        self.assertEqual(verify_res.status_code, 200)
        sub = verify_res.get_json()['subscription']
        self.assertEqual(sub['status'], 'active')
        self.assertEqual(sub['plan_id'], 'elite')

        # Check features
        feat_res = self.client.get('/api/subscription/features', headers={'Authorization': f'Bearer {token}'})
        feat = feat_res.get_json()
        self.assertTrue(feat['can_use_chat'])
        self.assertEqual(feat['max_trip_days'], 30)
        self.assertTrue(feat['can_white_label_pdf'])
        self.assertTrue(feat['can_multi_city'])
        self.assertTrue(feat['can_group_collab'])
        self.assertTrue(feat['has_api_access'])

        # Check $29 invoice
        inv_res = self.client.get('/api/subscription/invoices', headers={'Authorization': f'Bearer {token}'})
        invs = inv_res.get_json()['invoices']
        self.assertEqual(len(invs), 1)
        self.assertEqual(invs[0]['amount'], 29.0)
        self.assertEqual(invs[0]['status'], 'paid')

    def test_06_voyager_upgrade_to_elite(self):
        """Test upgrading an active Voyager subscription to Elite"""
        email = f"upgrade_{int(datetime.now().timestamp())}@voyageai.test"
        reg_res = self.client.post('/api/auth/register', json={'email': email})
        token = reg_res.get_json()['token']

        # Activate Voyager
        co_res = self.client.post('/api/subscription/checkout/create', headers={'Authorization': f'Bearer {token}'}, json={'plan_id': 'voyager'})
        order_id = co_res.get_json()['order']['order_id']
        sig = payment_service.generate_test_signature(order_id, 'pay_v_upg')
        self.client.post('/api/subscription/checkout/verify', headers={'Authorization': f'Bearer {token}'}, json={
            'plan_id': 'voyager', 'order_id': order_id, 'payment_id': 'pay_v_upg', 'signature': sig
        })

        # Upgrade to Elite
        upg_res = self.client.post('/api/subscription/upgrade', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(upg_res.status_code, 200)
        sub = upg_res.get_json()['subscription']
        self.assertEqual(sub['plan_id'], 'elite')
        self.assertEqual(sub['status'], 'active')

        # Feature verification
        feat = self.client.get('/api/subscription/features', headers={'Authorization': f'Bearer {token}'}).get_json()
        self.assertTrue(feat['can_white_label_pdf'])

    def test_07_lifecycle_simulations(self):
        """Test simulated lifecycle transitions: trial expiration, payment failure, and renewal"""
        email = f"lifecycle_{int(datetime.now().timestamp())}@voyageai.test"
        reg_res = self.client.post('/api/auth/register', json={'email': email})
        token = reg_res.get_json()['token']

        # Start trial
        co_res = self.client.post('/api/subscription/checkout/create', headers={'Authorization': f'Bearer {token}'}, json={'plan_id': 'voyager'})
        order_id = co_res.get_json()['order']['order_id']
        sig = payment_service.generate_test_signature(order_id, 'pay_v_lc')
        self.client.post('/api/subscription/checkout/verify', headers={'Authorization': f'Bearer {token}'}, json={
            'plan_id': 'voyager', 'order_id': order_id, 'payment_id': 'pay_v_lc', 'signature': sig
        })

        # Fast-forward trial expiration -> transitions to active
        sim1 = self.client.post('/api/subscription/simulate', headers={'Authorization': f'Bearer {token}'}, json={'action': 'expire_trial'})
        self.assertEqual(sim1.status_code, 200)
        self.assertEqual(sim1.get_json()['subscription']['status'], 'active')

        # Simulate payment failure -> transitions to past_due
        sim2 = self.client.post('/api/subscription/simulate', headers={'Authorization': f'Bearer {token}'}, json={'action': 'payment_failed'})
        self.assertEqual(sim2.status_code, 200)
        self.assertEqual(sim2.get_json()['subscription']['status'], 'past_due')

        # Simulate renewal -> recovers to active
        sim3 = self.client.post('/api/subscription/simulate', headers={'Authorization': f'Bearer {token}'}, json={'action': 'renew'})
        self.assertEqual(sim3.status_code, 200)
        self.assertEqual(sim3.get_json()['subscription']['status'], 'active')

    def test_08_webhooks(self):
        """Test Razorpay/Stripe webhook handler"""
        res = self.client.post('/api/subscription/webhook', json={
            'event': 'payment.captured',
            'payload': {
                'payment': {
                    'entity': {
                        'id': 'pay_wh_test_1',
                        'amount': 1200,
                        'notes': {}
                    }
                }
            }
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()['received'])

if __name__ == '__main__':
    unittest.main()

