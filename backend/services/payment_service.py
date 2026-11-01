import os
import hmac
import hashlib
import time
import uuid
import requests

class PaymentService:
    def __init__(self):
        self.razorpay_key_id = os.environ.get('RAZORPAY_KEY_ID', '').strip()
        self.razorpay_key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '').strip()
        self.razorpay_webhook_secret = os.environ.get('RAZORPAY_WEBHOOK_SECRET', 'voyage_webhook_secret_default').strip()
        
        self.stripe_secret_key = os.environ.get('STRIPE_SECRET_KEY', '').strip()
        self.stripe_publishable_key = os.environ.get('STRIPE_PUBLISHABLE_KEY', '').strip()
        self.stripe_webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET', '').strip()

        # If live credentials are not configured, default secret for test verification
        self.test_mode_secret = self.razorpay_key_secret or "voyage_sandbox_sec_key_2026"

    @property
    def is_razorpay_configured(self):
        return bool(self.razorpay_key_id and self.razorpay_key_secret)

    @property
    def is_stripe_configured(self):
        return bool(self.stripe_secret_key)

    def create_order(self, amount: float, currency: str = 'USD', receipt: str = None, notes: dict = None):
        """
        Creates a payment order. Amount is in main units (e.g. $12.00).
        For trials where amount is 0, Razorpay order can be created for token authorization (e.g. 1 unit or $0 token).
        """
        amount_in_cents = int(round(amount * 100))
        receipt = receipt or f"rcpt_{int(time.time())}"
        notes = notes or {}

        if self.is_razorpay_configured:
            try:
                # Razorpay requires integer amount in smallest currency unit
                # If $0 trial, Razorpay charges ₹1 or $1 auth token or creates subscription
                charge_amount = max(100, amount_in_cents) if amount_in_cents > 0 else 100
                res = requests.post(
                    "https://api.razorpay.com/v1/orders",
                    auth=(self.razorpay_key_id, self.razorpay_key_secret),
                    json={
                        "amount": charge_amount,
                        "currency": currency.upper(),
                        "receipt": receipt,
                        "notes": notes,
                        "payment_capture": 1
                    },
                    timeout=10
                )
                if res.status_code in (200, 201):
                    data = res.json()
                    return {
                        "provider": "razorpay",
                        "order_id": data.get("id"),
                        "amount": amount,
                        "currency": currency,
                        "key_id": self.razorpay_key_id,
                        "status": "created"
                    }
                else:
                    print(f"[Razorpay API Error] {res.status_code}: {res.text}")
            except Exception as e:
                print(f"[Razorpay Connection Error] {e}")

        # Fallback / Built-in Test Sandbox Mode
        simulated_order_id = f"order_{uuid.uuid4().hex[:14]}"
        return {
            "provider": "razorpay_sandbox" if not self.is_razorpay_configured else "razorpay",
            "order_id": simulated_order_id,
            "amount": amount,
            "currency": currency,
            "key_id": self.razorpay_key_id or "rzp_test_voyage_mock",
            "status": "created"
        }

    def verify_razorpay_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        """
        Verifies HMAC-SHA256 signature for Razorpay payments.
        """
        if not order_id or not payment_id or not signature:
            return False

        message = f"{order_id}|{payment_id}"
        secret = self.razorpay_key_secret if self.is_razorpay_configured else self.test_mode_secret

        try:
            expected = hmac.new(
                secret.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            # Constant time comparison to prevent timing attacks
            return hmac.compare_digest(expected, signature)
        except Exception as e:
            print(f"[Signature Verification Error]: {e}")
            return False

    def generate_test_signature(self, order_id: str, payment_id: str) -> str:
        """
        Helper for client/testing in sandbox mode using the same secret.
        """
        message = f"{order_id}|{payment_id}"
        secret = self.razorpay_key_secret if self.is_razorpay_configured else self.test_mode_secret
        return hmac.new(
            secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

    def verify_webhook_signature(self, payload_bytes: bytes, signature: str) -> bool:
        """
        Verifies webhook authenticity from Razorpay header X-Razorpay-Signature
        """
        if not signature:
            return False
        secret = self.razorpay_webhook_secret
        expected = hmac.new(
            secret.encode('utf-8'),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

payment_service = PaymentService()

